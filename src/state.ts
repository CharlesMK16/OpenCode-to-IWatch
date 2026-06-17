export interface PendingRequest {
  id: string
  type: "permission" | "session"
  sessionId: string
  messageId: string
  event: Record<string, unknown>
  createdAt: number
}

export class StateManager {
  private pending = new Map<string, PendingRequest>()

  add(taskId: string, request: PendingRequest): void {
    this.pending.set(taskId, request)
  }

  get(taskId: string): PendingRequest | undefined {
    return this.pending.get(taskId)
  }

  resolve(taskId: string): void {
    this.pending.delete(taskId)
  }

  cleanup(olderThanMs: number): void {
    const cutoff = Date.now() - olderThanMs
    for (const [key, req] of this.pending) {
      if (req.createdAt < cutoff) {
        this.pending.delete(key)
      }
    }
  }
}
