import QRCode from 'qrcode'
import { QR_CODE_MESSAGES, QR_CODE_PATH, ERROR_MESSAGES } from '../constants'

export default async function showQRCode(qr: string) {
  console.log(QR_CODE_MESSAGES.RECEIVED)
  try {
    await QRCode.toFile(QR_CODE_PATH, qr)
    console.log(QR_CODE_MESSAGES.SAVED)
    const port = process.env.PORT || 3001
    console.log(`${QR_CODE_MESSAGES.VIEW} http://localhost:${port}/qrcode`)
  } catch (err) {
    console.error(ERROR_MESSAGES.QR_CODE_SAVE, err)
  }
}
