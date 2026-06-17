import { spawn, type Subprocess } from "bun"

export interface NgrokManager {
  getPublicUrl(): string | null
  start(): Promise<void>
  stop(): void
}

export function createNgrokManager(port: number, authToken?: string): NgrokManager {
  let publicUrl: string | null = null
  let proc: Subprocess | null = null

  return {
    getPublicUrl() {
      return publicUrl
    },

    async start() {
      const args = ["http", String(port), "--log=stdout"]
      if (authToken) {
        args.push(`--authtoken=${authToken}`)
      }

      proc = spawn({
        cmd: ["./ngrok", ...args],
        stdout: "pipe",
        stderr: "pipe",
      })

      const reader = proc.stdout!.getReader()
      const decoder = new TextDecoder()
      const startTime = Date.now()

      while (Date.now() - startTime < 10000) {
        const { value, done } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        const match = text.match(/url=(https:\/\/[^\s]+)/)
        if (match) {
          publicUrl = match[1]
          console.info(`[watch-bridge] ngrok URL: ${publicUrl}`)
          break
        }
      }

      if (!publicUrl) {
        throw new Error("ngrok failed to start within 10s")
      }
    },

    stop() {
      proc?.kill()
      proc = null
      publicUrl = null
    },
  }
}
