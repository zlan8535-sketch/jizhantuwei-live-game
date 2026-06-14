# JiZhanTuWei Douyin Cloud Service

Minimal callback service for the JiZhanTuWei live debug package.

APPID: `tt02d6746b9cb2fc0e10`

## Endpoints

- `GET /api/health`: service health check.
- `POST /start_game`: platform/client start entry. It reads `X-TT-AppID`, `X-Room-ID`, body `appid/appId`, and body `roomid/roomId`, then starts live data tasks for:
  - `live_like`
  - `live_comment`
  - `live_gift`
  - `live_fansclub`
  - `live_user_enter_leave`
- `POST /live_data_callback`: Douyin intranet callback path for live interaction data.
- `POST /finish_game`: placeholder for match settlement.
- `POST /websocket_callback`: placeholder for Douyin Cloud websocket callback.
- `GET /api/live/state`: simple in-memory state for debugging.
- `GET /api/live/events?after=0`: recent normalized events for debugging.
- `GET /api/douyin/diagnostics`: recent start/callback diagnostics.

## Local Smoke Test

```powershell
node smoke-test.js
```

## Douyin Cloud Git Publish

This folder is the cloud service source for the JiZhanTuWei live interaction debug flow. It is ready to be pushed to a Git repository and selected in Douyin Cloud Git deployment.

Recommended service name:

```text
jizhantuwei-live-svc
```

Required cloud paths:

```text
/live_data_callback
/start_game
/finish_game
/api/health
/api/live/state
/api/live/events
/api/douyin/diagnostics
```

After the service is deployed, return to:

```text
https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/config
```

Configure `直播间互动数据配置` so gift, comment, like, fan club, and viewer enter/leave data point to the deployed Douyin Cloud service path:

```text
/live_data_callback
```

## Container CLI Fallback

If using the Douyin Cloud CLI instead of Git deployment:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-dycloud.ps1
```

After deployment, verify with the real deployed domain:

```powershell
Invoke-WebRequest https://<service-domain>/api/health
Invoke-WebRequest https://<service-domain>/live_data_callback -Method Post -ContentType "application/json" -Body '{"type":"smoke"}'
```

## Verification Notes

Local smoke tests only prove the service logic. The release goal still requires official live/debug launch and real room context:

- `/start_game` receives a real `roomId`.
- `/live_data_callback` receives real `live_comment`, `live_like`, and `live_gift` events.
- The game client receives or polls the normalized live state and triggers the existing `__JZTW_LIVE__` bridge behavior.
