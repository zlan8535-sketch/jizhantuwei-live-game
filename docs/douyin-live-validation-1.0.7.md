# Douyin Live Validation Sheet - 1.0.7

APPID: `tt02d6746b9cb2fc0e10`
Debug package: `1.0.7_`
Cloud service: `https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run`
Launch exe: `JiZhanTuWei.exe`
Cloud start: `1080P / 9:16`

## Purpose

Use this sheet to validate the `1.0.7_` debug package from the real phone/live companion flow. This package keeps the `1.0.6_` client resources, binds the platform gift config to low-price fairy-stick gifts, and uses the deployed cloud mapping that checks `sec_magic_gift_id` before the base gift id.

## Preflight

- Confirm the Open Platform version page shows `1.0.7_` and status `部署完成`.
- Open the debug package from phone/live companion, not from an already-running old session.
- Before testing, record the current cloud sequence:

```powershell
$r = Invoke-WebRequest -Uri 'https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/live/events?after=0' -UseBasicParsing -TimeoutSec 20
($r.Content | ConvertFrom-Json).data.latestSeq
```

## Test Cases

| Case | Action | Expected cloud event | Expected in-game feedback | Pass |
| --- | --- | --- | --- | --- |
| Comment join | Send the configured join/test comment from a live/debug account | `live_comment` with real `roomId`, `nickName`, and `avatarUrl` | A viewer soldier joins; round avatar is shown on the soldier head | |
| Like | Send at least 10 likes | `live_like` with `count` | Like threshold produces viewer soldier feedback | |
| Default fairy stick | Send `仙女棒（1钻石）` | `live_gift`, `giftType=pistol` | Gift banner appears; 10 pistol viewer soldiers join or enter reserve | |
| Blue fairy stick | Send `蓝色仙女棒（1钻石）` | `live_gift`, `giftType=shotgun` | Gift banner appears; 10 shotgun viewer soldiers join or enter reserve | |
| Purple fairy stick | Send `紫色仙女棒（1钻石）` | `live_gift`, `giftType=machine` | Gift banner appears; 10 machine-gun viewer soldiers join or enter reserve | |
| Yellow fairy stick | Send `黄色仙女棒（1钻石）` | `live_gift`, `giftType=giant` | Gift banner appears; 10 giant viewer soldiers join or enter reserve | |

## Cloud Evidence

After testing, record events after the preflight sequence:

```powershell
$after = <preflight-latestSeq>
$r = Invoke-WebRequest -Uri "https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/live/events?after=$after" -UseBasicParsing -TimeoutSec 20
$json = $r.Content | ConvertFrom-Json
"latestSeq=$($json.data.latestSeq) newCount=$($json.data.events.Count)"
$json.data.events | ForEach-Object {
  "seq=$($_.seq) type=$($_.msgType) room=$($_.roomId) nick=$($_.nickName) giftType=$($_.giftType) giftId=$($_.giftId) magicGiftId=$($_.magicGiftId) value=$($_.giftValue) count=$($_.count) comment=$($_.comment) avatar=$([bool]$_.avatarUrl) source=$($_.source)"
}
```

## Pass Criteria

- `1.0.7_` is deployed and launched from the official phone/live companion flow.
- Comment, like, and gift callbacks all reach Douyin Cloud with real room context.
- All four 1-diamond gift variants map to the intended existing soldier types.
- Viewer soldiers, gift banners, and round avatar visuals are visible in the real phone/live companion view.

## Result

- Tester:
- Test time:
- Preflight latestSeq:
- New event seq range:
- Phone visual result:
- Notes:
