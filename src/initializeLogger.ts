import { mkdirSync, openSync } from 'fs'
import pino from 'pino'

export default function initializeLogger() {
  mkdirSync('./logs', { recursive: true })
  const fd = openSync('./logs/wa-logs.txt', 'a')

  const logger = pino(pino.destination({ fd }))
  logger.level = 'trace'

  return logger
}
