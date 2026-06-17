import { describe, it, expect, beforeEach, mock } from "bun:test"
import { WeComClient } from "../src/wecom"

function createMockFetch(responseData: unknown, status = 200) {
  return mock(async () => ({
    status,
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
  }))
}

describe("WeComClient", () => {
  const config = {
    corpId: "test-corp",
    agentId: "1000001",
    secret: "test-secret",
    token: "test-token",
    encodingAesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
  }

  let client: WeComClient

  beforeEach(() => {
    client = new WeComClient(config)
  })

  it("should fetch and cache access_token", async () => {
    globalThis.fetch = createMockFetch({
      errcode: 0,
      errmsg: "ok",
      access_token: "test-token-abc123",
      expires_in: 7200,
    })

    const token = await client.getAccessToken()
    expect(token).toBe("test-token-abc123")

    // Second call should return cached token (no fetch)
    globalThis.fetch = createMockFetch({
      errcode: -1,
      errmsg: "should not be called",
    })
    const token2 = await client.getAccessToken()
    expect(token2).toBe("test-token-abc123")
  })

  it("should throw on access_token API error", async () => {
    globalThis.fetch = createMockFetch({
      errcode: 40001,
      errmsg: "invalid credential",
    })

    await expect(client.getAccessToken()).rejects.toThrow("invalid credential")
  })

  it("should send template card message", async () => {
    // First: mock gettoken
    globalThis.fetch = createMockFetch({
      errcode: 0,
      errmsg: "ok",
      access_token: "tok",
      expires_in: 7200,
    })
    await client.getAccessToken()

    // Then: mock send
    globalThis.fetch = createMockFetch({ errcode: 0, errmsg: "ok" })

    await expect(client.sendTemplateCard("user123", {
      card_type: "button_interaction",
      main_title: { title: "Test" },
      sub_title_text: "sub",
      button_list: [
        { text: "OK", style: 1, key: "test:1" },
      ],
      task_id: "task-1",
    })).resolves.toBeUndefined()
  })

  it("should throw on send API error", async () => {
    globalThis.fetch = createMockFetch({
      errcode: 0,
      errmsg: "ok",
      access_token: "tok",
      expires_in: 7200,
    })
    await client.getAccessToken()

    globalThis.fetch = createMockFetch({
      errcode: 82001,
      errmsg: "user not found",
    })

    await expect(client.sendTemplateCard("invalid-user", {
      card_type: "button_interaction",
      main_title: { title: "Test" },
      task_id: "task-1",
      button_list: [],
    })).rejects.toThrow("user not found")
  })
})
