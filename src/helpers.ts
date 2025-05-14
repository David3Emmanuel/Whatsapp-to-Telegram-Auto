import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import {
  QR_CODE_PATH,
  QR_CODE_MESSAGES,
  ERROR_MESSAGES,
  AUTH_FOLDER_PATH,
  CONNECTION_MESSAGES,
} from './constants'

export async function showQRCode(qr: string) {
  console.log(QR_CODE_MESSAGES.RECEIVED)
  try {
    await QRCode.toFile(QR_CODE_PATH, qr)
    console.log(QR_CODE_MESSAGES.SAVED)
  } catch (err) {
    console.error(ERROR_MESSAGES.QR_CODE_SAVE, err)
  }
}
export class ReconnectError extends Error {}
export async function deleteQRCode(): Promise<void> {
  try {
    if (fs.existsSync(QR_CODE_PATH)) {
      fs.unlinkSync(QR_CODE_PATH)
      console.log(QR_CODE_MESSAGES.DELETED)
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.QR_CODE_DELETE, error)
  }
}

export async function deleteAuthInfo(): Promise<void> {
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
