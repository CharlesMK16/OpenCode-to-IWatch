# OpenCode Watch Bridge ⌚

Send OpenCode events (permission requests, task completion, errors) as push notifications to your **Apple Watch** via [Bark](https://github.com/Finb/Bark).

> 将 OpenCode 的权限请求、任务完成、错误等信息通过 Bark 推送到你的 Apple Watch。

## Features

- **Zero-config push** — set your Bark key once, forget it
- **Per-event filtering** — toggle permission / idle / error independently
- **Custom sounds** — different ringtones for different event types
- **Web dashboard** — GUI to manage all settings, no terminal needed
- **Self-hosted support** — use your own Bark server
- **Apple Watch native** — notifications appear on wrist automatically

## How It Works

```
OpenCode event -> Plugin -> Bark API -> APNs -> iPhone -> Apple Watch
```

- `permission.asked` → "OpenCode 权限请求"
- `session.idle` → "OpenCode 任务完成"
- `session.error` → "OpenCode 错误"

## Install

### 1. Install Bark on your iPhone

App Store: [Bark - Custom Notifications](https://apps.apple.com/app/id1403753865)

### 2. Get your Device Key

Open Bark app → copy the test URL → extract the key:

```
https://api.day.app/xqeb5G6i6EqQKY5ujxVRF/Test
                       ^^^^^^^^^^^^^^^^^^^
                       This is your key
```

### 3. Install the plugin

```bash
git clone https://github.com/CharlesMK16/OpenCode-to-IWatch.git D:/config/opencode/plugins/watch-bridge
cd D:/config/opencode/plugins/watch-bridge
bun install
```

### 4. Configure

**（1）Register the plugin in OpenCode:**

Edit `C:\Users\<you>\.config\opencode\opencode.jsonc`:

```jsonc
{
  "plugin": [
    "D:/config/opencode/plugins/watch-bridge/src/index.ts"
  ]
}
```

**（2）Launch the settings dashboard:**

```bash
cd D:/config/opencode/plugins/watch-bridge
bun run dashboard
```

Then open **http://localhost:18921** in your browser. Enter your Bark device key, toggle which events to receive, pick sounds — all in a GUI. Click **Save Settings**.

### 5. Restart OpenCode

You should see `[watch-bridge] enabled: permission, idle, error` in the terminal.

---

## How to Change Settings

**All configuration is done via Windows environment variables. There are zero files to edit.**

There are two ways to set them:

### Method A: Permanent (survives restart)

```powershell
# PowerShell, run once
[Environment]::SetEnvironmentVariable("VAR_NAME", "value", "User")
```

Then restart OpenCode.

### Method B: Temporary (current terminal only)

```powershell
$env:VAR_NAME = "value"
```

Then run `opencode` in the same terminal.

---

## Configuration Reference

### Required

| Variable | Description |
|---|---|
| `BARK_DEVICE_KEY` | Your Bark device key (from step 2 above) |

### Event Toggles (set to `0` to disable)

| Variable | Default | Controls |
|---|---|---|
| `WATCH_BRIDGE_PERMISSION` | `1` | Permission request notifications |
| `WATCH_BRIDGE_IDLE` | `1` | Task completion notifications |
| `WATCH_BRIDGE_ERROR` | `1` | Error notifications |

### Sounds

| Variable | Default | Controls |
|---|---|---|
| `WATCH_BRIDGE_SOUND_PERMISSION` | `alarm` | Sound for permission requests |
| `WATCH_BRIDGE_SOUND_IDLE` | `bell` | Sound for task completion |
| `WATCH_BRIDGE_SOUND_ERROR` | `alarm` | Sound for errors |

Available sounds: `alarm`, `bell`, `birdsong`, `chime`, `crystal`, `news`, `note`, `update`, or any iOS system sound name.

### Server

| Variable | Default | Description |
|---|---|---|
| `BARK_SERVER_URL` | `https://api.day.app` | Self-hosted Bark server URL |

---

## Examples

```powershell
# Only get errors and permissions — mute "task complete"
[Environment]::SetEnvironmentVariable("WATCH_BRIDGE_IDLE", "0", "User")

# Permission = gentle chime, Error = loud alarm
[Environment]::SetEnvironmentVariable("WATCH_BRIDGE_SOUND_PERMISSION", "chime", "User")
[Environment]::SetEnvironmentVariable("WATCH_BRIDGE_SOUND_ERROR", "alarm", "User")

# Use your own Bark server
[Environment]::SetEnvironmentVariable("BARK_SERVER_URL", "https://mybark.com", "User")
```

After any change, restart OpenCode.

## Project Structure

```
watch-bridge/
├── src/
│   └── index.ts        # OpenCode plugin (event hooks)
├── dashboard.ts        # Web settings dashboard
├── package.json
├── tsconfig.json
├── LICENSE             # MIT
└── README.md
```

## License

MIT © CharlesMK16
