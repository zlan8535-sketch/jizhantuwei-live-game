# Douyin Platform Release Checklist

APPID: `tt02d6746b9cb2fc0e10`

Latest real live/debug-room status: on 2026-06-14 15:14, the user live debug launch produced real Douyin Cloud callbacks for like, comment, and gift. The in-game package initially had no feedback because the uploaded client did not have a default cloud URL when launched by the platform. The client fallback was fixed in `1.0.1`. On 2026-06-14 16:46, `1.0.2` was uploaded to the Open Platform and later showed `1.0.2_` with status `部署完成`; this package adds real viewer avatar propagation and smaller round soldier-head avatars. The next gate is relaunching the `1.0.2_` debug package and verifying real in-game feedback.

This file tracks the remaining platform-side work for the live interactive build. The Cocos client package is prepared, the cloud-service source is deployed to the target Douyin Cloud env, a dedicated JiZhanTuWei GitHub remote is connected, platform comment/gift/like callbacks are reaching the target cloud service, and debug package `1.0.2_` is deployed. The next gate is relaunching the debug package so the platform-running client starts cloud polling without a local preview query parameter, then validating real comment/like/gift/avatar feedback in-game.

## Current Package

- Upload package: `release/douyin-debug/JiZhanTuWei_1.0.2.zip`
- Package SHA256: `5C4545889054BCDC6CC0085C271CF45B60C73BA7CAA7FEA1070A9981760914AC`
- Package size: `220752869`
- Package refreshed: `2026-06-14 16:38:37`
- Platform upload status: uploaded and deployed as debug version `1.0.2_`, `部署完成` as of `2026-06-14 16:50`
- Version to enter on platform: `1.0.2`
- Launch exe to enter on platform: `JiZhanTuWei.exe`
- Display ratio: `9:16`
- Cloud start: enabled on platform page

Package structure expected by the platform:

```text
JiZhanTuWei_1.0.2.zip
└── JiZhanTuWei_1.0.2/
   ├── JiZhanTuWei.exe
   ├── package.json
   ├── index.html
   ├── assets/
   ├── cocos-js/
   └── src/
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
- `window.__JZTW_LIVE__.setCloudUrl(url)`
- `window.__JZTW_LIVE__.pollCloud()`
- alias: `window.__DY_LIVE_GAME__`

The bridge accepts `viewerId`, `userId`, `openId`, `secUid`, `nickName`, `avatarUrl`, `count`, `giftId`, `giftName`, `giftType`, and optional `soldierCount`.

Current configured platform mapping as of 2026-06-14 13:47:

- Development callback config: gift, comment, and like all use dev env `jztw-live-svc` path `/live_data_callback (jztw_live_data)`.
- Comment ability config: keyword `加入`, description `加入战斗`.
- Gift ability config: `仙女棒（1钻石）` -> 10 pistol soldiers, `能力药丸（10钻石）` -> 10 shotgun soldiers, `能量电池（99钻石）` -> 10 machine-gun soldiers, `超级空投（888钻石）` -> 10 giant soldiers.
- Cloud callback normalization now emits `giftType` so the existing Cocos client bridge can route each configured gift tier without rebuilding the client package.

Client cloud polling fallback:

- Configure by URL query: `liveCloudUrl`, `jztwCloudUrl`, or `cloudUrl`.
- Configure by global value before boot: `window.__JZTW_LIVE_CLOUD_URL__` or `window.__DY_LIVE_CLOUD_URL__`.
- Configure by localStorage: `JZTW_LIVE_CLOUD_URL` or `DY_LIVE_CLOUD_URL`.
- If none of the above are provided, the client now defaults to `https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run`.
- The client polls `GET /api/live/events?after=<seq>` once per second.
- Initial sync uses `latestSeq` and does not replay old callbacks.
- Local verification on 2026-06-14: `gift_giant_10` from `http://127.0.0.1:18080/live_data_callback` produced `礼物出兵: PreviewGift2 巨人兵x10` in the preview.

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

Result on 2026-06-14 after gift mapping update: `smoke test passed`.

Git status:

- Do not use `https://github.com/zlan8535-sketch/mrtgd-douyin-cloud-service.git` for this project.
- The accidental JiZhanTuWei commit in that old MRTGD repository was reverted with commit `a2f9670 Revert "Adapt cloud service for JiZhanTuWei app"`.
- Dedicated JiZhanTuWei repository: `https://github.com/zlan8535-sketch/jizhantuwei-live-game.git`
- Initial pushed project commit: `8c42651 Initialize JiZhanTuWei live project`
- Latest deployed commit: `a0b468f Map Douyin self-test gift ids`
- This repository is selected in Douyin Cloud Git deployment for APPID `tt02d6746b9cb2fc0e10`.

Deployment status as of 2026-06-14 17:04:

- Target env: `env-cuABsk2rKR`
- Target service: `jztw-live-svc`
- Target service id: `1m3j5q7o3dezm`
- Release id: `427723`
- Domain: `https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run`
- `GET /api/health` returns `jizhantuwei-live-cloud-service`.
- Latest Git publish note: `live viewer avatar support`.
- After the latest publish, a direct callback with `avatar_url` returned an event with top-level `avatarUrl`, confirming the deployed cloud service includes the avatar normalization change.
- Open Platform self-test push path is configured to `jztw-live-svc` path `/live_data_callback (jztw_live_data)` for gift, comment, and like tabs.
- Platform self-test pushed all four configured gift tiers, comment `加入`, and two like count `10` events successfully through Douyin Cloud.
- `GET /api/live/events?after=0` returned `latestSeq: 7` with `source: douyin-platform, internal-callback` and `callbackPath: /live_data_callback`.
- Platform self-test callbacks returned expected `giftType` values: `仙女棒 -> pistol`, `能力药丸 -> shotgun`, `能量电池 -> machine`, `超级空投 -> giant`.
- Platform self-test callbacks also returned `live_comment` with `comment: 加入` and `live_like` with `count: 10`.
- Local preview verification on 2026-06-14 15:05: after initial `Live cloud synced at seq 6`, a new platform self-test like advanced the cloud queue to seq `7`; the preview logged `viewer join ... x1 ... Pistol` and `点赞出兵: 11x1`.
- The cloud-service mapping now uses platform gift ids first, because self-test payloads may send the encrypted `sec_gift_id` without a Chinese gift name.
- Platform self-test verification on 2026-06-14 after `1.0.2_` upload and before cloud republish advanced the cloud queue from seq `49` to `55`:
  - seq `50`: `live_gift`, `giftType=pistol`, `giftValue=10`
  - seq `51`: `live_gift`, `giftType=shotgun`, `giftValue=100`
  - seq `52`: `live_gift`, `giftType=machine`, `giftValue=990`
  - seq `53`: `live_gift`, `giftType=giant`, `giftValue=8880`
  - seq `54`: `live_comment`, `comment=加入`
  - seq `55`: `live_like`, `count=10`
- After cloud republish, the in-memory cloud queue restarted; direct callback verification produced seq `1` with top-level `avatarUrl`.
- The old MRTGD service URL `https://1m3ly8e4e9hqe-env-WDdf2rOzyA.service.douyincloud.run` must not be treated as the JiZhanTuWei deployment.

The root `Dockerfile` and `.dockerignore` exist so Douyin Cloud Git deployment can build the cloud service from the repository root while keeping the image context limited to `douyin-cloud-service/`.

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
GET  /api/live/events
```

Prepared service files:

- `douyin-cloud-service/server.js`
- `douyin-cloud-service/smoke-test.js`
- `douyin-cloud-service/package.json`
- `douyin-cloud-service/Dockerfile`
- `douyin-cloud-service/run.sh`
- `douyin-cloud-service/deploy-dycloud.ps1`
- root `Dockerfile`
- root `.dockerignore`

Do not treat local GM buttons or browser preview calls as real callback validation. Real validation requires launching through the official live/debug entry and receiving callbacks with real live-room context.

## Upload Steps

Open:

```text
https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/version
```

Upload drawer fields:

- Package: `C:\projects\JiZhanTuWei_3.8.3ts\release\douyin-debug\JiZhanTuWei_1.0.2.zip`
- Debug version: `1.0.2`
- Startup exe: `JiZhanTuWei.exe`
- Resolution: `1080P`
- Display ratio: `9:16`

After upload:

- Upload completed on 2026-06-14 14:04.
- The platform showed `调试版本上传成功`.
- Debug version list shows `1.0.0_`; recheck on 2026-06-14 14:17 shows status `部署完成`.
- The fixed `1.0.1` package was uploaded by the user on 2026-06-14 15:55; the debug version list showed `1.0.1_` with status `部署完成` by 2026-06-14 15:58.
- The avatar-fixed `1.0.2` package was uploaded through Chrome automation on 2026-06-14 16:46; the debug version list showed `1.0.2_` with status `部署完成`.
- Use the active test/debug account to open the debug package through live companion or the official live/debug entry.
- The add-member flow requires scanning a QR code with the real Douyin account that should become the debug live account.
- Open the debug package through live companion or the official live/debug entry.

## Verification Gates

The goal is not complete until all gates pass:

- Target APPID `tt02d6746b9cb2fc0e10` is used consistently. Do not complete setup only on old app `ttd2d6a46b4cb22c0b10`.
- The dedicated JiZhanTuWei GitHub repository is selected in Douyin Cloud Git deployment.
- Platform abilities for comment, like, and gift are configured or approved.
- Douyin Cloud Git publish/deploy is complete for the service used by this APPID.
- The deployed `/api/health` returns `jizhantuwei-live-cloud-service`, not `mrtgd-live-cloud-service`.
- The client delivery path is implemented and locally verified: local callback -> cloud service -> `/api/live/events` -> gameplay client -> `__JZTW_LIVE__`.
- Open Platform self-test is verified: platform self-test tool -> Douyin Cloud `/live_data_callback` -> `/api/live/events`.
- Local preview consumed a fresh platform self-test event from the deployed cloud queue and spawned a viewer soldier.
- The deployed client delivery path is verified with a real platform callback: official live/debug entry -> Douyin Cloud `/live_data_callback` -> `/api/live/events` -> gameplay client.
- Debug package upload succeeds on the Douyin Open Platform. Done for old `1.0.0` on 2026-06-14 14:04; done for fixed `1.0.1` on 2026-06-14 15:55; done for avatar-fixed `1.0.2` on 2026-06-14 16:46.
- Cloud deployment succeeds. Done for old `1.0.0`; done for fixed `1.0.1` on 2026-06-14 15:58; latest Git publish `427723` started on 2026-06-14 17:01 and deployed avatar normalization.
- Official launch provides real live-room context.
- Real comment callback spawns a viewer soldier.
- Real like callback spawns a soldier after the configured threshold.
- Real gift callback spawns the mapped soldier type and shows the gift banner.
- Diagnostics confirm `roomId` is present.

## Current Blockers / Notes

- Fixed debug package `1.0.2_` is uploaded and deployed.
- Chrome automation successfully uploaded `1.0.2`; the earlier file picker issue only applied to the older `1.0.1` upload attempt.
- One platform test member is present and shows status `已生效`.
- Platform self-test callbacks reached the target cloud service, and the local preview consumed a fresh self-test like callback from the deployed cloud queue.
- Real live/debug-room callbacks now reach Douyin Cloud, but old `1.0.0_` did not show in-game feedback because the client package lacked a default cloud URL.
- Remaining blocker is relaunching the deployed `1.0.2_` debug package and sending real comment, like, gift, and avatar-bearing events.
- Native Cocos Windows build failed because this machine lacks a usable Visual Studio C++ compiler / `CMAKE_CXX_COMPILER`.
- The prepared package is an NW.js wrapper around `build/web-mobile`, not a native Cocos Windows build.
- `dycloud` CLI is not installed on this machine.
- Dedicated GitHub remote now exists: `https://github.com/zlan8535-sketch/jizhantuwei-live-game.git`.
- GitHub CLI `gh` is not installed; repository creation was completed through the logged-in Chrome GitHub session.
- Douyin Cloud has been switched to the dedicated JiZhanTuWei repository for service `1m3j5q7o3dezm`.
- The Open Platform target app page currently shows `testlevel002` / APPID `tt02d6746b9cb2fc0e10` at step `3 开发玩法&提审`; `申请能力`, `开发玩法`, and `提交审核` are still part of the remaining platform flow.
