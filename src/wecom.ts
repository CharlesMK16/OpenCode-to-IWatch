export interface WeComConfig {
  corpId: string
  agentId: string
  secret: string
  token: string
  encodingAesKey: string
}

export interface TemplateCardButton {
  text: string
  style: 1 | 2
  key: string
}

export interface TemplateCard {
  card_type: "button_interaction"
  main_title: { title: string; desc?: string }
  sub_title_text?: string
  horizontal_content_list?: { keyname: string; value: string }[]
  button_list: TemplateCardButton[]
  task_id: string
}

const WECOM_BASE = "https://qyapi.weixin.qq.com/cgi-bin"

export class WeComClient {
  private config: WeComConfig
  private accessToken: string | null = null
  private tokenExpiresAt = 0

  constructor(config: WeComConfig) {
    this.config = config
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken
    }

    const url = `${WECOM_BASE}/gettoken?corpid=${this.config.corpId}&corpsecret=${this.config.secret}`
    const res = await fetch(url)
    const data = await res.json() as { errcode: number; errmsg: string; access_token?: string; expires_in?: number }

    if (data.errcode !== 0) {
      throw new Error(`WeCom gettoken failed: ${data.errmsg}`)
    }

    this.accessToken = data.access_token!
    this.tokenExpiresAt = Date.now() + (data.expires_in! - 300) * 1000
    return this.accessToken!
  }

  async sendTemplateCard(toUser: string, card: TemplateCard): Promise<void> {
    const token = await this.getAccessToken()
    const url = `${WECOM_BASE}/message/send?access_token=${token}`

    const body = {
      touser: toUser,
      msgtype: "template_card",
      agentid: Number(this.config.agentId),
      template_card: card,
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { errcode: number; errmsg: string }

    if (data.errcode !== 0) {
      throw new Error(`WeCom send failed: ${data.errmsg}`)
    }
  }

  async updateTemplateCard(responseCode: string, newButtons: TemplateCardButton[]): Promise<void> {
    const token = await this.getAccessToken()
    const url = `${WECOM_BASE}/message/update_template_card?access_token=${token}`

    const body = {
      userids: [] as string[],
      agentid: Number(this.config.agentId),
      response_code: responseCode,
      button: {
        replace_name: newButtons.length > 0 ? newButtons[0].text : "",
        button_list: newButtons,
      },
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { errcode: number; errmsg: string }

    if (data.errcode !== 0) {
      throw new Error(`WeCom update_card failed: ${data.errmsg}`)
    }
  }
}
