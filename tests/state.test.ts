import { describe, it, expect, beforeEach } from "bun:test"
import { StateManager, PendingRequest } from "../src/state"

describe("StateManager", () => {
  let state: StateManager

  beforeEach(() => {
    state = new StateManager()
  })

  it("should add and get a pending request", () => {
    const req: PendingRequest = {
      id: "req-1",
      type: "permission",
      sessionId: "sess-1",
      messageId: "msg-1",
      event: { tool: "bash", args: "rm -rf /" },
      createdAt: Date.now(),
    }
    state.add("task-1", req)
    expect(state.get("task-1")).toEqual(req)
  })

  it("should return undefined for missing key", () => {
    expect(state.get("nonexistent")).toBeUndefined()
  })

  it("should resolve and remove a request", () => {
    const req: PendingRequest = {
      id: "req-2",
      type: "session",
      sessionId: "sess-2",
      messageId: "msg-2",
      event: { status: "idle" },
      createdAt: Date.now(),
    }
    state.add("task-2", req)
    state.resolve("task-2")
    expect(state.get("task-2")).toBeUndefined()
  })

  it("should cleanup expired requests", async () => {
    const old: PendingRequest = {
      id: "req-old",
      type: "permission",
      sessionId: "sess-old",
      messageId: "msg-old",
      event: {},
      createdAt: Date.now() - 10 * 60 * 1000, // 10 min ago
    }
    state.add("task-old", old)

    const fresh: PendingRequest = {
      id: "req-fresh",
      type: "permission",
      sessionId: "sess-fresh",
      messageId: "msg-fresh",
      event: {},
      createdAt: Date.now(),
    }
    state.add("task-fresh", fresh)

    state.cleanup(5 * 60 * 1000) // 5 min TTL
    expect(state.get("task-old")).toBeUndefined()
    expect(state.get("task-fresh")).toBeDefined()
  })

  it("should override when adding with same key", () => {
    const first: PendingRequest = {
      id: "req-a", type: "permission", sessionId: "s", messageId: "m",
      event: { v: 1 }, createdAt: Date.now(),
    }
    const second: PendingRequest = {
      id: "req-b", type: "permission", sessionId: "s", messageId: "m",
      event: { v: 2 }, createdAt: Date.now(),
    }
    state.add("dup", first)
    state.add("dup", second)
    expect(state.get("dup")!.id).toBe("req-b")
  })
})
