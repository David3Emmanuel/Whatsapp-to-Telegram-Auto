import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  WAMessageKey,
  WAMessageContent,
  proto,
} from 'baileys'
import { ILogger } from 'baileys/lib/Utils/logger'

export async function createWhatsAppSocket(logger: ILogger) {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const getMessage = async (
    key: WAMessageKey,
  ): Promise<WAMessageContent | undefined> => {
    return proto.Message.fromObject({})
  }

  return makeWASocket({
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
  })
}
