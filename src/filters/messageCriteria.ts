import { WAMessage } from 'baileys'
import fs from 'fs'
import path from 'path'
import { LOGS_FOLDER_PATH } from '../constants'

/**
 * Base interface for all message criteria
 * Used to determine if a WhatsApp message should be forwarded
 */
export interface IMessageCriteria {
  /**
   * Checks if a message meets the criteria
   * @param message The WhatsApp message to check
   * @returns true if the message meets the criteria, false otherwise
   */
  matches(message: WAMessage): boolean

  /**
   * Returns a human-readable description of the criteria
   * @returns A string describing the criteria
   */
  getDescription(): string
}

/**
 * Abstract base class providing common functionality for criteria
 */
export abstract class BaseMessageCriteria implements IMessageCriteria {
  abstract matches(message: WAMessage): boolean
  abstract getDescription(): string
}

/**
 * A composite filter that allows combining multiple criteria with logical operations
 */
export class MessageFilter {
  private criteria: Array<IMessageCriteria> = []
  private mode: 'AND' | 'OR' = 'AND'
  private name: string

  /**
   * Creates a new filter with a name and optional initial criteria
   * @param name Required name for the filter (used for logging)
   * @param initialCriteria Optional initial criteria to add
   * @param mode Logical operation mode ('AND' or 'OR'), defaults to 'AND'
   */
  constructor(
    name: string,
    initialCriteria?: IMessageCriteria[],
    mode: 'AND' | 'OR' = 'AND',
  ) {
    this.name = name
    if (initialCriteria) {
      this.criteria = [...initialCriteria]
    }
    this.mode = mode
  }

  /**
   * Add a criteria to the filter
   * @param criteria The criteria to add
   * @returns this filter instance for chaining
   */
  addCriteria(criteria: IMessageCriteria): MessageFilter {
    this.criteria.push(criteria)
    return this
  }

  /**
   * Set the filter mode to AND (all criteria must match)
   * @returns this filter instance for chaining
   */
  useAndMode(): MessageFilter {
    this.mode = 'AND'
    return this
  }

  /**
   * Set the filter mode to OR (any criteria can match)
   * @returns this filter instance for chaining
   */
  useOrMode(): MessageFilter {
    this.mode = 'OR'
    return this
  }

  /**
   * Check if a message matches the filter criteria
   * @param message The WhatsApp message to check
   * @returns true if the message matches the filter, false otherwise
   */
  matches(message: WAMessage): boolean {
    if (this.criteria.length === 0) {
      return false // No criteria means no match
    }

    if (this.mode === 'AND') {
      return this.criteria.every((criteria) => criteria.matches(message))
    } else {
      return this.criteria.some((criteria) => criteria.matches(message))
    }
  }

  /**
   * Gets a description of the filter
   * @returns A string describing the filter
   */ /**
   * Gets a description of the filter
   * @returns A string describing the filter with its name
   */
  getDescription(): string {
    if (this.criteria.length === 0) {
      return `${this.name}: Empty filter (matches nothing)`
    }

    const criteriaDescriptions = this.criteria.map((c) => c.getDescription())
    const joinOperator = this.mode === 'AND' ? ' AND ' : ' OR '
    return `${this.name}: (${criteriaDescriptions.join(joinOperator)})`
  }
  /**
   * Gets the name of the filter
   * @returns The filter name
   */
  getName(): string {
    return this.name
  }

  /**
   * Logs a message that matched this filter to a specific log file
   * @param message The WhatsApp message that matched the filter
   */
  logMatch(message: any): void {
    try {
      // Create a filter-specific log file path
      const filterLogFilePath = path.join(LOGS_FOLDER_PATH, `${this.name}.json`)

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
            `Error reading filter log file for ${this.name}, starting with empty array:`,
            error,
          )
        }
      }

      // Add timestamp to message
      const messageWithTimestamp = {
        ...message,
        loggedAt: new Date().toISOString(),
        filterName: this.name,
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
        `Message matched by filter "${this.name}" logged to ${filterLogFilePath}`,
      )
    } catch (error) {
      console.error(`Error logging message for filter "${this.name}":`, error)
    }
  }
}
