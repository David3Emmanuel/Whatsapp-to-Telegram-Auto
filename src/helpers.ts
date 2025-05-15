import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import {
  QR_CODE_PATH,
  QR_CODE_MESSAGES,
  ERROR_MESSAGES,
  AUTH_FOLDER_PATH,
  CONNECTION_MESSAGES,
  LOGS_FOLDER_PATH,
  MESSAGES_LOG_FILE_PATH,
  TELEGRAM_ADMIN_ID,
} from './constants'
import { sendTelegramMessage } from './telegram'
import type { WAMessage } from 'baileys'

// Load environment variables
dotenv.config()

export async function showQRCode(qr: string) {
  console.log(QR_CODE_MESSAGES.RECEIVED)
  try {
    await QRCode.toFile(QR_CODE_PATH, qr)
    console.log(QR_CODE_MESSAGES.SAVED)
    const port = process.env.PORT || 3001
    console.log(`${QR_CODE_MESSAGES.VIEW} http://localhost:${port}/qrcode`)
  } catch (err) {
    console.error(ERROR_MESSAGES.QR_CODE_SAVE, err)
  }
}
export class ReconnectError extends Error {}
export async function deleteQRCode(): Promise<void> {
  try {
    if (fs.existsSync(QR_CODE_PATH)) {
      fs.unlinkSync(QR_CODE_PATH)
      console.log(QR_CODE_MESSAGES.DELETED)
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.QR_CODE_DELETE, error)
  }
}

export async function deleteAuthInfo(): Promise<void> {
  try {
    if (fs.existsSync(AUTH_FOLDER_PATH)) {
      console.log(CONNECTION_MESSAGES.LOGGED_OUT)
      const files = fs.readdirSync(AUTH_FOLDER_PATH)

      for (const file of files) {
        const filePath = path.join(AUTH_FOLDER_PATH, file)
        fs.unlinkSync(filePath)
      }

      console.log(CONNECTION_MESSAGES.AUTH_CLEARED)
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.AUTH_INFO_DELETE, error)
  }
}

export async function logMessageToJson(message: any): Promise<void> {
  try {
    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_FOLDER_PATH)) {
      fs.mkdirSync(LOGS_FOLDER_PATH, { recursive: true })
    }

    // Read existing messages or initialize empty array
    let messages: any[] = []
    if (fs.existsSync(MESSAGES_LOG_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(MESSAGES_LOG_FILE_PATH, 'utf8')
        messages = JSON.parse(fileContent)
      } catch (error) {
        // If file exists but is corrupted or empty, start with an empty array
        console.error(
          'Error reading messages log file, starting with empty array:',
          error,
        )
      }
    }

    // Add timestamp to message
    const messageWithTimestamp = {
      ...message,
      loggedAt: new Date().toISOString(),
    }

    // Add new message
    messages.push(messageWithTimestamp)

    // Write back to file
    fs.writeFileSync(
      MESSAGES_LOG_FILE_PATH,
      JSON.stringify(messages, null, 2),
      'utf8',
    )

    // console.log(`Message logged to ${MESSAGES_LOG_FILE_PATH}`)
  } catch (error) {
    console.error('Error logging message to JSON:', error)
  }
}

/**
 * Log a message that matched a filter to a specific log file based on filter name
 * @param message The WhatsApp message that matched the filter
 * @param filterName The name of the filter that matched
 */
export function logFilterMatch(message: any, filterName: string): void {
  try {
    // Create a filter-specific log file path
    const filterLogFilePath = path.join(LOGS_FOLDER_PATH, `${filterName}.json`)

    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_FOLDER_PATH)) {
      fs.mkdirSync(LOGS_FOLDER_PATH, { recursive: true })
    }

    // Read existing messages for this filter or initialize empty array
    let filteredMessages: any[] = []
    if (fs.existsSync(filterLogFilePath)) {
      try {
        const fileContent = fs.readFileSync(filterLogFilePath, 'utf8')
        filteredMessages = JSON.parse(fileContent)
      } catch (error) {
        console.error(
          `Error reading filter log file for ${filterName}, starting with empty array:`,
          error,
        )
      }
    }

    // Add timestamp to message
    const messageWithTimestamp = {
      ...message,
      loggedAt: new Date().toISOString(),
      filterName,
    }

    // Add new message to filter-specific log
    filteredMessages.push(messageWithTimestamp)

    // Write back to filter-specific log file
    fs.writeFileSync(
      filterLogFilePath,
      JSON.stringify(filteredMessages, null, 2),
      'utf8',
    )

    console.log(
      `Message matched by filter "${filterName}" logged to ${filterLogFilePath}`,
    )
  } catch (error) {
    console.error(`Error logging message for filter "${filterName}":`, error)
  }
}

/**
 * Notify admin about a critical WhatsApp connection failure and shutdown gracefully
 * @param error The error that caused the failure
 * @param errorType A descriptive type of error for easier identification
 */
export async function notifyAdminAndShutdown(
  error: any,
  errorType: string,
): Promise<never> {
  try {
    console.error(ERROR_MESSAGES.WHATSAPP_CONNECTION, errorType, error)

    // Only attempt to notify if admin ID is set
    if (TELEGRAM_ADMIN_ID) {
      try {
        const timestamp = new Date().toISOString()
        const errorMessage = error?.message || 'No error message'
        const errorStack = error?.stack || 'No stack trace'

        const message =
          `🚨 *CRITICAL ERROR ALERT* 🚨\n\n` +
          `*Time*: ${timestamp}\n` +
          `*Type*: ${errorType}\n` +
          `*Error*: ${errorMessage}\n\n` +
          `Server will shut down gracefully now.`

        await sendTelegramMessage(TELEGRAM_ADMIN_ID, message)

        // Log detailed error info to a file for debugging
        const errorLogPath = path.join(LOGS_FOLDER_PATH, 'critical-errors.log')
        const logEntry = `[${timestamp}] ${errorType}: ${errorMessage}\n${errorStack}\n\n`

        // Ensure logs directory exists
        if (!fs.existsSync(LOGS_FOLDER_PATH)) {
          fs.mkdirSync(LOGS_FOLDER_PATH, { recursive: true })
        }

        fs.appendFileSync(errorLogPath, logEntry)
      } catch (notificationError) {
        console.error('Failed to notify admin via Telegram:', notificationError)
      }
    } else {
      console.warn(
        'TELEGRAM_ADMIN_ID not set. Could not send notification about critical error.',
      )
    }

    console.log(ERROR_MESSAGES.GRACEFUL_SHUTDOWN)

    // Give some time for pending operations to complete before shutdown
    setTimeout(() => {
      process.exit(1)
    }, 3000)

    // This won't be reached, but TypeScript requires a never return
    return new Promise((_, reject) => {
      reject('Server shutting down')
    }) as never
  } catch (finalError) {
    console.error('Fatal error during shutdown process:', finalError)
    process.exit(1)
  }
}
/**
 * Extract quoted message from a reply
 */
export function getQuotedMessage(message: WAMessage): WAMessage | null {
  // Extract contextInfo from different message types
  const contextInfo =
    message.message?.extendedTextMessage?.contextInfo ||
    message.message?.imageMessage?.contextInfo ||
    message.message?.videoMessage?.contextInfo ||
    message.message?.audioMessage?.contextInfo ||
    message.message?.documentMessage?.contextInfo ||
    message.message?.stickerMessage?.contextInfo

  if (!contextInfo || !contextInfo.quotedMessage) return null

  // Construct a message object for the quoted message
  const quotedMessage: WAMessage = {
    key: {
      remoteJid: message.key.remoteJid,
      fromMe: contextInfo.participant === 'self',
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
    },
    message: contextInfo.quotedMessage,
    messageTimestamp: message.messageTimestamp, // Use the same timestamp
    pushName: contextInfo.participant
      ? contextInfo.participant.split('@')[0]
      : 'Unknown',
  }

  return quotedMessage
}
