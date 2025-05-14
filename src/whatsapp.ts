import { Boom } from '@hapi/boom'
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WASocket,
  type ConnectionState,
  type WAMessage,
} from 'baileys'
import type { ILogger } from 'baileys/lib/Utils/logger'
import {
  deleteQRCode,
  deleteAuthInfo,
  ReconnectError,
  logMessageToJson,
} from './helpers'
import { showQRCode } from './helpers'
import { AUTH_FOLDER_PATH, CONNECTION_MESSAGES } from './constants'
import { MessageFilter, RegexCriteria, ReplyMessageCriteria } from './filters'

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
  // Example filter: Forward messages that are replies
  // Main message should match a course code pattern (#ABC 123)
  // And the replied message should contain "assignment"
  const filter = new MessageFilter('Courses', [
    new ReplyMessageCriteria(
      new RegexCriteria(/#[A-Z]{3}\s?\d{3}|#GENERAL/), // Main message criteria
      undefined, // Replied message criteria
    ),
  ])

  if (filter.matches(message)) {
    // Log the message with the filter name
    console.log(`Message matched filter: ${filter.getDescription()}`)
    // Use the filter's built-in logging method
    filter.logMatch(message)
    // Here you would add the code to forward the message to Telegram
  }
}

async function handleDisconnect(reject: (reason?: any) => void, error?: Error) {
  {
    const statusCode = (error as Boom)?.output?.statusCode
    console.log(CONNECTION_MESSAGES.CLOSED, error?.message)
    await deleteQRCode()

    if (statusCode === DisconnectReason.restartRequired)
      reject(new ReconnectError())
    else if (statusCode === DisconnectReason.loggedOut) {
      console.log(CONNECTION_MESSAGES.LOGGED_OUT)
      await deleteAuthInfo()
      reject(new ReconnectError())
    } else reject(CONNECTION_MESSAGES.CLOSED_UNKNOWN)
  }
}
