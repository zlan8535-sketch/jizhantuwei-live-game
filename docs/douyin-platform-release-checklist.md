# Douyin Platform Release Checklist

APPID: `tt02d6746b9cb2fc0e10`

This file tracks the remaining platform-side work for the live interactive build. The Cocos client package is prepared and the cloud-service source exists locally, but a dedicated JiZhanTuWei GitHub remote, Douyin Cloud deployment, platform ability configuration, upload, and real live-room verification are not complete yet.

## Current Package

- Upload package: `release/douyin-debug/JiZhanTuWei_1.0.0.zip`
- Package SHA256: `1E130DB891279F21FBCF0B9A33DC8B484D14EDD984A2A30A1D94BA941002FFFF`
- Version to enter on platform: `1.0.0`
- Launch exe to enter on platform: `JiZhanTuWei.exe`
- Display ratio: `9:16`
- Cloud start: enabled on platform page

Package structure expected by the platform:

```text
JiZhanTuWei_1.0.0.zip
└─ JiZhanTuWei_1.0.0/
   ├─ JiZhanTuWei.exe
   ├─ package.json
   ├─ index.html
   ├─ assets/
   ├─ cocos-js/
   └─ src/
```

## Platform Abilities To Configure

Open:

```text
https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/capacity/basicInteract
```

Required abilities:

- `直播间评论互动能力`
- `直播间点赞互动能力`
- `直播间礼物互动能力`

Configuration intent:

- Comment: viewer joins and adds 1 normal pistol soldier.
- Like: every 10 likes from one viewer adds 1 normal pistol soldier.
- Gift normal/default: 10 pistol soldiers.
- Gift shotgun/short-gun: 10 shotgun soldiers.
- Gift heavy/machine/high: 10 machine-gun soldiers.
- Gift giant/top: 10 giant soldiers.

Client bridge already exists:

- `window.__JZTW_LIVE__.comment(payload)`
- `window.__JZTW_LIVE__.like(payload)`
- `window.__JZTW_LIVE__.gift(payload)`
- alias: `window.__DY_LIVE_GAME__`

The bridge accepts `viewerId`, `userId`, `openId`, `secUid`, `nickName`, `avatarUrl`, `count`, `giftId`, `giftName`, `giftType`, and optional `soldierCount`.

## Douyin Cloud Git Publish / Deploy

Cloud service source now exists in:

```text
C:\projects\JiZhanTuWei_3.8.3ts\douyin-cloud-service
```

Local smoke test command:

```powershell
Set-Location C:\projects\JiZhanTuWei_3.8.3ts\douyin-cloud-service
& C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe smoke-test.js
```

Result on 2026-06-13: `smoke test passed`.

Git status:

- Do not use `https://github.com/zlan8535-sketch/mrtgd-douyin-cloud-service.git` for this project.
- The accidental JiZhanTuWei commit in that old MRTGD repository was reverted with commit `a2f9670 Revert "Adapt cloud service for JiZhanTuWei app"`.
- A dedicated JiZhanTuWei repository still needs to be created and connected before Douyin Cloud Git deployment.

Deployment status as of 2026-06-14 12:22:

- `GET https://1m3ly8e4e9hqe-env-WDdf2rOzyA.service.douyincloud.run/api/health` still returns `mrtgd-live-cloud-service`.
- This service belongs to the old MRTGD app/service route and must not be treated as the JiZhanTuWei production deployment.
- The cloud console showed a cost/arrears notice during publish attempts; deployment may require resolving billing/resource restrictions first.

The folder is ready to push to a Git repository and select in Douyin Cloud Git deployment, or deploy through `deploy-dycloud.ps1` once `dycloud` CLI is installed/authenticated.

Expected cloud service responsibilities:

- Receive platform start events and preserve real `roomId`.
- Receive comment, like, and gift callbacks.
- Forward callback state to the game client, either through Douyin Cloud websocket gateway / platform SDK direct push, or through a fallback client poll of `/api/live/events`.
- Provide diagnostics for at least:
  - latest `/start_game` payload
  - whether `roomId` exists
  - latest comment callbacks
  - latest like callbacks
  - latest gift callbacks

Minimum recommended endpoints if using a cloud service:

```text
GET  /api/health
POST /start_game
POST /live_data_callback
GET  /api/douyin/diagnostics
GET  /api/live/state
```

Prepared service files:

- `douyin-cloud-service/server.js`
- `douyin-cloud-service/smoke-test.js`
- `douyin-cloud-service/package.json`
- `douyin-cloud-service/Dockerfile`
- `douyin-cloud-service/run.sh`
- `douyin-cloud-service/deploy-dycloud.ps1`

Do not treat local GM buttons or browser preview calls as real callback validation. Real validation requires launching through the official live/debug entry and receiving callbacks with real live-room context.

## Upload Steps

Open:

```text
https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/version
```

Upload drawer fields:

- Package: `C:\projects\JiZhanTuWei_3.8.3ts\release\douyin-debug\JiZhanTuWei_1.0.0.zip`
- Debug version: `1.0.0`
- Startup exe: `JiZhanTuWei.exe`
- Resolution: `1080P`
- Display ratio: `9:16`

After upload:

- Wait for cloud deployment to finish. The platform text says this can take about 30 minutes.
- Add/configure a debug member account if needed.
- Open the debug package through live companion or the official live/debug entry.

## Verification Gates

The goal is not complete until all gates pass:

- Target APPID `tt02d6746b9cb2fc0e10` is used consistently. Do not complete setup only on old app `ttd2d6a46b4cb22c0b10`.
- A dedicated JiZhanTuWei GitHub repository is created and selected in Douyin Cloud Git deployment.
- Platform abilities for comment, like, and gift are configured or approved.
- Douyin Cloud Git publish/deploy is complete for the service used by this APPID.
- The deployed `/api/health` returns `jizhantuwei-live-cloud-service`, not `mrtgd-live-cloud-service`.
- The client delivery path is implemented and verified: platform callback -> cloud service -> gameplay client -> `__JZTW_LIVE__`.
- Debug package upload succeeds on the Douyin Open Platform.
- Cloud deployment succeeds.
- Official launch provides real live-room context.
- Real comment callback spawns a viewer soldier.
- Real like callback spawns a soldier after the configured threshold.
- Real gift callback spawns the mapped soldier type and shows the gift banner.
- Diagnostics confirm `roomId` is present.

## Current Blockers / Notes

- Chrome became unstable on the upload drawer and showed a page-unresponsive dialog while trying to select the 220 MB zip.
- Native Cocos Windows build failed because this machine lacks a usable Visual Studio C++ compiler / `CMAKE_CXX_COMPILER`.
- The prepared package is an NW.js wrapper around `build/web-mobile`, not a native Cocos Windows build.
- `dycloud` CLI is not installed on this machine.
- A dedicated JiZhanTuWei GitHub remote does not exist yet in the connected GitHub installation search results.
- GitHub CLI `gh` is not installed, and the GitHub connector available here cannot create new repositories.
- The Open Platform target app page currently shows `testlevel002` / APPID `tt02d6746b9cb2fc0e10` at step `3 开发玩法&提审`; `申请能力`, `开发玩法`, and `提交审核` are still part of the remaining platform flow.
