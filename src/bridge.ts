import { WAMessage, downloadMediaMessage } from 'baileys'
import {
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramDocument,
} from './telegram'

/**
 * Extract text content from a WhatsApp message
 * @param message The WhatsApp message object
 * @returns The extracted text content
 */
function extractMessageText(message: WAMessage): string {
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
 */
export async function whatsappToTelegram(
  message: WAMessage,
  telegramChatId: string | number,
  includeSender: boolean = true,
) {
  try {
    const messageContent = message.message
    if (!messageContent) return // Get sender info when available
    const senderName = message.pushName || 'Unknown'
    const msgPrefix = includeSender ? `*${senderName}*:\n\n` : ''

    // Handle text messages
    if (messageContent.conversation || messageContent.extendedTextMessage) {
      const text = extractMessageText(message)
      await sendTelegramMessage(telegramChatId, msgPrefix + text)
    }
    // Handle image messages
    else if (messageContent.imageMessage) {
      const media = await downloadMediaMessage(message, 'buffer', {})
      const caption = messageContent.imageMessage.caption
        ? msgPrefix + messageContent.imageMessage.caption
        : msgPrefix
      await sendTelegramPhoto(telegramChatId, media as Buffer, caption)
    }
    // Handle document messages
    else if (messageContent.documentMessage) {
      const media = await downloadMediaMessage(message, 'buffer', {})
      const caption = messageContent.documentMessage.caption
        ? msgPrefix + messageContent.documentMessage.caption
        : msgPrefix
      await sendTelegramDocument(telegramChatId, media as Buffer, caption)
    }
    // Handle other types as needed
    else {
      // For unsupported message types, send a generic message
      await sendTelegramMessage(
        telegramChatId,
        `${msgPrefix}[Sent a message that cannot be displayed]`,
      )
    }
  } catch (error) {
    console.error('Error forwarding message to Telegram:', error)
  }
}

/**
 * Forward a Telegram message to WhatsApp
 * @param message The Telegram message to forward
 * @param whatsappTarget The WhatsApp target (group or user)
 */
export async function telegramToWhatsapp(
  telegramMessage: any,
  whatsappSocket: any,
  whatsappTarget: string,
) {
  // Implementation for Telegram to WhatsApp forwarding
  // This would use the WhatsApp socket to send messages
  // Not fully implemented in this example
}
