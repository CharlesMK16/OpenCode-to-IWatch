import { describe, it, expect } from "bun:test"
import { buildPermissionCard, buildSessionIdleCard, buildErrorCard } from "../src/handler"

describe("handler", () => {
  it("should build permission card with approve/deny buttons", () => {
    const card = buildPermissionCard("task-1", "bash", "rm -rf node_modules")
    expect(card.card_type).toBe("button_interaction")
    expect(card.main_title.title).toContain("权限请求")
    expect(card.task_id).toBe("task-1")
    expect(card.button_list).toHaveLength(2)
    expect(card.button_list[0].text).toContain("批准")
    expect(card.button_list[0].key).toBe("approve:task-1")
    expect(card.button_list[1].text).toContain("拒绝")
    expect(card.button_list[1].key).toBe("deny:task-1")
  })

  it("should build session idle card with continue/retry buttons", () => {
    const card = buildSessionIdleCard("task-2")
    expect(card.card_type).toBe("button_interaction")
    expect(card.main_title.title).toContain("任务完成")
    expect(card.button_list).toHaveLength(2)
    expect(card.button_list[0].key).toBe("continue:task-2")
    expect(card.button_list[1].key).toBe("retry:task-2")
  })

  it("should build error card with retry/abort buttons", () => {
    const card = buildErrorCard("task-3", "EACCES: permission denied")
    expect(card.card_type).toBe("button_interaction")
    expect(card.main_title.title).toContain("错误")
    expect(card.sub_title_text).toContain("EACCES")
    expect(card.button_list).toHaveLength(2)
    expect(card.button_list[0].key).toBe("retry:task-3")
    expect(card.button_list[1].key).toBe("abort:task-3")
  })

  it("should truncate long command in permission card", () => {
    const longCmd = "x".repeat(500)
    const card = buildPermissionCard("t", "bash", longCmd)
    const item = card.horizontal_content_list?.find(i => i.keyname === "参数")
    expect(item!.value.length).toBeLessThanOrEqual(200)
  })
})
