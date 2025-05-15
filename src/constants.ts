import dotenv from 'dotenv'

dotenv.config()

// Application Constants
export const APP_NAME = 'Whatsapp-to-Telegram-Auto'

// File Paths
export const AUTH_FOLDER_PATH = './baileys_auth_info'
export const LOGS_FOLDER_PATH = './logs'
export const LOG_FILE_PATH = './logs/wa-logs.txt'
export const MESSAGES_LOG_FILE_PATH = './logs/messages.json'
export const QR_CODE_PATH = './qrcode.png'
export const TOPIC_MAP_FILE_PATH = './topic-map.json'

// Telegram Constants
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

// WhatsApp Constants
export const QR_CODE_MESSAGES = {
  RECEIVED: 'QR Code received...',
  SAVED: 'QR Code saved as qrcode.png',
  DELETED: 'QR code image deleted',
}

export const CONNECTION_MESSAGES = {
  ESTABLISHED: 'Connection established',
  RECONNECTING: 'Reconnecting...',
  CLOSED: 'Connection closed due to',
  CLOSED_UNKNOWN: 'Connection closed due to unknown reasons',
  LOGGED_OUT: 'Logged out. Deleting auth info...',
  AUTH_CLEARED: 'Auth info cleared successfully',
  SERVER_READY: 'WhatsApp socket is ready.',
}

export const ERROR_MESSAGES = {
  QR_CODE_SAVE: 'Error saving QR code:',
  QR_CODE_DELETE: 'Failed to delete QR code image:',
  AUTH_INFO_DELETE: 'Failed to delete auth info:',
  SERVER_START: 'Error starting the server:',
}

export const LOGGER_LEVEL = 'trace'
