import type { Server } from "bun"
import { WeComCrypto } from "./crypto"

export type CallbackHandler = (
  taskId: string,
  buttonKey: string,
) => Promise<string>

export function createCallbackServer(
  callbackHandler: CallbackHandler,
  token: string,
  encodingAesKey: string,
  corpId: string,
  port = 18920,
): Server {
  const crypto = new WeComCrypto({ token, encodingAesKey, corpId })

  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === "/health") {
        return new Response("ok", { status: 200 })
      }

      if (url.pathname !== "/wecom/callback") {
        return new Response("Not Found", { status: 404 })
      }

      const msgSignature = url.searchParams.get("msg_signature") || ""
      const timestamp = url.searchParams.get("timestamp") || ""
      const nonce = url.searchParams.get("nonce") || ""

      if (req.method === "GET") {
        const echostr = url.searchParams.get("echostr") || ""
        try {
          if (!crypto.verifySignature(msgSignature, timestamp, nonce, echostr)) {
            return new Response("Forbidden", { status: 403 })
          }
          const decrypted = crypto.decrypt(echostr)
          return new Response(decrypted, {
            headers: { "Content-Type": "text/plain" },
          })
        } catch {
          return new Response("Forbidden", { status: 403 })
        }
      }

      if (req.method === "POST") {
        const body = await req.text()

        const encryptMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/)
        if (!encryptMatch) {
          return new Response("Invalid body", { status: 400 })
        }
        const encrypt = encryptMatch[1]

        if (!crypto.verifySignature(msgSignature, timestamp, nonce, encrypt)) {
          return new Response("Forbidden", { status: 403 })
        }

        const decrypted = crypto.decryptMessage(encrypt)

        const eventKeyMatch = decrypted.match(/<EventKey><!\[CDATA\[(.*?)\]\]><\/EventKey>/)
        const taskIdMatch = decrypted.match(/<TaskId><!\[CDATA\[(.*?)\]\]><\/TaskId>/)

        const buttonKey = eventKeyMatch?.[1] || ""
        const taskId = taskIdMatch?.[1] || ""

        const xmlResponse = await callbackHandler(taskId, buttonKey)
        return new Response(xmlResponse, {
          headers: { "Content-Type": "application/xml" },
        })
      }

      return new Response("Method Not Allowed", { status: 405 })
    },
  })
}
