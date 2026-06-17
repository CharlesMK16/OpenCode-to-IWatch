import type { TemplateCard } from "./wecom"

function truncate(str: string, max = 200): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str
}

export function buildPermissionCard(
  taskId: string,
  tool: string,
  args: string,
): TemplateCard {
  return {
    card_type: "button_interaction",
    main_title: { title: "🔐 OpenCode 权限请求" },
    sub_title_text: `工具: ${truncate(tool, 50)}`,
    horizontal_content_list: [
      { keyname: "工具", value: truncate(tool, 100) },
      { keyname: "参数", value: truncate(args, 200) },
    ],
    button_list: [
      { text: "✅ 批准", style: 1, key: `approve:${taskId}` },
      { text: "❌ 拒绝", style: 2, key: `deny:${taskId}` },
    ],
    task_id: taskId,
  }
}

export function buildSessionIdleCard(taskId: string): TemplateCard {
  return {
    card_type: "button_interaction",
    main_title: { title: "✅ OpenCode 任务完成" },
    sub_title_text: "Session 已空闲，等待下一条指令",
    button_list: [
      { text: "▶ 继续", style: 1, key: `continue:${taskId}` },
      { text: "🔄 重试", style: 2, key: `retry:${taskId}` },
    ],
    task_id: taskId,
  }
}

export function buildErrorCard(
  taskId: string,
  errorMessage: string,
): TemplateCard {
  return {
    card_type: "button_interaction",
    main_title: { title: "⚠️ OpenCode 发生错误" },
    sub_title_text: truncate(errorMessage, 100),
    horizontal_content_list: [
      { keyname: "错误信息", value: truncate(errorMessage, 200) },
    ],
    button_list: [
      { text: "🔄 重试", style: 1, key: `retry:${taskId}` },
      { text: "⏹ 中止", style: 2, key: `abort:${taskId}` },
    ],
    task_id: taskId,
  }
}
