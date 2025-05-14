import { mkdirSync, openSync } from 'fs'
import pino from 'pino'
import { LOGS_FOLDER_PATH, LOG_FILE_PATH, LOGGER_LEVEL } from './constants'

export default function initializeLogger() {
  mkdirSync(LOGS_FOLDER_PATH, { recursive: true })
  const fd = openSync(LOG_FILE_PATH, 'a')

  const logger = pino(pino.destination({ fd }))
  logger.level = LOGGER_LEVEL

  return logger
}
