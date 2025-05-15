import { Boom } from '@hapi/boom'
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WASocket,
  type ConnectionState,
  type WAMessage,
  proto,
} from 'baileys'
import type { ILogger } from 'baileys/lib/Utils/logger'
import { ReconnectError } from './helpers/helpers'
import getQuotedMessage from './helpers/getQuotedMessage'
import notifyAdminAndShutdown from './helpers/notifyAdminAndShutdown'
import { logMessageToJson } from './helpers/logMessageToJson'
import deleteAuthInfo from './helpers/deleteAuthInfo'
import deleteQRCode from './helpers/deleteQRCode'
import showQRCode from './helpers/showQRCode'
import {
  AUTH_FOLDER_PATH,
  CONNECTION_MESSAGES,
  MAX_CONSECUTIVE_ERRORS,
  ERROR_THRESHOLD_TIME_MS,
  HEALTH_CHECK_INTERVAL,
} from './constants'
import { MessageFilter, RegexCriteria, ReplyMessageCriteria } from './filters'
import { extractMessageText, forwardQuotedMessageToTelegram } from './bridge'

// Variables for error handling tracking
let consecutiveErrors = 0
let lastErrorTime = 0

export async function createWhatsAppSocket(logger: ILogger): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER_PATH)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const socket = makeWASocket({
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    shouldSyncHistoryMessage: () => false,
  })

  try {
    await connectSocket(socket, saveCreds)
  } catch (error) {
    if (error instanceof ReconnectError) {
      console.error(CONNECTION_MESSAGES.RECONNECTING)
      return await createWhatsAppSocket(logger)
    } else throw error
  }

  handleMessages(socket)
  setupConnectionHealthCheck(socket)

  return socket satisfies WASocket
}

function connectSocket(
  socket: WASocket,
  saveCreds: () => Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.ev.on('creds.update', saveCreds)
    socket.ev.on(
      'connection.update',
      async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) await showQRCode(qr)

        if (connection === 'close')
          await handleDisconnect(reject, lastDisconnect?.error)

        if (connection === 'open') {
          console.log(CONNECTION_MESSAGES.ESTABLISHED)
          await deleteQRCode()
          // Reset error counter when connection is successful
          consecutiveErrors = 0
          lastErrorTime = 0
          resolve()
        }
      },
    )
  })
}

function handleMessages(socket: WASocket) {
  socket.ev.on('messages.upsert', async ({ type, messages }) => {
    if (type !== 'notify') return
    for (const message of messages) handleMessage(message)
  })
}

function handleMessage(message: WAMessage) {
  // Log all messages for debugging
  logMessageToJson(message)

  // Example filter: Forward replies that contain course codes
  const filter = new MessageFilter('Courses', [
    new ReplyMessageCriteria(
      new RegexCriteria(/#([A-Z]{3}\s?\d{3}|GENERAL)/), // Main message criteria
      undefined, // Replied message criteria
    ),
  ])
  if (filter.matches(message)) {
    // Log the message with the filter name
    console.log(`Message matched filter: ${filter.getDescription()}`)
    // Use the filter's built-in logging method
    filter.logMatch(message)

    // Get the quoted message
    const quotedMessage = getQuotedMessage(message)
    // Extract the topic name from the message (removing the # symbol)
    const messageText = extractMessageText(message)
    const topicMatch = messageText.match(/#([A-Z]{3}\s?\d{3}|GENERAL)/)
    let topicName = topicMatch ? topicMatch[1].trim() : undefined

    // Remove spaces in the topic name to match the format in the topic map
    if (topicName && topicName !== 'GENERAL') {
      topicName = topicName.replace(/\s+/, ' ')
    }

    if (topicName) {
      console.log(`Extracted topic: ${topicName}`)
    }

    // Forward the message to Telegram
    forwardQuotedMessageToTelegram(quotedMessage, topicName)
  }
}

async function handleDisconnect(reject: (reason?: any) => void, error?: Error) {
  const statusCode = (error as Boom)?.output?.statusCode
  console.log(CONNECTION_MESSAGES.CLOSED, error?.message)
  await deleteQRCode()

  // Track errors
  const now = Date.now()
  if (now - lastErrorTime < ERROR_THRESHOLD_TIME_MS) {
    consecutiveErrors++
  } else {
    consecutiveErrors = 1 // Reset but count the current error
  }
  lastErrorTime = now

  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    // Critical failure detected, notify admin and shut down
    return await notifyAdminAndShutdown(
      error,
      `Multiple WhatsApp connection failures (${consecutiveErrors})`,
    )
  }
  if (statusCode === DisconnectReason.restartRequired)
    reject(new ReconnectError())
  else if (statusCode === DisconnectReason.loggedOut) {
    console.log(CONNECTION_MESSAGES.LOGGED_OUT)
    await deleteAuthInfo()
    // Notify admin about logged out status
    await notifyAdminAndShutdown(
      new Error('WhatsApp logged out'),
      'WhatsApp account logged out',
    )
    reject(new ReconnectError())
  } else reject(CONNECTION_MESSAGES.CLOSED_UNKNOWN)
}

/**
 * Set up periodic health checks for WhatsApp connection
 */
function setupConnectionHealthCheck(socket: WASocket): void {
  setInterval(async () => {
    try {
      // Try to ping to check connection
      try {
        // This will throw if connection is broken
        await socket.sendPresenceUpdate('available', '')

        // If we get here, connection is still working
        consecutiveErrors = 0
      } catch (pingError) {
        console.error('Health check failed: WhatsApp connection test failed')

        // Connection is definitely broken
        if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          await notifyAdminAndShutdown(
            pingError,
            'WhatsApp connection health check failed',
          )
        }
      }
    } catch (error) {
      console.error('Error during WhatsApp connection health check:', error)

      // Check if this is a persistent connection issue
      if (++consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        await notifyAdminAndShutdown(error, 'Multiple failed health checks')
      }
    }
  }, HEALTH_CHECK_INTERVAL)
}
