import express from 'express'
import type { Request, Response } from 'express'
import { createWhatsAppSocket } from './whatsapp'
import initializeLogger from './initializeLogger'
import { CONNECTION_MESSAGES, TELEGRAM_BOT_TOKEN } from './constants'
import { initTelegramBot } from './telegram'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

async function main() {
  const logger = initializeLogger()

  // Initialize WhatsApp connection
  const whatsapp = await createWhatsAppSocket(logger)
  console.log(CONNECTION_MESSAGES.SERVER_READY)

  // Initialize Telegram bot
  if (TELEGRAM_BOT_TOKEN) {
    initTelegramBot(TELEGRAM_BOT_TOKEN)
    console.log('Telegram bot initialized successfully')
  } else {
    console.warn(
      'TELEGRAM_BOT_TOKEN not found. Telegram functionality will not work.',
    )
  }

  const app = express()
  const port = process.env.PORT || 3001

  app.get('/', (req: Request, res: Response) => {
    res.send('WhatsApp to Telegram Bridge - Server Running')
  })

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
  })
}

main().catch((error) => {
  console.error('Error starting the server:', error)
})
