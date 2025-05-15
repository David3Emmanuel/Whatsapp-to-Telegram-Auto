import { WAMessage } from 'baileys'
import { BaseMessageCriteria } from './messageCriteria'
import { getQuotedMessage } from '../helpers'

/**
 * Checks if a message comes from a specific contact or group
 */
export class SenderCriteria extends BaseMessageCriteria {
  private senderId: string

  /**
   * @param senderId The JID (WhatsApp ID) of the sender to match
   */
  constructor(senderId: string) {
    super()
    this.senderId = senderId
  }

  matches(message: WAMessage): boolean {
    return message.key.remoteJid === this.senderId
  }

  getDescription(): string {
    return `From: ${this.senderId}`
  }
}

/**
 * Checks if a message contains specific text
 */
export class TextContentCriteria extends BaseMessageCriteria {
  private searchText: string
  private caseSensitive: boolean

  /**
   * @param searchText Text to search for in the message
   * @param caseSensitive Whether the search should be case-sensitive (default: false)
   */
  constructor(searchText: string, caseSensitive = false) {
    super()
    this.searchText = searchText
    this.caseSensitive = caseSensitive
  }

  matches(message: WAMessage): boolean {
    const messageText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ''

    if (this.caseSensitive) {
      return messageText.includes(this.searchText)
    } else {
      return messageText.toLowerCase().includes(this.searchText.toLowerCase())
    }
  }

  getDescription(): string {
    return `Contains text: "${this.searchText}"${
      this.caseSensitive ? ' (case-sensitive)' : ''
    }`
  }
}

/**
 * Checks if a message matches a regex pattern
 */
export class RegexCriteria extends BaseMessageCriteria {
  private pattern: RegExp

  /**
   * @param pattern Regular expression to match against the message content
   */
  constructor(pattern: RegExp) {
    super()
    this.pattern = pattern
  }

  matches(message: WAMessage): boolean {
    const messageText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ''

    return this.pattern.test(messageText)
  }

  getDescription(): string {
    return `Matches pattern: ${this.pattern.toString()}`
  }
}

/**
 * Checks if a message contains media attachments
 */
export class MediaTypeCriteria extends BaseMessageCriteria {
  private mediaTypes: string[]

  /**
   * @param mediaTypes Array of media types to check for ('image', 'video', 'audio', 'document', etc.)
   */
  constructor(mediaTypes: string[]) {
    super()
    this.mediaTypes = mediaTypes
  }

  matches(message: WAMessage): boolean {
    if (!message.message) return false

    return this.mediaTypes.some((mediaType) => {
      return !!message.message?.[
        `${mediaType}Message` as keyof WAMessage['message']
      ]
    })
  }

  getDescription(): string {
    return `Contains media type: ${this.mediaTypes.join(' or ')}`
  }
}

/**
 * Negates another criteria (logical NOT)
 */
export class NotCriteria extends BaseMessageCriteria {
  private criteria: BaseMessageCriteria

  /**
   * @param criteria The criteria to negate
   */
  constructor(criteria: BaseMessageCriteria) {
    super()
    this.criteria = criteria
  }

  matches(message: WAMessage): boolean {
    return !this.criteria.matches(message)
  }

  getDescription(): string {
    return `NOT (${this.criteria.getDescription()})`
  }
}

/**
 * Checks if a message is a reply to another message
 * Optionally applies criteria to both the main message and the replied message
 */
export class ReplyMessageCriteria extends BaseMessageCriteria {
  private mainMessageCriteria?: BaseMessageCriteria
  private repliedMessageCriteria?: BaseMessageCriteria

  /**
   * @param mainMessageCriteria Optional criteria to apply to the main message
   * @param repliedMessageCriteria Optional criteria to apply to the replied message
   */
  constructor(
    mainMessageCriteria?: BaseMessageCriteria,
    repliedMessageCriteria?: BaseMessageCriteria,
  ) {
    super()
    this.mainMessageCriteria = mainMessageCriteria
    this.repliedMessageCriteria = repliedMessageCriteria
  }

  matches(message: WAMessage): boolean {
    // Check if the message is a reply
    const isReply = this.isReplyMessage(message)

    // If it's not a reply, return false
    if (!isReply) return false

    // Check main message criteria if provided
    if (
      this.mainMessageCriteria &&
      !this.mainMessageCriteria.matches(message)
    ) {
      return false
    }

    // If there's no criteria for the replied message, return true
    if (!this.repliedMessageCriteria) return true

    // Get the quoted message and apply the criteria
    const quotedMessage = getQuotedMessage(message)
    if (!quotedMessage) return false

    return this.repliedMessageCriteria.matches(quotedMessage)
  }

  /**
   * Check if a message is a reply to another message
   */
  private isReplyMessage(message: WAMessage): boolean {
    // Check for contextInfo in various types of messages
    const contextInfo =
      message.message?.extendedTextMessage?.contextInfo ||
      message.message?.imageMessage?.contextInfo ||
      message.message?.videoMessage?.contextInfo ||
      message.message?.audioMessage?.contextInfo ||
      message.message?.documentMessage?.contextInfo ||
      message.message?.stickerMessage?.contextInfo

    return !!contextInfo?.stanzaId && !!contextInfo?.participant
  }

  getDescription(): string {
    let description = 'Is a reply'

    if (this.mainMessageCriteria) {
      description += ` where main message matches: ${this.mainMessageCriteria.getDescription()}`
    }

    if (this.repliedMessageCriteria) {
      description += ` to a message matching: ${this.repliedMessageCriteria.getDescription()}`
    } else {
      description += ' to any message'
    }

    return description
  }
}
