import TelegramBot from 'node-telegram-bot-api'
import { TOPIC_MAP_FILE_PATH } from './constants'
import { readFileSync, writeFileSync } from 'fs'
import type { Stream } from 'stream'

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

  bot.on('message', (msg) => {
    if (msg.forum_topic_created) {
      const courseCode = msg.forum_topic_created.name
      const threadId = msg.message_thread_id!
      console.log('Topic created', courseCode, threadId)
      const topicMap = JSON.parse(readFileSync(TOPIC_MAP_FILE_PATH, 'utf-8'))
      topicMap[courseCode] = threadId
      writeFileSync(TOPIC_MAP_FILE_PATH, JSON.stringify(topicMap, null, 2))
    }
  })
}

/**
 * Get the thread ID for a topic name from the topic map
 * @param topicName The name of the topic as stored in topic-map.json
 * @returns The message thread ID or undefined if not found
 */
export function getTopicThreadId(topicName: string): number | undefined {
  try {
    const topicMap = JSON.parse(readFileSync(TOPIC_MAP_FILE_PATH, 'utf-8'))
    return topicMap[topicName]
  } catch (error) {
    console.error('Error reading topic map:', error)
    return undefined
  }
}

/**
 * Get a list of available topics from the topic map
 * @returns An array of topic names
 */
export function getAvailableTopics(): string[] {
  try {
    const topicMap = JSON.parse(readFileSync(TOPIC_MAP_FILE_PATH, 'utf-8'))
    return Object.keys(topicMap)
  } catch (error) {
    console.error('Error reading topic map:', error)
    return []
  }
}

/**
 * Send a text message to a Telegram chat
 * @param chatId The target chat ID
 * @param text The message text to send
 * @param topicName Optional topic name to send message under (must exist in topic-map.json)
 * @returns Promise with the sent message
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  topicName?: string,
): Promise<TelegramBot.Message> {
  if (!bot) {
    throw new Error('Telegram bot not initialized. Call initTelegramBot first.')
  }

  const options: TelegramBot.SendMessageOptions = {}

  if (topicName) {
    const messageThreadId = getTopicThreadId(topicName)
    if (messageThreadId) {
      options.message_thread_id = messageThreadId
    } else {
      console.warn(`Topic "${topicName}" not found in topic map`)
    }
  }

  return bot.sendMessage(chatId, text, options)
}

/**
 * Send a photo to a Telegram chat
 * @param chatId The target chat ID
 * @param photo The photo to send (file path, URL, or Buffer)
 * @param caption Optional caption for the photo
 * @param topicName Optional topic name to send photo under (must exist in topic-map.json)
 * @returns Promise with the sent message
 */
export async function sendTelegramPhoto(
  chatId: string | number,
  photo: string | Buffer | Stream,
  caption?: string,
  topicName?: string,
): Promise<TelegramBot.Message> {
  if (!bot) {
    throw new Error('Telegram bot not initialized. Call initTelegramBot first.')
  }

  const options: TelegramBot.SendPhotoOptions = { caption }

  if (topicName) {
    const messageThreadId = getTopicThreadId(topicName)
    if (messageThreadId) {
      options.message_thread_id = messageThreadId
    } else {
      console.warn(`Topic "${topicName}" not found in topic map`)
    }
  }

  return bot.sendPhoto(chatId, photo, options)
}

/**
 * Send a document to a Telegram chat
 * @param chatId The target chat ID
 * @param document The document to send (file path, URL, or Buffer)
 * @param caption Optional caption for the document
 * @param topicName Optional topic name to send document under (must exist in topic-map.json)
 * @returns Promise with the sent message
 */
export async function sendTelegramDocument(
  chatId: string | number,
  document: string | Buffer | Stream,
  fileOptions: { filename?: string; contentType?: string } = {},
  caption?: string,
  topicName?: string,
): Promise<TelegramBot.Message> {
  if (!bot) {
    throw new Error('Telegram bot not initialized. Call initTelegramBot first.')
  }

  const options: TelegramBot.SendDocumentOptions = { caption }

  if (topicName) {
    const messageThreadId = getTopicThreadId(topicName)
    if (messageThreadId) {
      options.message_thread_id = messageThreadId
    } else {
      console.warn(`Topic "${topicName}" not found in topic map`)
    }
  }

  return bot.sendDocument(chatId, document, options, fileOptions)
}
