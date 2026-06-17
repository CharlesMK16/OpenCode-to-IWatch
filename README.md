# OpenCode Watch Bridge

Send OpenCode events (permission requests, task completion, errors) as push notifications to your **Apple Watch** via [Bark](https://github.com/Finb/Bark).

> 将 OpenCode 的权限请求、任务完成、错误等信息通过 Bark 推送到你的 Apple Watch。

## How It Works

```
OpenCode event -> Plugin -> Bark API -> APNs -> iPhone -> Apple Watch
```

- `permission.asked` -> "OpenCode 权限请求"
- `session.idle` -> "OpenCode 任务完成"
- `session.error` -> "OpenCode 错误"

## Install

### 1. Install Bark on your iPhone

App Store: [Bark - Custom Notifications](https://apps.apple.com/app/id1403753865)

### 2. Get your Device Key

Open Bark app -> copy the test URL -> extract the key:

```
https://api.day.app/xqeb5G6i6EqQKY5ujxVRF/Test
                       ^^^^^^^^^^^^^^^^^^^
                       This is your key
```

### 3. Install the plugin

```bash
git clone https://github.com/YOUR_USER/opencode-watch-bridge D:/config/opencode/plugins/watch-bridge
cd D:/config/opencode/plugins/watch-bridge
bun install
```

### 4. Configure

**Set environment variable:**

```powershell
[Environment]::SetEnvironmentVariable("BARK_DEVICE_KEY", "your_key_here", "User")
```

**Add to your `opencode.jsonc`:**

```jsonc
{
  "plugin": [
    "D:/config/opencode/plugins/watch-bridge/src/index.ts"
  ]
}
```

### 5. Restart OpenCode

You should see `[watch-bridge] enabled: permission, idle, error` in the terminal.

## Usage

Just use OpenCode normally. Notifications arrive automatically:

| Event | Notification |
|---|---|
| Permission requested (bash, write, etc.) | "OpenCode 权限请求" |
| AI finishes responding | "OpenCode 任务完成" |
| Session error occurs | "OpenCode 错误" |

## Filter Events

Set env to `0` to disable a specific event type:

```powershell
[Environment]::SetEnvironmentVariable("WATCH_BRIDGE_IDLE", "0", "User")
```

| Variable | Default | Description |
|---|---|---|
| `WATCH_BRIDGE_PERMISSION` | `1` | Permission request notifications |
| `WATCH_BRIDGE_IDLE` | `1` | Task completion notifications |
| `WATCH_BRIDGE_ERROR` | `1` | Error notifications |

## Custom Sounds

```powershell
[Environment]::SetEnvironmentVariable("WATCH_BRIDGE_SOUND_PERMISSION", "chime", "User")
```

| Variable | Default | Description |
|---|---|---|
| `WATCH_BRIDGE_SOUND_PERMISSION` | `alarm` | Sound for permission requests |
| `WATCH_BRIDGE_SOUND_IDLE` | `bell` | Sound for task completion |
| `WATCH_BRIDGE_SOUND_ERROR` | `alarm` | Sound for errors |

Available sounds: `alarm`, `bell`, `birdsong`, `chime`, `crystal`, `news`, `note`, `update`, or any iOS system sound name.

## Self-hosted Bark Server

```powershell
[Environment]::SetEnvironmentVariable("BARK_SERVER_URL", "https://your-bark-server.com", "User")
```

Default: `https://api.day.app`

## License

MIT
