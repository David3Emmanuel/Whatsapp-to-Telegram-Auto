import fs from 'fs'
import path from 'path'
import {
  AUTH_FOLDER_PATH,
  CONNECTION_MESSAGES,
  ERROR_MESSAGES,
} from '../constants'

export default async function deleteAuthInfo(): Promise<void> {
  try {
    if (fs.existsSync(AUTH_FOLDER_PATH)) {
      console.log(CONNECTION_MESSAGES.LOGGED_OUT)
      const files = fs.readdirSync(AUTH_FOLDER_PATH)

      for (const file of files) {
        const filePath = path.join(AUTH_FOLDER_PATH, file)
        fs.unlinkSync(filePath)
      }

      console.log(CONNECTION_MESSAGES.AUTH_CLEARED)
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.AUTH_INFO_DELETE, error)
  }
}
