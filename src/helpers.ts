import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import {
  QR_CODE_PATH,
  QR_CODE_MESSAGES,
  ERROR_MESSAGES,
  AUTH_FOLDER_PATH,
  CONNECTION_MESSAGES,
  LOGS_FOLDER_PATH,
  MESSAGES_LOG_FILE_PATH,
} from './constants'

export async function showQRCode(qr: string) {
  console.log(QR_CODE_MESSAGES.RECEIVED)
  try {
    await QRCode.toFile(QR_CODE_PATH, qr)
    console.log(QR_CODE_MESSAGES.SAVED)
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
