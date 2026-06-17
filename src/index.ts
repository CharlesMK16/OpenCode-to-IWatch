import type { Plugin } from "@opencode-ai/plugin"

const BARK_API = process.env.BARK_SERVER_URL || "https://api.day.app"

const config = {
  permission: process.env.WATCH_BRIDGE_PERMISSION !== "0",
  idle: process.env.WATCH_BRIDGE_IDLE !== "0",
  error: process.env.WATCH_BRIDGE_ERROR !== "0",
  soundPermission: process.env.WATCH_BRIDGE_SOUND_PERMISSION || "alarm",
  soundIdle: process.env.WATCH_BRIDGE_SOUND_IDLE || "bell",
  soundError: process.env.WATCH_BRIDGE_SOUND_ERROR || "alarm",
}

async function push(title: string, body: string, sound: string) {
  const key = process.env.BARK_DEVICE_KEY
  if (!key) return
  const params = new URLSearchParams({ group: "OpenCode", sound })
  const url = `${BARK_API}/${encodeURIComponent(key)}/${encodeURIComponent(title)}/${encodeURIComponent(body)}?${params}`
  await fetch(url)
}

export const WatchBridgePlugin: Plugin = async () => {
  const key = process.env.BARK_DEVICE_KEY
  if (!key) {
    console.warn("[watch-bridge] BARK_DEVICE_KEY env not set, plugin disabled")
    return {}
  }

  const bits: string[] = []
  if (config.permission) bits.push("permission")
  if (config.idle) bits.push("idle")
  if (config.error) bits.push("error")
  console.info(`[watch-bridge] enabled: ${bits.join(", ") || "none"}`)

  return {
    event: async ({ event }) => {
      try {
        switch (event.type) {
          case "permission.asked": {
            if (!config.permission) return
            const props = event.properties as Record<string, unknown>
            const tool = String(props?.tool || "unknown")
            const args = JSON.stringify(props?.args || "").slice(0, 200)
            await push("OpenCode 权限请求", `工具: ${tool}\n参数: ${args}`, config.soundPermission)
            break
          }
          case "session.idle": {
            if (!config.idle) return
            await push("OpenCode 任务完成", "Session 已空闲", config.soundIdle)
            break
          }
          case "session.error": {
            if (!config.error) return
            const props = event.properties as Record<string, unknown>
            const msg = String(props?.error || props?.message || "Unknown error")
            await push("OpenCode 错误", msg.slice(0, 200), config.soundError)
            break
          }
        }
      } catch (err) {
        console.error("[watch-bridge]", err)
      }
    },
  }
}
