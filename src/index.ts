import express from 'express'
import type { Request, Response } from 'express'
import { createWhatsAppSocket } from './whatsapp'

import initializeLogger from './initializeLogger'

async function main() {
  const logger = initializeLogger()
  const whatsapp = await createWhatsAppSocket(logger)
  console.log('WhatsApp socket is ready.')

  const app = express()
  const port = process.env.PORT || 3001

  app.get('/', (req: Request, res: Response) => {
    res.send('Hello, Express with TypeScript!')
  })

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
  })
}

main().catch((error) => {
  console.error('Error starting the server:', error)
})
