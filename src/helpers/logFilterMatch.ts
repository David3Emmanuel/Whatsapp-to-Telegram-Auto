import fs from 'fs'
import path from 'path'
import { LOGS_FOLDER_PATH } from '../constants'

/**
 * Log a message that matched a filter to a specific log file based on filter name
 * @param message The WhatsApp message that matched the filter
 * @param filterName The name of the filter that matched
 */
export default function logFilterMatch(message: any, filterName: string): void {
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
