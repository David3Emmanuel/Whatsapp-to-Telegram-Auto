import fs from 'fs'
import path from 'path'
import {
  ERROR_MESSAGES,
  TELEGRAM_ADMIN_ID,
  LOGS_FOLDER_PATH,
} from '../constants'
import { sendTelegramMessage } from '../telegram'

/**
 * Notify admin about a critical WhatsApp connection failure and shutdown gracefully
 * @param error The error that caused the failure
 * @param errorType A descriptive type of error for easier identification
 */
export default async function notifyAdminAndShutdown(
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
