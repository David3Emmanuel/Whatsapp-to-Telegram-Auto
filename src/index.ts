import express from 'express'
import type { Request, Response } from 'express'
import { createWhatsAppSocket } from './whatsapp'
import initializeLogger from './initializeLogger'
import {
  CONNECTION_MESSAGES,
  TELEGRAM_BOT_TOKEN,
  QR_CODE_PATH,
} from './constants'
import { initTelegramBot } from './telegram'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

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

  // QR code endpoint to display the login QR code
  app.get('/qrcode', (req: Request, res: Response) => {
    const absolutePath = path.resolve(QR_CODE_PATH)

    // Check if QR code file exists
    if (fs.existsSync(absolutePath)) {
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')

      // Send the QR code image
      const qrStream = fs.createReadStream(absolutePath)
      qrStream.pipe(res)
    } else {
      // QR code not available
      res
        .status(404)
        .send(
          'QR code not available. Please try again after restarting or reconnecting.',
        )
    }
  })

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    console.log(
      `QR code (when available) can be viewed at http://localhost:${port}/qrcode`,
    )
  })
}

main().catch((error) => {
  console.error('Error starting the server:', error)
})
