import { createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

export interface WeComCryptoConfig {
  token: string
  encodingAesKey: string
  corpId: string
}

export class WeComCrypto {
  private token: string
  private aesKey: Buffer
  private iv: Buffer
  private corpId: string

  constructor(config: WeComCryptoConfig) {
    this.token = config.token
    this.aesKey = Buffer.from(config.encodingAesKey + "=", "base64")
    this.iv = this.aesKey.subarray(0, 16)
    this.corpId = config.corpId
  }

  getSignature(timestamp: string, nonce: string, encrypt: string): string {
    const arr = [this.token, timestamp, nonce, encrypt].sort()
    return createHash("sha1").update(arr.join("")).digest("hex")
  }

  verifySignature(signature: string, timestamp: string, nonce: string, encrypt: string): boolean {
    const expected = this.getSignature(timestamp, nonce, encrypt)
    return signature === expected
  }

  encrypt(plainText: string): string {
    const random = randomBytes(16)
    const msgBuffer = Buffer.from(plainText, "utf-8")
    const msgLen = Buffer.alloc(4)
    msgLen.writeUInt32BE(msgBuffer.length, 0)
    const corpIdBuffer = Buffer.from(this.corpId, "utf-8")

    const raw = Buffer.concat([random, msgLen, msgBuffer, corpIdBuffer])

    const blockSize = 32
    const padLen = blockSize - (raw.length % blockSize)
    const padded = Buffer.concat([raw, Buffer.alloc(padLen, padLen)])

    const cipher = createCipheriv("aes-256-cbc", this.aesKey, this.iv)
    cipher.setAutoPadding(false)
    const encrypted = Buffer.concat([cipher.update(padded), cipher.final()])

    return encrypted.toString("base64")
  }

  decrypt(encrypt: string): string {
    return this.decryptMessage(encrypt)
  }

  decryptMessage(encrypt: string): string {
    const encrypted = Buffer.from(encrypt, "base64")
    const decipher = createDecipheriv("aes-256-cbc", this.aesKey, this.iv)
    decipher.setAutoPadding(false)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    const padLen = decrypted[decrypted.length - 1]
    const unpadded = decrypted.subarray(0, decrypted.length - padLen)

    const msgLen = unpadded.readUInt32BE(16)
    const msg = unpadded.subarray(20, 20 + msgLen).toString("utf-8")

    const extractedCorpId = unpadded.subarray(20 + msgLen).toString("utf-8")
    if (extractedCorpId !== this.corpId) {
      throw new Error(`CorpId mismatch: expected ${this.corpId}, got ${extractedCorpId}`)
    }

    return msg
  }
}
