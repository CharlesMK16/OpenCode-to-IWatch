import { describe, it, expect } from "bun:test"
import { WeComCrypto } from "../src/crypto"

const CONFIG = {
  token: "test_token",
  encodingAesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
  corpId: "test_corp_id",
}

describe("WeComCrypto", () => {
  it("should verify a valid signature", () => {
    const crypto = new WeComCrypto(CONFIG)
    const encryptMsg = "encrypted_message_placeholder"
    const timestamp = "1409659589"
    const nonce = "263014780"
    const sig = crypto.getSignature(timestamp, nonce, encryptMsg)
    expect(sig.length).toBe(40)
    const sig2 = crypto.getSignature(timestamp, nonce, encryptMsg)
    expect(sig).toBe(sig2)
  })

  it("should encrypt and decrypt a message round-trip", () => {
    const crypto = new WeComCrypto(CONFIG)
    const plainText = `<xml><ToUserName><![CDATA[corp]]></ToUserName></xml>`
    const encrypted = crypto.encrypt(plainText)
    const decrypted = crypto.decrypt(encrypted)
    expect(decrypted).toBe(plainText)
  })

  it("should decrypt and extract message body", () => {
    const crypto = new WeComCrypto(CONFIG)
    const plainText = `<xml><ToUserName><![CDATA[corp]]></ToUserName><Content>hello</Content></xml>`
    const encrypted = crypto.encrypt(plainText)
    const result = crypto.decryptMessage(encrypted)
    expect(result).toBe(plainText)
  })

  it("should throw on invalid encrypt string", () => {
    const crypto = new WeComCrypto(CONFIG)
    expect(() => crypto.decrypt("invalid_base64!!!")).toThrow()
  })
})
