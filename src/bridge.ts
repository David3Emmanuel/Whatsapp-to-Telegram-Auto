import { WAMessage, downloadMediaMessage } from 'baileys'
import {
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramDocument,
} from './telegram'
import { TELEGRAM_CHAT_ID } from './constants'

/**
 * Extract text content from a WhatsApp message
 * @param message The WhatsApp message object
 * @returns The extracted text content
 */
export function extractMessageText(message: WAMessage): string {
  const messageContent = message.message
  if (!messageContent) return ''

  // Handle different message types
  if (messageContent.conversation) {
    return messageContent.conversation
  } else if (messageContent.extendedTextMessage?.text) {
    return messageContent.extendedTextMessage.text
  } else if (messageContent.imageMessage?.caption) {
    return messageContent.imageMessage.caption
  } else if (messageContent.videoMessage?.caption) {
    return messageContent.videoMessage.caption
  } else if (messageContent.documentMessage?.caption) {
    return messageContent.documentMessage.caption
  }

  return ''
}

/**
 * Forward a WhatsApp message to Telegram
 * @param message The WhatsApp message to forward
 * @param telegramChatId The target Telegram chat ID
 * @param includeSender Whether to include sender name in the forwarded message (default: true)
 * @param topicName Optional topic name to send message under
 */
export async function whatsappToTelegram(
  message: WAMessage,
  telegramChatId: string | number,
  includeSender: boolean = true,
  topicName?: string,
) {
  try {
    const messageContent = message.message
    if (!messageContent) return // Get sender info when available
    const senderName = message.pushName || 'Unknown'
    const msgPrefix = includeSender ? `*${senderName}*:\n\n` : ''

    if (topicName) {
      console.log(`Forwarding message to topic: ${topicName}`)
    } // Handle text messages
    if (messageContent.conversation || messageContent.extendedTextMessage) {
      const text = extractMessageText(message)
      await sendTelegramMessage(telegramChatId, msgPrefix + text, topicName)
    }
    // Handle image messages
    else if (messageContent.imageMessage) {
      const media = await downloadMediaMessage(message, 'buffer', {})
      const caption = messageContent.imageMessage.caption
        ? msgPrefix + messageContent.imageMessage.caption
        : msgPrefix
      await sendTelegramPhoto(
        telegramChatId,
        media as Buffer,
        caption,
        topicName,
      )
    }
    // Handle document messages
    else if (messageContent.documentMessage) {
      const media = await downloadMediaMessage(message, 'buffer', {})
      const caption = messageContent.documentMessage.caption
        ? msgPrefix + messageContent.documentMessage.caption
        : msgPrefix
      const filename = messageContent.documentMessage.fileName || undefined
      const contentType = messageContent.documentMessage.mimetype || undefined
      await sendTelegramDocument(
        telegramChatId,
        media as Buffer,
        { filename, contentType },
        caption,
        topicName,
      )
    }
    // Handle other types as needed
    else {
      // For unsupported message types, send a generic message
      await sendTelegramMessage(
        telegramChatId,
        `${msgPrefix}[Sent a message that cannot be displayed]`,
        topicName,
      )
    }
  } catch (error) {
    console.error('Error forwarding message to Telegram:', error)
  }
}
/**
 * Forward a quoted WhatsApp message to Telegram
 * @param quotedMessage The quoted WhatsApp message to forward
 * @param topicName Optional topic name to send message under
 */
export function forwardQuotedMessageToTelegram(
  quotedMessage: WAMessage | null,
  topicName: string | undefined,
) {
  try {
    if (TELEGRAM_CHAT_ID) {
      if (quotedMessage) {
        whatsappToTelegram(quotedMessage, TELEGRAM_CHAT_ID, false, topicName)
        console.log(
          `Quoted message forwarded to Telegram${
            topicName ? ` under topic ${topicName}` : ''
          }`,
        )
      } else {
        console.warn('No quoted message found in the reply')
      }
    } else {
      console.warn('Message matched filter but TELEGRAM_CHAT_ID is not set')
    }
  } catch (error) {
    console.error('Error forwarding message to Telegram:', error)
  }
}
