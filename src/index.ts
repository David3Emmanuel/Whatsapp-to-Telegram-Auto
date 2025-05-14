import express from 'express'
import type { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 3001

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!')
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
