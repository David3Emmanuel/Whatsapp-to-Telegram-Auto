import type { WAMessage } from 'baileys'

/**
 * Extract quoted message from a reply
 */
export default function getQuotedMessage(message: WAMessage): WAMessage | null {
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
