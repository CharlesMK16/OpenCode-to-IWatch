import { describe, it, expect } from "bun:test"
import { StateManager } from "../src/state"
import { WeComCrypto } from "../src/crypto"
import { buildPermissionCard, buildSessionIdleCard, buildErrorCard } from "../src/handler"

describe("Integration", () => {
  it("should create permission card, track in state, and check callback flow", () => {
    const state = new StateManager()
    const taskId = "test-task-1"

    // 1. Build card
    const card = buildPermissionCard(taskId, "bash", "npm install")
    expect(card.task_id).toBe(taskId)
    expect(card.button_list[0].key).toBe(`approve:${taskId}`)

    // 2. Register in state
    state.add(taskId, {
      id: "perm-1",
      type: "permission",
      sessionId: "sess-1",
      messageId: "msg-1",
      event: { tool: "bash", args: "npm install" },
      createdAt: Date.now(),
    })

    // 3. Simulate callback
    const pending = state.get(taskId)
    expect(pending).toBeDefined()
    expect(pending!.type).toBe("permission")

    state.resolve(taskId)
    expect(state.get(taskId)).toBeUndefined()
  })

  it("should encrypt and decrypt XML message end-to-end", () => {
    const crypto = new WeComCrypto({
      token: "test-token",
      encodingAesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
      corpId: "test-corp",
    })

    const xmlMessage = [
      "<xml>",
      "<ToUserName><![CDATA[corp]]></ToUserName>",
      "<Event><![CDATA[template_card_event]]></Event>",
      "<EventKey><![CDATA[approve:task-1]]></EventKey>",
      "<TaskId><![CDATA[task-1]]></TaskId>",
      "</xml>",
    ].join("")

    const encrypted = crypto.encrypt(xmlMessage)
    const decrypted = crypto.decrypt(encrypted)

    expect(decrypted).toBe(xmlMessage)
    expect(decrypted).toContain("approve:task-1")
    expect(decrypted).toContain("task-1")
  })

  it("should produce valid signature that passes verification", () => {
    const crypto = new WeComCrypto({
      token: "test-token",
      encodingAesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
      corpId: "test-corp",
    })

    const encrypt = crypto.encrypt("<xml></xml>")
    const sig = crypto.getSignature("1409659589", "263014780", encrypt)
    const valid = crypto.verifySignature(sig, "1409659589", "263014780", encrypt)
    expect(valid).toBe(true)
  })

  it("should build all three card types with correct button keys", () => {
    const permCard = buildPermissionCard("t1", "read", "file.txt")
    const idleCard = buildSessionIdleCard("t2")
    const errorCard = buildErrorCard("t3", "something broke")

    // All are button_interaction type
    expect(permCard.card_type).toBe("button_interaction")
    expect(idleCard.card_type).toBe("button_interaction")
    expect(errorCard.card_type).toBe("button_interaction")

    // All have task_id
    expect(permCard.task_id).toBe("t1")
    expect(idleCard.task_id).toBe("t2")
    expect(errorCard.task_id).toBe("t3")

    // Button key format: action:taskId
    const allKeys = [
      ...permCard.button_list.map(b => b.key),
      ...idleCard.button_list.map(b => b.key),
      ...errorCard.button_list.map(b => b.key),
    ]
    for (const key of allKeys) {
      expect(key).toMatch(/^(approve|deny|continue|retry|abort):/)
    }
  })

  it("should handle empty error message in error card", () => {
    const card = buildErrorCard("t", "")
    expect(card.card_type).toBe("button_interaction")
    expect(card.sub_title_text).toBe("")
    expect(card.button_list).toHaveLength(2)
  })
})
