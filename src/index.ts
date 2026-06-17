import type { Plugin } from "@opencode-ai/plugin"
import { WeComClient } from "./wecom"
import { WeComCrypto } from "./crypto"
import { StateManager } from "./state"
import { createCallbackServer } from "./server"
import {
  buildPermissionCard,
  buildSessionIdleCard,
  buildErrorCard,
} from "./handler"

export const WatchBridgePlugin: Plugin = async (ctx) => {
  const config = (ctx as any).config?.watch_bridge as Record<string, string> | undefined
  if (!config) {
    console.warn("[watch-bridge] No watch_bridge config found, plugin disabled")
    return {}
  }

  const {
    corp_id: corpId,
    agent_id: agentId,
    secret,
    token,
    aes_key: aesKey,
    chat_id: chatId,
  } = config

  if (!corpId || !agentId || !secret || !token || !aesKey || !chatId) {
    console.warn("[watch-bridge] Missing required config fields, plugin disabled")
    return {}
  }

  const wecom = new WeComClient({ corpId, agentId, secret, token, encodingAesKey: aesKey })
  const state = new StateManager()

  const cleanupInterval = setInterval(() => state.cleanup(5 * 60 * 1000), 60_000)

  const server = createCallbackServer(
    async (taskId, buttonKey) => {
      const pending = state.get(taskId)
      if (!pending) {
        return `<xml><return_code>0</return_code></xml>`
      }

      const [action] = buttonKey.split(":", 1)

      try {
        if (action === "approve" && pending.type === "permission") {
          await ctx.client.session["postSessionByIdPermissionsByPermissionId"]({
            path: {
              id: pending.sessionId,
              permissionId: pending.id,
            },
            body: { action: "allow" },
          } as any)
        } else if (action === "deny" && pending.type === "permission") {
          await ctx.client.session["postSessionByIdPermissionsByPermissionId"]({
            path: {
              id: pending.sessionId,
              permissionId: pending.id,
            },
            body: { action: "deny" },
          } as any)
        } else if (action === "continue") {
          await ctx.client.session.prompt({
            path: { id: pending.sessionId },
            body: {
              parts: [{ type: "text" as const, text: "请继续执行未完成的任务。" }],
            },
          } as any)
        } else if (action === "retry") {
          await ctx.client.session.prompt({
            path: { id: pending.sessionId },
            body: {
              parts: [{ type: "text" as const, text: "请重试上次操作。" }],
            },
          } as any)
        } else if (action === "abort") {
          await ctx.client.session.abort({
            path: { id: pending.sessionId },
          } as any)
        }

        state.resolve(taskId)
      } catch (err) {
        console.error("[watch-bridge] Callback handler error:", err)
      }

      return `<xml><return_code>0</return_code></xml>`
    },
    token,
    aesKey,
    corpId,
    18920,
  )

  console.info(`[watch-bridge] Callback server started on port ${server.port}`)

  return {
    event: async ({ event }) => {
      const taskId = `evt:${crypto.randomUUID()}`

      try {
        switch (event.type) {
          case "permission.asked": {
            const props = event.properties as Record<string, unknown>
            const tool = String(props?.tool || "unknown")
            const args = JSON.stringify(props?.args || props || "")
            const card = buildPermissionCard(taskId, tool, args)

            state.add(taskId, {
              id: String(props?.id || taskId),
              type: "permission",
              sessionId: String(props?.sessionID || ""),
              messageId: "",
              event: props as Record<string, unknown>,
              createdAt: Date.now(),
            })

            await wecom.sendTemplateCard(chatId, card)
            break
          }

          case "session.idle": {
            const props = event.properties as Record<string, unknown>
            const card = buildSessionIdleCard(taskId)

            state.add(taskId, {
              id: taskId,
              type: "session",
              sessionId: String(props?.sessionID || ""),
              messageId: "",
              event: props as Record<string, unknown>,
              createdAt: Date.now(),
            })

            await wecom.sendTemplateCard(chatId, card)
            break
          }

          case "session.error": {
            const props = event.properties as Record<string, unknown>
            const errorMsg = String(props?.error || props?.message || "Unknown error")
            const card = buildErrorCard(taskId, errorMsg)

            state.add(taskId, {
              id: taskId,
              type: "session",
              sessionId: String(props?.sessionID || ""),
              messageId: "",
              event: props as Record<string, unknown>,
              createdAt: Date.now(),
            })

            await wecom.sendTemplateCard(chatId, card)
            break
          }
        }
      } catch (err) {
        console.error("[watch-bridge] Event handler error:", err)
      }
    },
  }
}
