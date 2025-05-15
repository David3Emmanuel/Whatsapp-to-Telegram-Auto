import fs from 'fs'
import { LOGS_FOLDER_PATH, MESSAGES_LOG_FILE_PATH } from '../constants'

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
