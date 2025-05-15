import TelegramBot from 'node-telegram-bot-api'

// Create a bot instance with your token
// You'll need to get a token from @BotFather on Telegram
let bot: TelegramBot | null = null

/**
 * Initialize the Telegram bot with the provided token
 * @param token The Telegram Bot API token from BotFather
 */
export function initTelegramBot(token: string): void {
  bot = new TelegramBot(token, { polling: true })
  console.log('Telegram bot initialized')

  // Setup basic message handler for incoming messages
  bot.on('message', (msg) => {
    console.log(`Received message from Telegram`, msg)
    // You can handle incoming messages from Telegram here
  })
}

/**
 * Send a text message to a Telegram chat
 * @param chatId The target chat ID
 * @param text The message text to send
 * @returns Promise with the sent message
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
): Promise<TelegramBot.Message> {
  if (!bot) {
    throw new Error('Telegram bot not initialized. Call initTelegramBot first.')
  }
  return bot.sendMessage(chatId, text)
}

/**
 * Send a photo to a Telegram chat
 * @param chatId The target chat ID
 * @param photo The photo to send (file path, URL, or Buffer)
 * @param caption Optional caption for the photo
 * @returns Promise with the sent message
 */
export async function sendTelegramPhoto(
  chatId: string | number,
  photo: string | Buffer | Stream,
  caption?: string,
): Promise<TelegramBot.Message> {
  if (!bot) {
    throw new Error('Telegram bot not initialized. Call initTelegramBot first.')
  }
  return bot.sendPhoto(chatId, photo, { caption })
}

/**
 * Send a document to a Telegram chat
 * @param chatId The target chat ID
 * @param document The document to send (file path, URL, or Buffer)
 * @param caption Optional caption for the document
 * @returns Promise with the sent message
 */
export async function sendTelegramDocument(
  chatId: string | number,
  document: string | Buffer | Stream,
  caption?: string,
): Promise<TelegramBot.Message> {
  if (!bot) {
    throw new Error('Telegram bot not initialized. Call initTelegramBot first.')
  }
  return bot.sendDocument(chatId, document, { caption })
}

// Add a missing import for Stream
import { Stream } from 'stream'
