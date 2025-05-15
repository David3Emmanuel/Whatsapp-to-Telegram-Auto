import fs from 'fs'
import { QR_CODE_PATH, QR_CODE_MESSAGES, ERROR_MESSAGES } from '../constants'

export default async function deleteQRCode(): Promise<void> {
  try {
    if (fs.existsSync(QR_CODE_PATH)) {
      fs.unlinkSync(QR_CODE_PATH)
      console.log(QR_CODE_MESSAGES.DELETED)
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.QR_CODE_DELETE, error)
  }
}
