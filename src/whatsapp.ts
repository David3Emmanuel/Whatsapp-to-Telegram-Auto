import { Boom } from '@hapi/boom'
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  type WASocket,
  ConnectionState,
} from 'baileys'
import { ILogger } from 'baileys/lib/Utils/logger'
import { deleteQRCode, deleteAuthInfo, ReconnectError } from './helpers'
import { showQRCode } from './helpers'
import { AUTH_FOLDER_PATH, CONNECTION_MESSAGES } from './constants'

export async function createWhatsAppSocket(logger: ILogger) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER_PATH)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const socket = makeWASocket({
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    shouldSyncHistoryMessage: () => false,
  })

  try {
    await connectSocket(socket, saveCreds)
  } catch (error) {
    if (error instanceof ReconnectError) {
      console.error(CONNECTION_MESSAGES.RECONNECTING)
      return await createWhatsAppSocket(logger)
    } else throw error
  }
}

function connectSocket(
  socket: WASocket,
  saveCreds: () => Promise<void>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.ev.on('creds.update', saveCreds)
    socket.ev.on(
      'connection.update',
      async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) await showQRCode(qr)

        if (connection === 'close')
          await handleDisconnect(reject, lastDisconnect?.error)

        if (connection === 'open') {
          console.log(CONNECTION_MESSAGES.ESTABLISHED)
          await deleteQRCode()
          resolve()
        }
      },
    )
  })
}
async function handleDisconnect(reject: (reason?: any) => void, error?: Error) {
  {
    const statusCode = (error as Boom)?.output?.statusCode
    console.log(CONNECTION_MESSAGES.CLOSED, error?.message)
    await deleteQRCode()

    if (statusCode === DisconnectReason.restartRequired)
      reject(new ReconnectError())
    else if (statusCode === DisconnectReason.loggedOut) {
      console.log(CONNECTION_MESSAGES.LOGGED_OUT)
      await deleteAuthInfo()
      reject(new ReconnectError())
    } else reject(CONNECTION_MESSAGES.CLOSED_UNKNOWN)
  }
}
