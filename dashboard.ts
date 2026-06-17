import { serve, spawn } from "bun"

const PORT = 18921

const FIELDS: { key: string; label: string; desc: string }[] = [
  { key: "BARK_DEVICE_KEY", label: "Bark Device Key", desc: "Your Bark push key" },
  { key: "BARK_SERVER_URL", label: "Bark Server URL", desc: "Default: https://api.day.app" },
  { key: "WATCH_BRIDGE_PERMISSION", label: "Permission Notifications", desc: "通知: 权限请求" },
  { key: "WATCH_BRIDGE_IDLE", label: "Idle Notifications", desc: "通知: 任务完成" },
  { key: "WATCH_BRIDGE_ERROR", label: "Error Notifications", desc: "通知: 错误" },
  { key: "WATCH_BRIDGE_SOUND_PERMISSION", label: "Permission Sound", desc: "权限请求铃声" },
  { key: "WATCH_BRIDGE_SOUND_IDLE", label: "Idle Sound", desc: "任务完成铃声" },
  { key: "WATCH_BRIDGE_SOUND_ERROR", label: "Error Sound", desc: "错误铃声" },
]

const SOUNDS = ["alarm", "bell", "birdsong", "chime", "crystal", "news", "note", "update"]

const TOGGLES = ["WATCH_BRIDGE_PERMISSION", "WATCH_BRIDGE_IDLE", "WATCH_BRIDGE_ERROR"]
const SOUND_KEYS = ["WATCH_BRIDGE_SOUND_PERMISSION", "WATCH_BRIDGE_SOUND_IDLE", "WATCH_BRIDGE_SOUND_ERROR"]

function envGet(key: string): string {
  return process.env[key] || ""
}

async function envSetPersist(key: string, val: string) {
  process.env[key] = val
  const ps = `[Environment]::SetEnvironmentVariable('${key}','${val.replace(/'/g, "''")}','User')`
  await spawn(["powershell", "-NoProfile", "-Command", ps]).exited
}

const HTML = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenCode Watch Bridge</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#c9d1d9;max-width:600px;margin:40px auto;padding:0 20px}
h1{font-size:22px;margin-bottom:4px;color:#f0f6fc}
h1 span{color:#58a6ff}
.sub{color:#8b949e;font-size:13px;margin-bottom:28px}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px;margin-bottom:16px}
.card h2{font-size:15px;color:#f0f6fc;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #21262d}
.row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #21262d}
.row:last-child{border-bottom:none}
.row label{font-size:14px;color:#c9d1d9}
.row .desc{font-size:11px;color:#8b949e;margin-top:2px}
input[type=text]{width:100%;background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:8px 10px;border-radius:6px;font-size:13px;margin-top:6px}
input[type=text]:focus{outline:none;border-color:#58a6ff}
select{background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:6px 10px;border-radius:6px;font-size:13px;cursor:pointer}
.toggle{position:relative;width:44px;height:24px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0}
.toggle .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#30363d;border-radius:24px;transition:.2s}
.toggle .slider::before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#c9d1d9;border-radius:50%;transition:.2s}
.toggle input:checked+.slider{background:#238636}
.toggle input:checked+.slider::before{transform:translateX(20px);background:#fff}
.actions{display:flex;gap:10px;margin-top:16px}
.btn{padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:.15s}
.btn-save{background:#238636;color:#fff}
.btn-save:hover{background:#2ea043}
.btn-test{background:#1f6feb;color:#fff}
.btn-test:hover{background:#388bfd}
#toast{position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;font-size:14px;display:none;z-index:100}
#toast.success{display:block;background:#238636;color:#fff}
#toast.error{display:block;background:#da3633;color:#fff}
#status{font-size:12px;color:#8b949e;margin-top:12px}
</style></head><body>
<h1><span>⌚</span> OpenCode Watch Bridge</h1>
<p class="sub">Apple Watch notification settings — <span id=status>loading...</span></p>

<div class=card><h2>🔑 Connection</h2>
<div class=row style="flex-direction:column;align-items:stretch"><label>Bark Device Key</label><input type=text id=BARK_DEVICE_KEY placeholder="Your Bark key..." style="font-family:monospace"></div>
<div class=row style="flex-direction:column;align-items:stretch;padding-top:12px"><label>Bark Server URL <span class=desc>(leave empty for default)</span></label><input type=text id=BARK_SERVER_URL placeholder="https://api.day.app" style="font-family:monospace"></div>
</div>

<div class=card><h2>🔔 Notifications</h2>
<div class=row><div><label>权限请求</label><div class=desc>Permission request notifications</div></div><label class=toggle><input type=checkbox id=WATCH_BRIDGE_PERMISSION><span class=slider></span></label></div>
<div class=row><div><label>任务完成</label><div class=desc>Task completion notifications</div></div><label class=toggle><input type=checkbox id=WATCH_BRIDGE_IDLE><span class=slider></span></label></div>
<div class=row><div><label>错误</label><div class=desc>Error notifications</div></div><label class=toggle><input type=checkbox id=WATCH_BRIDGE_ERROR><span class=slider></span></label></div>
</div>

<div class=card><h2>🔊 Sounds</h2>
<div class=row><label>权限请求</label><select id=WATCH_BRIDGE_SOUND_PERMISSION>${SOUNDS.map(s=>`<option value="${s}">${s}</option>`).join("")}</select></div>
<div class=row><label>任务完成</label><select id=WATCH_BRIDGE_SOUND_IDLE>${SOUNDS.map(s=>`<option value="${s}">${s}</option>`).join("")}</select></div>
<div class=row><label>错误</label><select id=WATCH_BRIDGE_SOUND_ERROR>${SOUNDS.map(s=>`<option value="${s}">${s}</option>`).join("")}</select></div>
</div>

<div class=actions>
<button class="btn btn-save" onclick=save()>Save Settings</button>
<button class="btn btn-test" onclick=testBark()>Send Test Notification</button>
</div>
<div id=toast></div>

<script>
async function load(){let r=await fetch("/api/config");let c=await r.json();
for(let k of Object.keys(c)){let el=document.getElementById(k);
if(!el)continue;
if(TOGGLE_KEYS.includes(k))el.checked=c[k]==="1";
else el.value=c[k];}
document.getElementById("status").textContent=c.BARK_DEVICE_KEY?"connected":"not configured"}
const TOGGLE_KEYS=["WATCH_BRIDGE_PERMISSION","WATCH_BRIDGE_IDLE","WATCH_BRIDGE_ERROR"];
async function save(){let body={};
for(let k of TOGGLE_KEYS){let el=document.getElementById(k);body[k]=el.checked?"1":"0"}
let sounds=["WATCH_BRIDGE_SOUND_PERMISSION","WATCH_BRIDGE_SOUND_IDLE","WATCH_BRIDGE_SOUND_ERROR"];
for(let k of sounds){let el=document.getElementById(k);body[k]=el.value}
body.BARK_DEVICE_KEY=document.getElementById("BARK_DEVICE_KEY").value;
body.BARK_SERVER_URL=document.getElementById("BARK_SERVER_URL").value;
let r=await fetch("/api/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
let t=document.getElementById("toast");t.className=r.ok?"success":"error";
t.textContent=r.ok?"Saved. Restart OpenCode to apply.":"Save failed";setTimeout(()=>t.className="",3000)}
async function testBark(){let key=document.getElementById("BARK_DEVICE_KEY").value;if(!key){return alert("Set Bark Device Key first")}
let r=await fetch("/api/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key})});
let t=document.getElementById("toast");t.className=r.ok?"success":"error";
t.textContent=r.ok?"Test push sent — check your watch":"Push failed";setTimeout(()=>t.className="",3000)}
load()
</script></body></html>`

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === "/api/config") {
      if (req.method === "GET") {
        const config: Record<string, string> = {}
        for (const f of FIELDS) config[f.key] = envGet(f.key)
        return Response.json(config)
      }
      if (req.method === "POST") {
        const body = await req.json()
        for (const [k, v] of Object.entries(body)) {
          if (typeof v === "string") await envSetPersist(k, v)
        }
        return Response.json({ ok: true })
      }
    }

    if (url.pathname === "/api/test" && req.method === "POST") {
      const { key } = await req.json()
      const server = process.env.BARK_SERVER_URL || "https://api.day.app"
      const barkUrl = `${server}/${encodeURIComponent(key)}/OpenCode%20Watch%20Bridge/Test%20notification%20%E2%9C%85?group=OpenCode&sound=bell`
      await fetch(barkUrl)
      return Response.json({ ok: true })
    }

    return new Response(HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  },
})

console.log("")
console.log("  ⌚  OpenCode Watch Bridge Dashboard")
console.log("  ───────────────────────────────────")
console.log(`  →  http://localhost:${PORT}`)
console.log("")
