import { describe, it, expect, afterEach } from "bun:test"
import { createCallbackServer, type CallbackHandler } from "../src/server"
import { WeComCrypto } from "../src/crypto"
import type { Server } from "bun"

describe("CallbackServer", () => {
  let server: Server | null = null
  const handler: CallbackHandler = async (_taskId, _buttonKey) => {
    return `<xml><return_code>0</return_code></xml>`
  }

  afterEach(() => {
    if (server) {
      server.stop()
      server = null
    }
  })

  it("should return 200 on health check", async () => {
    server = createCallbackServer(handler, "token", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", "test-corp", 0)
    const url = server.url
    const res = await fetch(`${url}/health`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("ok")
  })

  it("should return 403 on invalid signature GET", async () => {
    server = createCallbackServer(handler, "token", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", "test-corp", 0)
    const url = server.url
    const res = await fetch(
      `${url}/wecom/callback?msg_signature=bad&timestamp=1&nonce=2&echostr=test`
    )
    expect(res.status).toBe(403)
  })

  it("should handle POST with valid encrypted body", async () => {
    server = createCallbackServer(handler, "token", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", "test-corp", 0)
    const crypto = new WeComCrypto({ token: "token", encodingAesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", corpId: "test-corp" })
    const plainXml = "<xml><EventKey><![CDATA[btn_key]]></EventKey><TaskId><![CDATA[task_123]]></TaskId></xml>"
    const encrypted = crypto.encrypt(plainXml)
    const sig = crypto.getSignature("1", "2", encrypted)
    const url = server.url
    const res = await fetch(`${url}/wecom/callback?msg_signature=${sig}&timestamp=1&nonce=2`, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: `<xml><Encrypt><![CDATA[${encrypted}]]></Encrypt></xml>`,
    })
    expect(res.status).toBe(200)
  })

  it("should return 404 for unknown paths", async () => {
    server = createCallbackServer(handler, "token", "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG", "test-corp", 0)
    const url = server.url
    const res = await fetch(`${url}/unknown`)
    expect(res.status).toBe(404)
  })
})
