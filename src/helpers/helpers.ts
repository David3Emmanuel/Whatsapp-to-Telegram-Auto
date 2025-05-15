import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export class ReconnectError extends Error {}
