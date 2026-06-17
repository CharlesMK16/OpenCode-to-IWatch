import type { Plugin } from "@opencode-ai/plugin"

const BARK_API = "https://api.day.app"

async function push(title: string, body: string) {
  const key = process.env.BARK_DEVICE_KEY
  if (!key) return
  const url = `${BARK_API}/${encodeURIComponent(key)}/${encodeURIComponent(title)}/${encodeURIComponent(body)}?group=OpenCode&icon=https://opencode.ai/favicon.ico`
  await fetch(url)
}

export const WatchBridgePlugin: Plugin = async () => {
  const key = process.env.BARK_DEVICE_KEY
  if (!key) {
    console.warn("[watch-bridge] BARK_DEVICE_KEY env not set, plugin disabled")
    return {}
  }

  console.info("[watch-bridge] Bark plugin enabled")

  return {
    event: async ({ event }) => {
      try {
        switch (event.type) {
          case "permission.asked": {
            const props = event.properties as Record<string, unknown>
            const tool = String(props?.tool || "unknown")
            const args = JSON.stringify(props?.args || "").slice(0, 200)
            await push("OpenCode 权限请求", `工具: ${tool}\n参数: ${args}`)
            break
          }
          case "session.idle": {
            await push("OpenCode 任务完成", "Session 已空闲，等待下一条指令")
            break
          }
          case "session.error": {
            const props = event.properties as Record<string, unknown>
            const msg = String(props?.error || props?.message || "Unknown error")
            await push("OpenCode 错误", msg.slice(0, 200))
            break
          }
        }
      } catch (err) {
        console.error("[watch-bridge]", err)
      }
    },
  }
}
