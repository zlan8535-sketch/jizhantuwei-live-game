## 2026-06-14 14:44 - Open Platform Self-Test Gift Callbacks Verified

Status: Done / Still needs official live-room launch validation

What changed:
- Configured the Open Platform `openAPI自测工具` gift push path for APPID `tt02d6746b9cb2fc0e10` to Douyin Cloud service `jztw-live-svc`, path `/live_data_callback (jztw_live_data)`.
- Added the four self-test platform gift ids to `douyin-cloud-service/server.js` so platform payloads that omit Chinese gift names still map deterministically.
- Published Douyin Cloud release `427674` from GitHub repo `zlan8535-sketch/jizhantuwei-live-game`, branch `main`, commit `a0b468f5216181eb84217e8af241c4eb3e70231c`.
- Used the platform self-test tool with role `11` to push four gift callbacks: `仙女棒`, `能力药丸`, `能量电池`, and `超级空投`.
- Added platform self-test config for comment and like tabs, both pointing to Douyin Cloud service `jztw-live-svc`, path `/live_data_callback (jztw_live_data)`.
- Pushed comment self-test content `加入` and like self-test count `10`.

Files touched:
- `douyin-cloud-service/server.js`
- `douyin-cloud-service/smoke-test.js`
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `node smoke-test.js` with bundled Node runtime
- `git push origin main`
- Chrome platform self-test on `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/diagnose_tool?subTab=1&tab=openAPI`
- Chrome Douyin Cloud publish on `https://cloud.douyin.com/app/deploy/publish?app=tt02d6746b9cb2fc0e10&env=env-cuABsk2rKR&service=1m3j5q7o3dezm&source=1&type=5`
- `GET https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/health`
- `GET https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/douyin/diagnostics`
- `GET https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/live/events?after=0`

Verification:
- Local cloud smoke test passed.
- Douyin Cloud release `427674` reached status `成功`; the build log locked commit `a0b468f5216181eb84217e8af241c4eb3e70231c`.
- `/api/health` returned `{"code":0,"message":"ok","service":"jizhantuwei-live-cloud-service"}`.
- Platform self-test returned `推送成功` for all four gift rows.
- Cloud event queue returned `latestSeq: 6`; all six callbacks arrived from `source: douyin-platform, internal-callback` with `callbackPath: /live_data_callback`.
- Self-test gift mappings are now correct: `仙女棒 -> pistol`, `能力药丸 -> shotgun`, `能量电池 -> machine`, `超级空投 -> giant`.
- Self-test comment arrived as `live_comment` with `comment: 加入`.
- Self-test like arrived as `live_like` with `count: 10`.

Risks / notes:
- This proves the Open Platform self-test callback path to Douyin Cloud and the cloud event queue. It still is not the final real live-room validation because the events are marked `test: true`.
- Real comment, like, and gift validation still needs the debug account to launch the official debug/live entry and send events from a real room context.
- Do not use old MRTGD APPID `ttd2d6a46b4cb22c0b10`, service `1m3ly8e4e9hqe`, or repo `mrtgd-douyin-cloud-service`.

Next step:
- Use the newly added test/debug account to launch the official debug package, then verify real-room `roomId`, comment, like, gift callbacks, and gameplay client polling from `/api/live/events`.

## 2026-06-14 14:17 - Debug Package Deployed, Test Member Missing

Status: Partial / Waiting for a real Douyin debug member and live-room launch

What changed:
- Rechecked the target Open Platform page for APPID `tt02d6746b9cb2fc0e10`; the debug package now shows `部署完成`.
- Confirmed package metadata on the page: submit time `2026-06-14 14:01:57`, package version `1.0.0_`, cloud start enabled, resolution `1080P`, display ratio `9:16`.
- Opened `开播测试账号`; the test member table currently shows `暂无数据`.
- Opened the add-member dialog only to inspect it. The platform requires scanning a QR code with the real Douyin account that should become the debug live account.
- Rechecked cloud service health and diagnostics. Health is good, but diagnostics still only contain prior HTTP smoke-test callbacks using `room-codex-verify`; no real platform live-room `roomId` has been proven yet.

Files touched:
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- Chrome read-only check of `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/version`
- Chrome read-only check of `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/test_account_config`
- `Invoke-WebRequest -UseBasicParsing 'https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/health'`
- `Invoke-WebRequest -UseBasicParsing 'https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/douyin/diagnostics'`
- `Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8080/index.html?v=1781266680000&liveCloudUrl=https%3A%2F%2F1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run'`

Verification:
- Debug package deployment is complete on the target APPID page.
- Test member list is empty.
- Add-member flow requires a real Douyin App QR scan; no member was added by Codex.
- Cloud `/api/health` returned `{"code":0,"message":"ok","service":"jizhantuwei-live-cloud-service"}`.
- Local preview URL returned HTTP `200`.

Risks / notes:
- Do not treat the prior `room-codex-verify` callback diagnostics as real platform validation. They are HTTP smoke tests, not official live/debug-room callbacks.
- The remaining gate is human/platform-side: bind a real Douyin debug member, set that account private if required by the platform guide, launch the debug package through Live Companion or the Douyin live room interaction panel, then send real comment/like/gift events.
- Do not use old MRTGD APPID `ttd2d6a46b4cb22c0b10`, service `1m3ly8e4e9hqe`, or repo `mrtgd-douyin-cloud-service`.

Next step:
- Have the real Douyin debug account scan the QR code in `开播测试账号`, then launch `testlevel002-调试包` from the official live/debug entry and verify real `roomId`, comment, like, and gift callbacks.

## 2026-06-14 14:04 - Debug Package Uploaded To Open Platform

Status: Partial / Waiting for platform cloud deployment

What changed:
- Completed the Open Platform debug package upload for APPID `tt02d6746b9cb2fc0e10`.
- Uploaded package `release/douyin-debug/JiZhanTuWei_1.0.0.zip`.
- Filled debug version `1.0.0`, startup exe `JiZhanTuWei.exe`, resolution `1080P`, and display ratio `9:16`.
- After file selection, the platform showed `调试版本上传成功`; the debug version list now shows version `1.0.0_` with status `部署中`.

Files touched:
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- Browser upload on `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/version`
- Polled the version page after upload.

Verification:
- The uploaded file was recognized by the platform as `JiZhanTuWei_1.0.0.zip`.
- The platform returned the visible success message `调试版本上传成功`.
- The version list shows debug version `1.0.0_` and status `部署中`.

Risks / notes:
- Platform cloud deployment is not finished yet. The page says debug package deployment can take about 30 minutes.
- Real live-room validation is still pending until deployment completes and the debug package can be launched from the official live/debug entry.

Next step:
- Continue polling the debug version status. After deployment succeeds, add/configure a debug member if needed and launch through the official debug/live entry to verify real `roomId`, comment, like, and gift callbacks.

## 2026-06-14 13:47 - Platform Ability Config And Gift Mapping Verified

Status: Partial / Package upload still blocked by Chrome file chooser

What changed:
- Configured Open Platform live data development callbacks for APPID `tt02d6746b9cb2fc0e10`: gift, comment, and like all point to Douyin Cloud service `jztw-live-svc` callback path `/live_data_callback`.
- Added Douyin Cloud callback path `jztw_live_data` -> `/live_data_callback` for service `1m3j5q7o3dezm`.
- Configured platform gift ability with 4 existing platform gifts: `仙女棒(1)` -> normal soldiers, `能力药丸(10)` -> shotgun soldiers, `能量电池(99)` -> machine-gun soldiers, `超级空投(888)` -> giant soldiers.
- Configured platform comment ability with keyword `加入`, description `加入战斗`.
- Updated `douyin-cloud-service/server.js` so normalized cloud gift callbacks include `giftType` (`pistol`, `shotgun`, `machine`, `giant`) before the Cocos client polls `/api/live/events`.
- Published Douyin Cloud release `427648` from GitHub repo `zlan8535-sketch/jizhantuwei-live-game`, branch `main`, commit `83fc95c`.

Files touched:
- `douyin-cloud-service/server.js`
- `douyin-cloud-service/smoke-test.js`
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `node smoke-test.js` with bundled Node runtime
- `git push origin main`
- `POST https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/live_data_callback`
- `GET https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/live/events?after=0`

Verification:
- Local cloud smoke test passed.
- Douyin Cloud release `427648` reached status `成功`.
- Deployed `/api/health` still returns `jizhantuwei-live-cloud-service`.
- Online gift callback tests returned expected mappings: `pistol`, `shotgun`, `machine`, `giant`.
- The correct repo remains `https://github.com/zlan8535-sketch/jizhantuwei-live-game.git`; do not use the old MRTGD repo/service.

Risks / notes:
- Debug package upload is still not complete. Chrome's file upload flow did not open a usable file chooser for `release/douyin-debug/JiZhanTuWei_1.0.0.zip`; a fresh platform tab worked for normal page control, but file selection still did not attach the zip.
- Platform config changes say they are bound to a new package upload, so this remains the main blocking item before official debug/live validation.
- Real live-room validation is still not proven until the package launches through the official debug/live entry and receives real `roomId` callbacks.

Next step:
- Complete debug package upload on `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/version`, then wait for platform cloud deployment and validate real comment/like/gift callbacks from a live/debug room.

## 2026-06-14 13:16 - Douyin Cloud Git Deploy Verified

Status: Done / Needs platform ability and package upload verification

What changed:
- Created the target APPID Douyin Cloud service `jztw-live-svc` in env `env-cuABsk2rKR`.
- Added root `Dockerfile` and `.dockerignore` so Douyin Cloud can build only `douyin-cloud-service/` from the dedicated repository root.
- Published the cloud service through Git deployment from `https://github.com/zlan8535-sketch/jizhantuwei-live-game`, branch `main`, commit `6dff1af`.
- Repacked the debug package with the latest live cloud polling build.

Files touched:
- `Dockerfile`
- `.dockerignore`
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `git push origin main`
- `GET https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/health`
- `POST https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/live_data_callback`
- `GET https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run/api/live/events?after=0`

Verification:
- Douyin Cloud release id `427642` reached status `成功`.
- Deployed domain: `https://1m3j5q7o3dezm-env-cuABsk2rKR.service.douyincloud.run`.
- `/api/health` returned `{"code":0,"message":"ok","service":"jizhantuwei-live-cloud-service"}`.
- `/live_data_callback` accepted a test `live_comment`.
- `/api/live/events?after=0` returned the normalized test event.
- Debug package: `release/douyin-debug/JiZhanTuWei_1.0.0.zip`, SHA256 `178041DA9668A77C0966AEE817D97B856F00696F5692B98224B0576B390CAFF2`, size `220752192`.

Risks / notes:
- This proves the deployed cloud callback service and polling event endpoint. It still does not prove real Douyin live-room callbacks until the app is launched through the official debug/live entry with real `roomId`.
- Do not use old MRTGD service/app ids. Current APPID is `tt02d6746b9cb2fc0e10`, env is `env-cuABsk2rKR`, service id is `1m3j5q7o3dezm`.

Next step:
- Configure platform comment/like/gift abilities and callback paths for APPID `tt02d6746b9cb2fc0e10`, upload the refreshed debug package, then verify real platform callbacks reach `/live_data_callback` and the game client polling bridge.

## 2026-06-14 12:43 - Local Cloud Event Polling Verified

Status: Done / Needs deployed cloud verification

What changed:
- Added a client polling fallback for Douyin Cloud callbacks: the Cocos client can read `liveCloudUrl`, `jztwCloudUrl`, `cloudUrl`, `window.__JZTW_LIVE_CLOUD_URL__`, `window.__DY_LIVE_CLOUD_URL__`, or localStorage values and poll `/api/live/events`.
- Cloud events are translated into the existing live bridge: gift -> `onLiveGift`, like -> `onLiveLike`, comment -> `onLiveComment`.
- Initial cloud sync uses `latestSeq` so old callbacks are not replayed when the page first opens.
- Added bridge helpers `window.__JZTW_LIVE__.setCloudUrl(url)` and `window.__JZTW_LIVE__.pollCloud()`.
- Disabled the legacy `PrivacyUI` auto-popup during live preview by marking `showPrivacy=false` in `AutoCheck`; this removes the large first-launch privacy overlay from local preview.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/UI/HomeUI/AutoCheck.ts`
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `& 'C:\CocosCreator\3.8.3\CocosCreator.exe' --project 'C:\projects\JiZhanTuWei_3.8.3ts' --build 'platform=web-mobile;debug=false'`
- `POST http://127.0.0.1:18080/live_data_callback` with local comment and gift test payloads.
- `GET http://127.0.0.1:18080/api/live/events?after=...`

Verification:
- Build passed: `temp/builder/log/web-mobile2026-6-14 12-40.log`, `build success in 18956`.
- Local cloud health returned `{"code":0,"message":"ok","service":"jizhantuwei-live-cloud-service"}`.
- Preview URL verified: `http://127.0.0.1:8080/index.html?v=1781262000000&liveCloudUrl=http%3A%2F%2F127.0.0.1%3A18080`.
- Client log showed `Live cloud synced at seq 3`.
- Simulated gift `gift_giant_10` produced client log `礼物出兵: PreviewGift2 巨人兵x10` and visible giant soldiers in the preview.
- The privacy policy overlay no longer blocks first-screen preview.

Risks / notes:
- This proves the fallback local chain: cloud service -> `/api/live/events` -> gameplay client. It does not prove the real Douyin platform callback chain until the app is launched through the official live/debug entry with real `roomId`.
- The currently known public cloud URL still belongs to the old MRTGD route and must not be used as the JiZhanTuWei deployment target.

Next step:
- Bind/deploy Douyin Cloud for APPID `tt02d6746b9cb2fc0e10` from `https://github.com/zlan8535-sketch/jizhantuwei-live-game`, then configure comment/like/gift abilities and verify real callbacks reach `/live_data_callback` and the gameplay client.

## 2026-06-14 12:27 - Dedicated GitHub Repository Created

Status: Done / Needs platform binding

What changed:
- Created a dedicated GitHub repository for this project: `https://github.com/zlan8535-sketch/jizhantuwei-live-game`.
- Added `origin` in `C:\projects\JiZhanTuWei_3.8.3ts`.
- Pushed local `main` to the new repository.
- Updated the release checklist so future Douyin Cloud work uses this dedicated repository instead of the old MRTGD repository.

Files touched:
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `git remote add origin https://github.com/zlan8535-sketch/jizhantuwei-live-game.git`
- `git push -u origin main`

Verification:
- GitHub page loaded as `zlan8535-sketch/jizhantuwei-live-game`.
- Local `origin` points to `https://github.com/zlan8535-sketch/jizhantuwei-live-game.git`.
- Initial pushed commit: `8c42651 Initialize JiZhanTuWei live project`.

Risks / notes:
- Douyin Cloud is not yet bound to this new repository.
- The old cloud service URL still belongs to the MRTGD route and must not be used as the JiZhanTuWei deployment target.

Next step:
- Switch/create the Douyin Cloud Git deployment for target APPID `tt02d6746b9cb2fc0e10` to use `zlan8535-sketch/jizhantuwei-live-game`, preferably deploying the `douyin-cloud-service/` subdirectory or a repository/service layout that Douyin Cloud supports.

## 2026-06-14 12:22 - Project Repository Separation

Status: Partial

What changed:
- Confirmed `C:\projects\JiZhanTuWei_3.8.3ts` was not a Git repository and had no dedicated GitHub remote.
- Searched the connected GitHub installation for `jizhantuwei`, `JiZhanTuWei`, and `激战突围`; no dedicated repository was found.
- Reverted the accidental JiZhanTuWei cloud-service commit from the old MRTGD repository `zlan8535-sketch/mrtgd-douyin-cloud-service` using a normal revert commit.
- Initialized a new local Git repository in `C:\projects\JiZhanTuWei_3.8.3ts`.
- Updated `.gitignore` so local screenshots, release zips, build output, temp/library/native output, and other generated artifacts are not included in the project repository.
- Updated `docs/douyin-platform-release-checklist.md` to require a dedicated JiZhanTuWei GitHub repository before Douyin Cloud Git deployment.

Files touched:
- `.gitignore`
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `git -C C:\tmp\mrtgd-douyin-cloud-service revert --no-edit 26ad27c`
- `git -C C:\tmp\mrtgd-douyin-cloud-service push origin main`
- `git init -b main`
- GitHub installation search for `jizhantuwei`, `JiZhanTuWei`, and `激战突围`

Verification:
- Old MRTGD remote now has revert commit `a2f9670 Revert "Adapt cloud service for JiZhanTuWei app"`.
- `gh` CLI is not installed.
- The GitHub connector available in this environment can search and edit existing repositories, but does not expose repository creation.

Risks / notes:
- A dedicated remote still needs to be created, for example under `zlan8535-sketch/jizhantuwei-live-game` or another project-specific name.
- Do not select or deploy from `mrtgd-douyin-cloud-service` for this project.

Next step:
- Create/connect the dedicated JiZhanTuWei GitHub repository, push this local repository to it, then update Douyin Cloud Git deployment to use that dedicated repository.

## 2026-06-14 12:12 - Douyin Platform Readiness Review

Status: Partial / Needs implementation and platform verification

What changed:
- Rechecked the target Open Platform app `tt02d6746b9cb2fc0e10`; Chrome shows app `testlevel002`, currently at step `3 开发玩法&提审`, with `申请能力`, `开发玩法`, and `提交审核` still actionable.
- Compared against the previous MRTGD cloud-service flow from Git commit `de26d78`: the reference flow had comment/like/gift/fanclub/viewer-enter callbacks configured to `mrtgd-live-svc / /live_data_callback`.
- Confirmed the JiZhanTuWei cloud-service source was pushed to GitHub as `26ad27c Adapt cloud service for JiZhanTuWei app`.
- Confirmed the deployed Douyin Cloud domain still returns `mrtgd-live-cloud-service`, so Git has been pushed but Douyin Cloud has not deployed the new JiZhanTuWei code.
- Confirmed the current client has a local/direct live bridge (`__JZTW_LIVE__` and guarded `tt.onLive...` bindings), but no confirmed cloud-service-to-client delivery path such as Douyin Cloud websocket gateway, SDK direct-push, or polling `/api/live/events`.

Files touched:
- `docs/gameplay-handoff.md`
- `docs/douyin-platform-release-checklist.md`

Commands run:
- `git ls-remote https://github.com/zlan8535-sketch/mrtgd-douyin-cloud-service.git HEAD`
- `Invoke-WebRequest https://1m3ly8e4e9hqe-env-WDdf2rOzyA.service.douyincloud.run/api/health`
- `git -C C:\tmp\mrtgd-douyin-cloud-service show de26d78:README.md`
- Chrome read-only check of `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/indexpage`

Verification:
- Remote Git HEAD is `26ad27c871a7e4993397920d3d164239b9865883`.
- Current deployed health check returns `{"code":0,"message":"ok","service":"mrtgd-live-cloud-service"}`, not the new `jizhantuwei-live-cloud-service`.
- Debug package still exists at `release/douyin-debug/JiZhanTuWei_1.0.0.zip`, size `220751023`, with root folder `JiZhanTuWei_1.0.0/` and launch exe `JiZhanTuWei.exe`.

Risks / notes:
- The cloud URL the user provided belongs to app `ttd2d6a46b4cb22c0b10` / service `mrtgd-live-svc`, while the current target APPID is `tt02d6746b9cb2fc0e10`; do not accidentally finish platform configuration on the old app.
- The Douyin Cloud page showed a cost/arrears notice during publish attempts. If the account/resource is restricted, deployment may be blocked until billing is resolved.
- Official Douyin docs describe a server-to-client command delivery step after `/live_data_callback`; this project has not yet proven that step.

Next step:
- Decide and implement the formal client delivery path first: preferably Douyin Cloud websocket gateway / platform SDK path if available for this Cocos cloud-start package, otherwise add a robust polling adapter to `/api/live/events` as a practical fallback.
- Deploy the Git commit in Douyin Cloud, verify `/api/health` returns `jizhantuwei-live-cloud-service`, configure target APPID abilities and callback paths, upload the debug exe zip, then launch from the official debug/live entry and verify real roomId/comment/like/gift callbacks.

## 2026-06-13 22:05 - JiZhanTuWei Douyin Cloud Service Source

Status: Partial

What changed:
- Located an existing local `douyin-cloud-service` implementation from another Cocos 3.8.3 live project.
- Copied it into this project as `douyin-cloud-service/`.
- Adapted the service to APPID `tt02d6746b9cb2fc0e10`.
- Renamed package/service identity to `jizhantuwei-live-cloud-service`.
- Added `douyin-cloud-service/deploy-dycloud.ps1` for future Douyin Cloud CLI deployment.
- Added `docs/douyin-platform-release-checklist.md` to track platform abilities, cloud Git publish, upload fields, and verification gates.

Files touched:
- `douyin-cloud-service/package.json`
- `douyin-cloud-service/server.js`
- `douyin-cloud-service/smoke-test.js`
- `douyin-cloud-service/README.md`
- `douyin-cloud-service/deploy-dycloud.ps1`
- `docs/douyin-platform-release-checklist.md`
- `docs/gameplay-handoff.md`

Commands run:
- Copied the local reusable `douyin-cloud-service` folder into `C:\projects\JiZhanTuWei_3.8.3ts`.
- `C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe smoke-test.js`
- `Get-Command dycloud,open-dy,tt,ttide,douyin,douyin-devtools,bytedance-devtools`

Verification:
- Local smoke test passed: `/api/health`, `/start_game`, `/live_data_callback`, `/websocket_callback`, `/api/live/state`, and `/api/live/events` all validated against APPID `tt02d6746b9cb2fc0e10`.
- Search confirms the copied cloud service no longer references the old APPID `ttd2d6a46b4cb22c0b10`.

Risks / notes:
- This creates the cloud-service source required for Git deployment, but it has not been pushed to a remote Git repository or deployed in Douyin Cloud.
- GitHub connector did not find an accessible cloud repository for this project.
- `dycloud` / official Douyin cloud CLI is not installed on this machine, so CLI deployment could not be performed.
- Platform ability configuration for comment, like, and gift is still not confirmed complete.

Next step:
- Push `douyin-cloud-service/` to the Git repository that Douyin Cloud should deploy from, or install/authenticate `dycloud` and run `douyin-cloud-service/deploy-dycloud.ps1`.
- In the Open Platform, configure comment/like/gift callbacks to the deployed service `/live_data_callback`, then retry package upload.

## 2026-06-13 21:42 - Douyin Platform Upload Prep And Remaining Platform Work

Status: Partial / Blocked

What changed:
- Confirmed the correct Douyin Open Platform app page is `APPID: tt02d6746b9cb2fc0e10`.
- Chrome reached `https://developer.open-douyin.com/sonic/tt02d6746b9cb2fc0e10/develop/version`.
- Platform `上传调试版本` requires a Windows cloud-start package: zip only, filename like `{name}_{version}.zip`, zip must extract to one same-named root folder, and the form requires an `.exe` launch name.
- Cocos native Windows build was attempted with output `build/JiZhanTuWei_1.0.0`; it failed because this machine has no usable Visual Studio C++ compiler / `CMAKE_CXX_COMPILER`.
- Prepared a fallback NW.js cloud-start package using the current `build/web-mobile` output and an existing NW.js runtime shell.

Files touched:
- `release/douyin-debug/JiZhanTuWei_1.0.0/`
- `release/douyin-debug/JiZhanTuWei_1.0.0.zip`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=windows;debug=false;name=JiZhanTuWei;outputName=JiZhanTuWei_1.0.0;buildPath=project://build;md5Cache=false;sourceMaps=false"`
- PowerShell packaging script that copies `build/web-mobile` into `release/douyin-debug/JiZhanTuWei_1.0.0`, renames `mrtgd.exe` to `JiZhanTuWei.exe`, writes NW.js `package.json`, and compresses `JiZhanTuWei_1.0.0.zip`.

Verification:
- `release/douyin-debug/JiZhanTuWei_1.0.0.zip` exists, about 220.8 MB.
- Zip structure starts with one root folder: `JiZhanTuWei_1.0.0\`.
- Root folder contains `JiZhanTuWei.exe`.
- Packaged `assets/Game/index.js` contains `__JZTW_LIVE__`, `__DY_LIVE_GAME__`, gift GM, comment GM, and like GM bridge code.
- SHA256: `1E130DB891279F21FBCF0B9A33DC8B484D14EDD984A2A30A1D94BA941002FFFF`.

Risks / notes:
- The NW.js package is a practical cloud-start wrapper, not a true Cocos native Windows build. Native Windows build requires installing/configuring Visual Studio C++ Build Tools.
- The Douyin platform upload form was reached, but automated Chrome control became unstable while selecting the large zip, so upload is not confirmed.
- User explicitly noted that the following platform work is still required and must not be forgotten:
  - Configure Douyin platform abilities for gifts, comments, and likes.
  - Complete Douyin Cloud Git publish/deploy workflow.

Next step:
- Finish platform-side comment/like/gift ability configuration first.
- Complete Douyin Cloud Git publish/deploy setup.
- Then upload `release/douyin-debug/JiZhanTuWei_1.0.0.zip` as the debug version with version `1.0.0`, launch exe `JiZhanTuWei.exe`, display ratio `9:16`, and verify real live-room callbacks.

## 2026-06-13 21:24 - ByteDance Mini Game Package

Status: Partial

What changed:
- Set Cocos service APPID to `tt02d6746b9cb2fc0e10` in `settings/v2/packages/cocos-service.json`.
- Added `profiles/v2/packages/bytedance-mini-game.json` with a ByteDance mini-game build profile for the target APPID.
- Built `build/bytedance-mini-game`.
- Cocos 3.8.3 still emits `packages.bytedance-mini-game.appid: testappId` in the build task options, so the generated `project.config.json` was post-fixed to `tt02d6746b9cb2fc0e10`.
- Added `build-bytedance-mini-game.ps1` as a repeatable helper intended to build and patch the generated `project.config.json`.
- Created upload handoff zip: `release/JiZhanTuWei_bytedance_tt02d6746b9cb2fc0e10_20260613_2118.zip`.

Files touched:
- `settings/v2/packages/cocos-service.json`
- `profiles/v2/packages/bytedance-mini-game.json`
- `build-bytedance-mini-game.ps1`
- `build/bytedance-mini-game/project.config.json`
- `release/JiZhanTuWei_bytedance_tt02d6746b9cb2fc0e10_20260613_2118.zip`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=bytedance-mini-game;debug=false;outputName=bytedance-mini-game;taskName=bytedance-mini-game;appid=tt02d6746b9cb2fc0e10"`
- PowerShell JSON post-process for `build/bytedance-mini-game/project.config.json`.
- `Compress-Archive -Path build\bytedance-mini-game\* -DestinationPath release\JiZhanTuWei_bytedance_tt02d6746b9cb2fc0e10_20260613_2118.zip`

Verification:
- Latest ByteDance build log: `temp/builder/log/bytedance-mini-game2026-6-13 21-16.log`, ended with `build success`.
- `build/bytedance-mini-game/project.config.json` now contains `"appid":"tt02d6746b9cb2fc0e10"`.
- Built ByteDance package contains `window.__JZTW_LIVE__` / `window.__DY_LIVE_GAME__` bridge code in `subpackages/Game/game.js`.
- Release zip exists and is about 17.2 MB.

Risks / notes:
- `build-bytedance-mini-game.ps1` did not complete inside the Codex sandbox because Cocos attempted to use `C:\Users\CodexSandboxOffline` and hit Creator/engine cache permission errors. Direct Cocos build from the actual project path succeeded before that, and the generated package remains valid.
- No ByteDance/Douyin developer tool CLI was found on this machine (`tt`, `ttide`, `bytedance-devtools`, `douyin-devtools` not available). Real platform upload and live callback validation are still not done.
- The formal upload still requires opening/importing `build/bytedance-mini-game` or the zip in the official Douyin/ByteDance tool or platform flow, then launching through the live debug entry to verify room context and real comment/like/gift callbacks.

Next step:
- Install or open the official Douyin/ByteDance developer tool, import `build/bytedance-mini-game`, upload/debug under APPID `tt02d6746b9cb2fc0e10`, then validate real live callbacks call into `__JZTW_LIVE__`.

## 2026-06-13 21:12 - Live Comment/Like/Gift Bridge

Status: Done

What changed:
- Added a runtime live interaction bridge on `window.__JZTW_LIVE__` and `window.__DY_LIVE_GAME__`.
- External callers can now trigger:
  - `comment(payload)` / `join(payload)`: adds 1 normal viewer soldier and can bypass the 50 active cap for first join.
  - `like(payload)`: every 10 likes from the same viewer adds 1 normal viewer soldier.
  - `gift(payload)`: adds existing soldier types only, defaulting to 10 soldiers per gift batch.
- Gift mapping reuses existing battle units:
  - normal/default gift -> 10 pistol soldiers.
  - shotgun/short-gun gift -> 10 shotgun soldiers.
  - heavy/machine/high gift -> 10 machine-gun soldiers.
  - giant/top gift -> 10 giant soldiers.
- Added GM buttons for `模拟评论` and `点赞x10`, so the new comment/like bridge can be tested from the left GM panel.
- The bridge also attempts guarded binding for common `tt` live callback names if they exist, without breaking web preview when they do not.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- `Invoke-WebRequest http://127.0.0.1:8080/index.html?v=1781270000000`

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-13 21-09.log`, ended with `build success`.
- Local preview URL returned HTTP 200.

Risks / notes:
- This is the client-side bridge and local/debug trigger point. Formal Douyin live validation still needs the platform package/debug launch to confirm real room context and live callbacks.
- Current settings do not yet show `tt02d6746b9cb2fc0e10` in project config, and no `build/bytedance-mini-game` output exists yet.

Next step:
- Configure/build `bytedance-mini-game` with APPID `tt02d6746b9cb2fc0e10`, then validate the package in Douyin/ByteDance dev tools or the official live debug entry.

## 2026-06-13 21:08 - GM Panel Header Collapse

Status: Done

What changed:
- Changed the left live GM panel from an external `GM<` / `GM>` toggle into a header-style `LIVE GM -` / `LIVE GM +` toggle.
- Expanded state keeps the full command list and feedback label visible.
- Collapsed state keeps only a small `LIVE GM +` bar visible at the upper-left, so the debug panel no longer covers the battle view.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- `C:\projects\JiZhanTuWei_3.8.3ts\serve-web-mobile.ps1`

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-13 21-04.log`, ended with `build success`.
- Local preview server responds at `http://127.0.0.1:8080/index.html?v=1781269500000` with HTTP 200.

Risks / notes:
- The in-app browser automation tool was not available in this turn, so visual click verification should be done by opening the preview and tapping the `LIVE GM -` header.

Next step:
- If the collapsed bar still overlaps important UI, move its collapsed position slightly lower or farther left.

## 2026-06-12 17:58 - Live Damage/Tank Rank And Collapsible GM

Status: Done

What changed:
- Added independent live battle rank UI on the right side of the screen, separate from the GM panel.
- The rank UI shows two columns: damage dealt and damage taken, each listing the top 3 viewer profiles.
- Viewer damage is aggregated by `viewerId`, so multiple soldiers from one viewer contribute to the same viewer row.
- Added `ViewerDamageDealt` and `ViewerDamageTaken` role events.
- Player bullets, grenade explosions, and direct role/enemy collision damage now pass viewer source data into enemy damage.
- Viewer soldiers report damage taken from `Role.byHit()`.
- GM panel can now collapse/expand through an independent `GM<` / `GM>` button; collapse hides the GM panel body and keeps the toggle visible.

Files touched:
- `assets/Init/Managers/EventTypes.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Game/Script/Custom/BasicRole.ts`
- `assets/Game/Script/Custom/Enemy.ts`
- `assets/Game/Script/Custom/Role.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/Game/Script/Custom/bullet/BasicBullet.ts`
- `assets/Game/Script/Custom/bullet/GrenadesBullet.ts`
- `assets/Game/Script/Custom/bullet/MergeBullet.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/index.html?v=1781258268685`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-12 17-55.log`, ended with `build success`.
- Browser preview loaded successfully.
- The right-side damage/tank rank panel appears independently from the left GM panel.
- GM collapse and expand were tested: the panel hides/shows and emits visible `GM 已隐藏` / `GM 已展开` feedback.
- Using GM `观众x200` plus `当前出敌` produced visible damage and damage-taken rank values for `GiftViewer`.

Risks / notes:
- The rank currently tracks viewer soldiers only. Non-viewer/free soldiers are not shown in the live rank.
- Turrets/drones/environment props are not attributed to a viewer unless their source data is explicitly added later.
- Existing build warnings remain: Rollup eval warning and missing Texture2D for `normal_test`.

Next step:
- If gift-created props or future skills should count toward a viewer's damage, pass `viewerData` through those prop creation paths too.

## 2026-06-12 17:35 - Viewer Reserve Priority And First Join Bypass

Status: Done

What changed:
- Added source metadata to viewer soldier data: `sourceType`, `reservePriority`, and `bypassActiveCap`.
- Viewer first-join soldiers can bypass the 50 active soldier cap and enter the field directly, while still respecting the formation hard limit.
- Reserve pool insertion is now priority sorted instead of pure FIFO.
- Gift soldiers use `sourceType: viewer_gift` and `reservePriority: 0`, so they are released before lower-priority reserve soldiers.
- Free soldiers created by normal level/gate add-role logic use `sourceType: free` and `reservePriority: 20`, so they release after gift soldiers.
- GM `观众加入` now simulates first join with cap bypass; GM `观众x200` and the four gift buttons use gift-priority reserve behavior.

Files touched:
- `assets/Game/Script/Custom/Role.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/index.html?v=1781256858403`.

Verification:
- Web Mobile build log `temp/builder/log/web-mobile2026-6-12 17-32.log` ended with `build success`.
- Browser preview loaded successfully.
- GM `观众x200` changed active soldiers from 24 to 50 and reserve soldiers to 174.
- GM `观众加入` then changed active soldiers from 50 to 51 while reserve stayed 174, confirming first-join bypass works.

Risks / notes:
- First-join bypass only exceeds the configured 50 active cap; it does not exceed `GlobalConfig.Formation.length`, because formation positions are required for active soldiers.
- Reserve priority is code-verified by queue insertion order. If exact runtime priority tracing is needed later, add a temporary GM/debug log around `releaseReserveRoles()`.

Next step:
- If gift reserve order needs visible QA, add a small debug label or log that prints the source type of the next released reserve soldier.

## 2026-06-12 17:19 - Runtime Stage Number And Enemy Growth 0.5

Status: Done

What changed:
- Changed enemy level growth coefficient from `0.06` to `0.5` in `GlobalConfig.EnemyCfg.lvupStep`.
- Added `GlobalTmpData.currentStageLv` as the runtime display/source level for the stitched long level.
- `RoleLayer` updates `currentStageLv` from the current path segment's source level while the player moves.
- `LevelInfoUI` now refreshes the top level number from `GlobalTmpData.currentStageLv`, so the displayed number changes from level 1 to level 2, 3, etc. as the long level enters content from those original levels.

Files touched:
- `assets/Init/Config/GlobalConfig.ts`
- `assets/Init/Config/GlobalTmpData.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/UI/LevelInfoUI/LevelInfoUI.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/index.html?v=1781255924236`.

Verification:
- Latest relevant Web Mobile build log: `temp/builder/log/web-mobile2026-6-12 17-14.log`, ended with `build success`.
- Browser preview loaded successfully.
- After waiting for the player group to move into the next stitched source segment, the top UI changed from `关卡 1` to `关卡 2`.

Risks / notes:
- With `lvupStep = 0.5`, enemy HP/ATK now grows much faster: normal enemy HP is `2 * (sourceLv * 0.5 + 1)`.
- At source level 2, normal enemy HP is `4`; at source level 10, normal enemy HP is `12`.

Next step:
- Review whether the much stronger enemy scaling feels right with the new 50 active soldier cap and reserve system.

## 2026-06-12 17:12 - Enemy HP Uses Source Level In Long Level

Status: Done

What changed:
- Added `enemyLv` to runtime `LevelDataTmp` so each stitched long-level path segment records the original source level.
- `LevelManager.buildLongLevelData()` now writes the source level for every appended path/enemy segment.
- `RoadLayer` passes each segment's source level into `PathBasic`.
- `PathBasic` includes `sourceLv` when emitting normal enemy spawn events.
- `RoleLayer` stores `sourceLv` in delayed enemy spawn records, passes it into `Enemy.init()`, and uses the current segment source level for GM stage enemies and endless end enemies.
- `Enemy.initProp()` now calculates HP/ATK from `sourceLv` when present, falling back to global `curLv` only when no source level is supplied.

Files touched:
- `assets/Init/SystemStorage/StorageTemp.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Game/Script/Custom/road/RoadLayer.ts`
- `assets/Game/Script/Custom/road/PathBasic.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/Game/Script/Custom/Enemy.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/index.html?v=1781255398313`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-12 17-08.log`, ended with `build success`.
- Browser preview loaded successfully.
- GM `当前出敌` visibly spawned a large enemy batch from the current stage after the change.

Risks / notes:
- Direct HP numbers are not displayed in-game, so runtime verification is based on the code path and successful spawned enemies. Add a temporary GM/debug HP label if exact per-enemy HP inspection is needed.
- The formula is unchanged: `hp = baseHp * (sourceLv * 0.06 + 1)`. Only the level input changed from global preview level to each stitched segment's original level.

Next step:
- If late-stage enemies feel too weak/strong in the long level, tune `GlobalConfig.EnemyCfg.lvupStep` or add a long-level-specific multiplier.

## 2026-06-12 16:56 - Prominent Gift Feedback Banner

Status: Done

What changed:
- Added a prominent top-center live gift feedback banner for viewer gift soldier spawns.
- The banner shows the sender nickname, gift soldier type, spawned soldier count, active soldier count, and reserve soldier count.
- Local gift GM commands now reuse this feedback path after spawning soldiers, so future real gift callbacks can call the same presentation method.
- The banner auto-dismisses after a short animation and is kept above the GM panel while visible.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/index.html?v=1781254417331`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-12 16-52.log`, ended with `build success`.
- Clicked the first gift GM button in preview.
- The banner appeared visibly near the top center with text similar to `GM1 送出 普通兵` and `新增 10 兵 | 场上 34 | 备用 0`.

Risks / notes:
- The current implementation is local presentation for GM gift simulation; production Douyin callbacks should pass the real viewer nickname and use the same feedback path.
- Existing terminal output may show Chinese as mojibake because of console encoding, but the browser preview displayed the banner text correctly.

Next step:
- If gift events become high-frequency, add aggregation/throttling so repeated gifts merge into a short queue instead of restarting the banner every click.

## 2026-06-12 16:36 - Active Soldier Cap To 50

Status: Done

What changed:
- Changed the live active soldier cap from the full 127 formation slots to 50 visible/active soldiers.
- Kept `GlobalConfig.Formation` unchanged, so the existing formation data remains available.
- Extra soldiers still enter the reserve queue, and reserve soldiers still refill the field when active soldiers die.

Files touched:
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- Restarted local static preview server on `http://127.0.0.1:8080/`.
- In-app browser refreshed `http://127.0.0.1:8080/index.html?v=1781253357966`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-12 16-32.log`, ended with `build success`.
- Preview loaded successfully.
- Starting from 24 active soldiers, clicked GM `观众x200`; active soldiers capped at `50`, reserve showed `174`.
- Clicked GM `杀1兵`; active soldiers stayed at `50`, reserve decreased to `173`, confirming reserve refill works under the new cap.

Risks / notes:
- The cap is currently hardcoded in `RoleLayer.maxActiveRoleCount = 50` for local gameplay tuning.
- Existing formation slot count remains 127, so increasing the cap later is a one-value change as long as it does not exceed the formation data length.

Next step:
- Let the user review whether 50 active soldiers feels visually dense enough for live interaction.

## 2026-06-12 16:21 - Gift Soldier Ladder GM

Status: Done

What changed:
- Reworked the local live GM panel around four gift soldier commands.
- Added four gift soldier effects using existing unit/weapon logic only:
  - `礼物普通10`: 10 normal viewer soldiers with `Pistol`.
  - `礼物短枪10`: 10 viewer soldiers with `Shotgun`.
  - `礼物机关10`: 10 viewer soldiers with `MachineGun`.
  - `礼物巨人10`: 10 giant viewer soldiers with `giantLv = 3`.
- Gift GM calls now generate a random/mock `viewerId` each click, e.g. `gm-gift-normal-<timestamp>-<n>`. For production Douyin integration, replace this with the real viewer id from the callback payload.
- Kept the existing `观众加入`, `观众x200`, `杀1兵`, `当前出敌`, and `胜利` buttons for baseline testing.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/index.html?v=1781252432029`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-12 16-18.log`, ended with `build success`.
- Browser preview loaded successfully.
- Clicked all four gift GM buttons once; troop count rose from 4 to 44, and the giant gift visibly spawned 10 giant soldiers.

Risks / notes:
- The current implementation is the local GM/testing side of the gift mapping. Online integration should call `EventTypes.RoleEvents.AddViewerRoles` with the real viewer `viewerId`, nickname/avatar fields, count, weapon type, and giant flags.
- Gift names are local placeholders; replace them with final Douyin gift display names/ids when the platform gift list is finalized.

Next step:
- Wire real gift callback payloads to the same AddViewerRoles event shape when Douyin live integration starts.

## 2026-06-11 17:30 - Viewer Owns Multiple Soldiers

Status: Done

What changed:
- Split viewer account identity from individual soldier identity.
- Added `ViewerProfileData` in `RoleLayer` keyed by `viewerId`, tracking viewer nickname/avatar/job/weapon plus total, active, and reserve soldier counts.
- Extended `ViewerRoleData` with optional `soldierId` and `soldierIndex`, so one viewer can own many soldier instances.
- `AddViewerRoles` now accepts optional `viewerId`, `nickName`, `avatarIndex`, and `job`; repeated calls with the same `viewerId` append soldiers to the same viewer.
- Reserve pool now keeps viewer ownership: entering reserve increments that viewer's reserve count; releasing reserve decrements reserve and increments active; death decrements active.
- GM `观众x200` now uses fixed `viewerId = gm-gift-viewer`, so repeating it simulates one viewer sending multiple batches of soldiers.

Files touched:
- `assets/Game/Script/Custom/Role.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/index.html?v=1781170122255`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-11 17-27.log`, ended with `build success`.
- Browser preview loaded successfully.
- Clicked GM `观众x200` once: active count became `127`, reserve became `77` because the initial 4 soldiers plus 200 viewer soldiers exceed the 127 formation cap.
- Clicked GM `观众x200` again: same `gm-gift-viewer` appended another 200 soldiers, reserve became `277`.
- Clicked GM `杀1兵`: active count stayed `127` and reserve decreased to `276`, confirming reserve replacement still works with viewer-owned soldiers.

Risks / notes:
- There is not yet a visible per-viewer ownership panel; ownership is maintained in runtime data for future gift/comment integration.
- Existing live gift/comment adapters should pass stable platform `viewerId` into `AddViewerRoles` so repeated gifts attach to the same viewer.

Next step:
- When real Douyin callbacks are wired, map each callback's user id to `viewerId` and pass gift-spawn counts through `AddViewerRoles`.

## 2026-06-11 16:05 - Three-Quarters Weapon Tuning Follow-Up Observation

Status: Done

What changed:
- No code changes in this step.
- Continued verification of the three-quarters weapon bullet speed/duration tuning.
- Confirmed `GlobalConfig.Formation.length` is `127`, so the active unit cap is still 127 and extra viewer soldiers should enter reserve.

Files touched:
- `docs/gameplay-handoff.md`

Commands run:
- `Invoke-WebRequest http://localhost:8080/index.html` returned `200`.
- Browser refreshed `http://localhost:8080/index.html?v=1781164965810`.
- GM observation: clicked `观众x200`, then `当前出敌`, then repeated `当前出敌` for stress.

Verification:
- Preview loaded correctly after reconnecting the in-app browser automation.
- A single GM enemy wave reduced the visible troop count noticeably instead of being fully cleared offscreen.
- Repeated GM enemy waves pushed through and wiped the troop, confirming the current three-quarters tuning is much closer/less safe than the earlier long-range behavior.

Risks / notes:
- Do not reduce weapon range further without a gameplay reason; current stress behavior already lets GM enemies overwhelm the troop.
- If normal non-GM waves become too hard, test with one normal stage wave rather than repeated GM stress waves.

Next step:
- Let the user review the preview feel. If they still see too much far-ahead clearing in normal gameplay, tune from the three-quarters baseline in smaller steps.

## 2026-06-11 15:56 - Correct Weapon Bullet Speed And Duration To Three Quarters

Status: Done

What changed:
- Corrected weapon bullet tuning from seven eighths to three quarters of the original values.
- Player weapon `bulletSpd` values are now: pistol/shotgun/firegun/drone `15`, machine gun `22.5`, grenade `3.75`.
- Normal merged bullet prefab `animTime` values are now: pistol/shotgun/firegun `0.6`, machine gun `0.525`, drone `0.375`.
- Grenade remains distance-driven, so `maxDist` is now `2.8125` to preserve three-quarters flight duration after speed correction.

Files touched:
- `assets/Init/Config/GlobalConfig.ts`
- `assets/Game/Prefabs/effects/mergePistolBullet.prefab`
- `assets/Game/Prefabs/effects/mergeShotgunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeFireGunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeMachineGunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeDroneBullet.prefab`
- `assets/Game/Script/Custom/bullet/GrenadesBullet.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/index.html?v=1781164507441`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-11 15-36.log`, ended with `build success`.
- Browser smoke test passed: loaded level 1 preview, clicked GM `观众x200` and `当前出敌`, and combat continued normally.

Risks / notes:
- Because both speed and duration are three quarters, normal bullet travel distance is now `9/16` of the original travel distance.

Next step:
- Continue tuning only after watching whether enemies are still cleared too far ahead or now feel too close.

## 2026-06-11 15:38 - Correct Weapon Bullet Speed And Duration To Seven Eighths

Status: Done

What changed:
- Corrected yesterday's weapon bullet tuning from one eighth to seven eighths of the original values.
- Player weapon `bulletSpd` values are now: pistol/shotgun/firegun/drone `17.5`, machine gun `26.25`, grenade `4.375`.
- Normal merged bullet prefab `animTime` values are now: pistol/shotgun/firegun `0.7`, machine gun `0.6125`, drone `0.4375`.
- Grenade remains distance-driven, so `maxDist` is now `3.828125` to preserve seven-eighths flight duration after the speed correction.

Files touched:
- `assets/Init/Config/GlobalConfig.ts`
- `assets/Game/Prefabs/effects/mergePistolBullet.prefab`
- `assets/Game/Prefabs/effects/mergeShotgunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeFireGunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeMachineGunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeDroneBullet.prefab`
- `assets/Game/Script/Custom/bullet/GrenadesBullet.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/index.html?v=1781163434541`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 20-31.log`, ended with `build success`.
- Browser smoke test passed: loaded level 1 preview, clicked GM `观众x200` and `当前出敌`, and combat continued normally.

Risks / notes:
- Because both speed and duration are seven-eighths, normal bullet travel distance is now `49/64` of the original travel distance.

Next step:
- Tune further only after checking whether enemies are still being cleared too far ahead.

## 2026-06-10 20:33 - Reduce Weapon Bullet Speed And Duration To One Eighth

Status: Done

What changed:
- Reduced all player weapon `bulletSpd` values to one eighth of their previous values.
- Reduced normal merged bullet prefab `animTime` values to one eighth of their previous values.
- Adjusted grenade throw distance because grenade duration is distance-driven (`maxDist / bulletSpd`) rather than prefab `animTime`; new `maxDist = 0.078125` keeps grenade flight duration at one eighth after speed reduction.

Files touched:
- `assets/Init/Config/GlobalConfig.ts`
- `assets/Game/Prefabs/effects/mergePistolBullet.prefab`
- `assets/Game/Prefabs/effects/mergeShotgunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeFireGunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeMachineGunBullet.prefab`
- `assets/Game/Prefabs/effects/mergeDroneBullet.prefab`
- `assets/Game/Script/Custom/bullet/GrenadesBullet.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/index.html?v=1781094739051`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 20-17.log`, ended with `build success`.
- Browser smoke test passed: loaded level 1 preview, clicked GM `观众x200` and `当前出敌`, and combat continued without runtime failure.

Risks / notes:
- Because both speed and duration were reduced to one eighth, normal bullet travel distance is now one sixty-fourth of the previous distance.
- This may make most ranged weapons feel nearly melee-range; raise either `bulletSpd` or `animTime` if the playable range becomes too short.

Next step:
- Use GM spawn enemies to tune whether one sixty-fourth bullet travel distance is too aggressive.

## 2026-06-10 20:19 - Force Local Preview Level One

Status: Done

What changed:
- Added a local preview level override in `StorageSystem` so saved browser progress no longer makes the game start at level 8 or another previously reached level.
- `StorageSystem.init()` applies the override after reading local storage, then saves the corrected data.
- `StorageSystem.addLv()` also reapplies the override after victory progression, so preview stays on level 1 between runs.

Files touched:
- `assets/Init/SystemStorage/StorageSystem.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/index.html?v=1781093975747`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 20-00.log`, ended with `build success`.
- Browser visual smoke test passed: preview loads into the normal road scene with the live GM panel.

Risks / notes:
- Level progression is intentionally disabled for local preview while `_previewForceLv = 1`. Set it to `0` or remove the override when normal level progression is needed again.
- Current static preview server serves `http://localhost:8080/` and `http://localhost:8080/index.html?v=...`; direct `http://localhost:8080/?v=...` returned `Not found` during verification.

Next step:
- Continue gameplay testing from level 1, or disable `_previewForceLv` when testing later levels.

## 2026-06-10 20:02 - Disable TT Recording UI And SDK Hooks

Status: Done

What changed:
- Disabled the `TTRecorder` UI component so the `TTRecord` node stays hidden even on PCMiniGame / TTMiniGame style platform checks.
- Guarded `TTRecorder` run/pause/resume/update paths so it no longer emits record pause/resume SDK events.
- Disabled `TTSDK` automatic record start/stop/pause/resume hooks and made record sharing fail immediately instead of opening video share.

Files touched:
- `assets/UI/LevelInfoUI/TTRecorder.ts`
- `assets/Init/SystemSDK/TTSDK.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=1781092922401`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 20-00.log`, ended with `build success`.
- Browser visual verification passed: the left-side red `正在录屏` icon is gone.

Risks / notes:
- TT video sharing hooks now intentionally no-op/fail. Re-enable them only if the project needs Douyin/Toutiao share-record publishing later.

Next step:
- None for this item.

## 2026-06-10 18:43 - Long Single-Level Data From Later Levels

Status: Done

What changed:
- Added long-level composition in `LevelManager.setData()`.
- The current level now builds a new `LevelDataTmp` from the current level plus the middle path/enemy/prop segments of the next 14 levels.
- `P000` is kept only from the current level, and `P999` is kept only once at the far end of the composed long level.
- Existing road creation, enemy triggers, numeric gates, GM stage enemy lookup, and victory GM continue to use the normal systems because the composed data keeps `path/enemy/prop` arrays aligned.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=1781088168238`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 18-42.log`, ended with `build success`.
- Browser visual smoke test passed: level loads normally, GM panel is present, road/numeric gates render.

Risks / notes:
- This is a composed long level, not yet true runtime-infinite streaming. It prevents stopping at the original level end by moving the only `P999` to the far end after 15 stages.
- If a truly endless runtime road is required, the next step is dynamic path appending in `RoadLayer` before `RoleLayer` reaches the final generated segment.

Next step:
- Let the composed level run deeper or add a GM/time-scale shortcut to jump near stage boundaries for faster validation.

## 2026-06-10 18:19 - GM Enemies Keep Following Troop

Status: Done

What changed:
- Added `Enemy.ignoreEndMark` so selected enemies can skip the end-mark / pass-through transition.
- GM spawned enemies now set `ignoreEndMark = true` when `followOnSpawn` is enabled.
- GM enemies still enter `EnemyStateType.Follow`, so their movement direction is repeatedly recalculated toward the player's current troop center instead of following the original road path or entering the end passage.

Files touched:
- `assets/Game/Script/Custom/Enemy.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=1781086715959`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 18-17.log`, ended with `build success`.
- Browser visual verification: clicking `当前出敌` spawned enemies from above, they chased into the troop and fought through collision rather than visibly entering the end passage.
- The test wave killed the current troop and triggered the resurrection UI, confirming the GM wave is now very direct/aggressive.

Risks / notes:
- Non-GM enemies are unchanged and still use normal path/end-mark behavior.
- GM wave size may need tuning if the goal is visual pressure rather than immediate wipe.

Next step:
- If desired, reduce GM batch size or add a separate "小波追击" GM button for safer debugging.

## 2026-06-10 18:12 - Raise Soldier Count Above Avatar UI

Status: Done

What changed:
- Moved the runtime `ViewerAvatarLayer` behind normal UI siblings instead of placing it at the top of `UILayer`.
- Added runtime sibling-order maintenance in `RoleInfoCmp` so the active count and reserve count labels stay on top within their UI parent.

Files touched:
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/UI/LevelInfoUI/RoleInfoCmp.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=1781086315388`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 18-09.log`, ended with `build success`.
- Browser visual verification passed: after clicking `观众x200`, the active count `127` renders above the viewer avatar dots, and the reserve line remains visible.

Risks / notes:
- Viewer avatar markers are now intentionally below core UI. If a future UI panel covers avatars, only that panel's layering should be adjusted, not the soldier count.

Next step:
- None for this item.

## 2026-06-10 18:05 - Path Props Only Number Gates And Reserve Count Split

Status: Done

What changed:
- Filtered road prop creation so only `GlobalEnum.PropType.Increase` props are instantiated on the path.
- This prevents configured/random weapon props and trap props from appearing on the road; the path now shows only numeric gates.
- Split the role count display into active soldiers and reserve soldiers.
- Active soldiers keep the original large white count, while reserve soldiers show as a separate cyan `备N` line.

Files touched:
- `assets/Game/Script/Custom/road/PathBasic.ts`
- `assets/UI/LevelInfoUI/RoleInfoCmp.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=1781085934092`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 18-04.log`, ended with `build success`.
- Browser visual verification passed: initial road shows numeric gates only (`+3`, `x3`) and no weapon/trap props.
- Browser visual verification passed: clicking `观众x200` shows active count `127` and reserve count `备77` on a separate colored line.

Risks / notes:
- Weapon/trap prop data remains in level configs but is ignored at road prop creation. Restore by removing the `PropType.Increase` filter in `PathBasic.createProps()`.

Next step:
- If numeric gate values need to be rebalanced now that weapons/traps are removed, adjust `LevelConfig` prop entries separately.

## 2026-06-10 17:46 - GM x200 Viewer Soldiers Use Pistol

Status: Done

What changed:
- Changed the `观众x200` GM button to create viewer soldiers with `GlobalEnum.WeaponType.Pistol` instead of random viewer weapons.
- Added optional `weaponType` support to the viewer soldier event path so forced-weapon GM or live events can reuse the same viewer identity, avatar, job, and reserve queue logic.
- Kept `观众加入` random, and kept `巨人观众` on its existing giant viewer flow.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=1781084759441`.

Verification:
- Latest Web Mobile build log: `temp/builder/log/web-mobile2026-6-10 17-44.log`, ended with `build success`.
- Browser visual verification passed: clicking `观众x200` spawned 127 active viewer soldiers and showed `备77`, confirming reserve queue still works.

Risks / notes:
- This change only forces weapon for the `观众x200` GM button. Other live/GM viewer entry points remain unchanged unless they explicitly pass `weaponType`.

Next step:
- If live gift/comment events also need fixed default weapons, pass `weaponType` through those event emitters the same way.

## 2026-06-10 17:36 - Hide Pre-Level Lobby UI

Status: Done

What changed:
- Hid the HomeUI lobby panel before each level, removing the three upgrade cards, sign-in entry, turntable entry, age prompt, and related pre-level lobby buttons.
- Stopped showing `PlayerAssetsUI` from `HomeUI`, removing the top-left remaining coin display during the pre-level screen.
- Disabled `AutoCheck` from automatically popping `SignUI` and `TurntableUI`.
- Kept the live GM panel visible for local testing.

Files touched:
- `assets/UI/HomeUI/HomeUI.ts`
- `assets/UI/HomeUI/AutoCheck.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=<timestamp>`.

Verification:
- Latest Web Mobile build refreshed `build/web-mobile` at `2026-06-10 17:35`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 17-33.log`, ended with `build success`.
- Browser visual verification passed: pre-level upgrade cards, sign-in, turntable, age prompt, and coin UI are gone.

Risks / notes:
- The removed UI is hidden at runtime rather than deleted from prefabs, so it can be restored later if needed.
- Privacy policy text/button is also hidden as part of the HomeUI panel being inactive.

Next step:
- If the pre-level countdown/hand prompt should also be removed, handle that separately in the guide/level start flow.

## 2026-06-10 17:30 - Tidy Live GM Panel

Status: Done

What changed:
- Removed the old messy left-side GM list: `+1兵`, `+5兵`, `x2兵`, drone, weapon, turret, mine, rocket, saw, spike, hammer.
- Removed duplicate `GM 出敌` buttons.
- Rebuilt the GM UI as a single left-side `LIVE GM` panel with a dark translucent background and vertical buttons.
- Kept only the current high-value live/debug commands:
  - `观众加入`
  - `观众x200`
  - `巨人观众`
  - `杀1兵`
  - `当前出敌`
  - `胜利`
- Added runtime z-order maintenance so the GM panel stays above other UI instead of being hidden behind HomeUI/card/tutorial layers.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=<timestamp>`.

Verification:
- Latest Web Mobile build refreshed `build/web-mobile` at `2026-06-10 17:29`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 17-28.log`, ended with `build success`.
- Browser visual verification passed: left-side GM panel is visible and old GM list is gone.

Risks / notes:
- The GM panel is intentionally always kept as the top sibling in its UI parent so it stays usable during local debug.
- The panel may still overlap pre-level cards on very narrow views, but it is much cleaner and no longer sprays commands across the screen.

Next step:
- If more GM commands are needed, add them into this single panel rather than creating free-floating labels.

## 2026-06-10 15:09 - Viewer Soldier Reserve Queue

Status: Done

What changed:
- Added viewer soldier identity data on `Role`: viewer id, nickname, avatar index, job, weapon type, giant flag, and giant level.
- Added `RoleEvents.AddViewerRoles` so live/GM commands can create viewer soldiers with random jobs and random weapons.
- Changed `RoleLayer.createRoles()` so units over the 127 formation cap are queued into `reserveRoleQueue` instead of being discarded.
- Reserve queue supports both normal viewer soldiers and giant viewer soldiers.
- When an active role dies and reserve soldiers exist, `RoleLayer` releases reserve soldiers to fill the freed formation slot.
- Added small head-position avatar markers for active viewer soldiers via a UI overlay layer.
- Viewer soldiers keep their random weapon when global weapon changes; non-viewer soldiers still follow the normal global weapon.
- Updated role count UI to show `active+reserve` when reserve soldiers exist.
- Added GM buttons: `GM 观众`, `GM 观众x200`, `GM 巨人观众`, and `GM 杀1兵`.
- GM tips now include reserve count after viewer join/kill tests.

Files touched:
- `assets/Game/Script/Custom/Role.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Init/Managers/EventTypes.ts`
- `assets/Init/Config/GlobalTmpData.ts`
- `assets/UI/LevelInfoUI/RoleInfoCmp.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=<timestamp>`.
- Clicked `GM 观众x200`, then `GM 杀1兵`.

Verification:
- Latest Web Mobile build refreshed `build/web-mobile` at `2026-06-10 15:08`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 15-08.log`, ended with `build success`.
- Browser visual verification passed: `GM 观众x200` spawned viewer soldiers with small head avatar markers and reserve count.
- Browser visual verification passed: `GM 杀1兵` then showed reserve count dropping to `备74`, confirming one reserve soldier was consumed to fill the lost slot.

Risks / notes:
- Avatar markers are simple generated colored circles with job initials, not real Douyin avatar image URLs yet.
- Many active viewer soldiers naturally create a dense avatar cluster around the formation; if needed, add distance-based hiding or only show joined/recent/high-value viewers.
- Build still reports a pre-existing missing texture warning for `normal_test`, but the build succeeds.

Next step:
- When real live data is connected, map comment/gift user id, nickname, and avatar URL into the `ViewerRoleData` fields instead of using generated GM data.

## 2026-06-10 14:17 - Shrink Pre-Level Upgrade Cards

Status: Done

What changed:
- Added a runtime layout pass in `HomeUI` that finds the three `lvupPropCmp` upgrade cards (`roleNum`, `goldRate`, `giant`) and scales them to 78%.
- Pulled the three cards inward with 170 px spacing while preserving their original vertical positions.
- Fixed the local Web Mobile build splash image path from a stale `E:\cocos-store\...bg.jpg` reference to the current project `settings/logo.png`, which restored full `index.html` output for browser preview.

Files touched:
- `assets/UI/HomeUI/HomeUI.ts`
- `settings/v2/packages/builder.json`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://localhost:8080/?v=<timestamp>`.

Verification:
- Web Mobile build refreshed `build/web-mobile` at `2026-06-10 14:16`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 14-15.log`, ended with `build success`.
- `build/web-mobile/index.html` exists again after fixing the splash path.
- Browser visual verification passed: the three pre-level upgrade cards are smaller and centered with less overlap.

Risks / notes:
- The change is script-driven rather than prefab serialization, so it avoids touching card prefab UUID data.
- The current GM text overlay is still visually crowded over the home screen; this task only resized the three upgrade cards.

Next step:
- If the cards still feel high on narrow screens, lower their Y positions in the same `fitLvupCards()` method.

## 2026-06-10 12:45 - GM Enemies Follow On Spawn

Status: Done

What changed:
- Added `followOnSpawn` to delayed enemy spawn records.
- `GM 出敌` batches now set `followOnSpawn: true`.
- When a GM-spawned enemy is initialized, it immediately switches to `EnemyStateType.Follow`, so it directly pursues the player formation instead of first walking along the short GM helper path.
- Normal stage enemies and end-level endless enemies keep their original path-following behavior.

Files touched:
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/?v=<timestamp>`, entered gameplay, and clicked `GM 出敌`.

Verification:
- Web Mobile build refreshed `build/web-mobile` at `2026-06-10 12:44`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 12-43.log`, ended with `build success`.
- Build output contains `followOnSpawn:!0` and `changeState(S.Follow,null,!0)`.
- Browser visual verification passed: GM enemies spawned from the front/top and immediately pushed into the player formation.

Risks / notes:
- Existing splash image path warning remains unchanged.
- GM enemies still use normal enemy speed values from `GlobalConfig.Enemy[type].spd`; only their initial state changed to Follow.

Next step:
- If GM 出敌 should exactly mirror a specific normal stage wave, reuse the stage `bornPos` path data instead of the current front/top GM spawn point.

## 2026-06-10 12:33 - Remove Local Preview White Banner Block

Status: Done

What changed:
- Disabled the local PC preview test banner that was drawing the large white block at the bottom of the canvas.
- Stopped `AdvertSystem` from applying WeChat banner UI config while running in `PCMiniGame` local preview mode.
- Kept real mini-game platform banner routing intact for `WXMiniGame` and `TTMiniGame`.
- Rebuilt the Web Mobile preview with `debug=false`, which also keeps the Cocos FPS/profiling overlay off.

Files touched:
- `assets/Init/Managers/AdvertManager/AdvertManager.ts`
- `assets/Init/SystemAdvert/AdvertSystem.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Init/InitScripts/Init.ts`
- `assets/Init/SystemSDK/SDK.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=false"`
- In-app browser refreshed `http://127.0.0.1:8080/?v=<timestamp>` and clicked into gameplay.

Verification:
- Web Mobile build refreshed `build/web-mobile` at `2026-06-10 12:32`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 12-32.log`, ended with `build success`.
- Browser visual verification passed: the bottom white block was gone on the pre-start screen and did not reappear after entering gameplay.

Risks / notes:
- Existing splash image path warning remains unchanged.
- If a future preview build is made with `debug=true`, Cocos may show profiling UI again; use `debug=false` for clean browser previews.

Next step:
- Keep local preview builds on `debug=false` unless profiling is intentionally needed.

## 2026-06-10 11:54 - GM Spawn Current-Stage Enemies From Top

Status: Done

What changed:
- Added `EnemyEvents.CreateGmStageEnemys`.
- Added `GM 出敌` buttons to the runtime GM panel.
- `RoleLayer` now handles the GM event by reading the current/nearest stage enemy config from `LevelData.enemy`.
- The GM command spawns large batches using the current stage enemy type config, with a minimum of 80 enemies per type.
- GM enemies spawn from the top/front side of the player formation using `followPos - Player.lineVec * 16` and move toward `followPos + Player.lineVec * 6`.

Files touched:
- `assets/Init/Managers/EventTypes.ts`
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=true"`
- In-app browser refreshed `http://127.0.0.1:8080/?v=<timestamp>` and clicked the high-position `GM 出敌` button.

Verification:
- Web Mobile build refreshed `build/web-mobile/assets/Game/index.js` at `2026-06-10 11:54`.
- Latest build log ended with `build success`.
- Build output contains `CreateGmStageEnemys`, `GM 出敌`, and `GM stage enemies`.
- Browser visual verification passed: clicking the high-position `GM 出敌` button caused large red enemy groups to appear from the top/front side of the player formation.

Risks / notes:
- The GM debug overlay is visually cluttered because it is runtime-generated over existing UI and tutorial hand overlays.
- Console log capture did not show the `GM stage enemies` line during browser verification, but the visual spawn effect was observed.
- Existing splash image path warning remains unchanged.

Next step:
- If more GM buttons are added, replace the overlay with a clean fixed debug panel to avoid overlap and ambiguous click targets.

## 2026-06-10 11:27 - Fix Endless End Enemy Spawn Side

Status: Done

What changed:
- Reversed the end-level endless enemy spawn direction in `RoleLayer`.
- Enemy batches now spawn at `followPos - Player.lineVec * 18` and move toward `followPos + Player.lineVec * 4`, fixing the observed issue where they appeared behind the player formation.

Files touched:
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=true"`
- In-app browser refreshed `http://127.0.0.1:8080/?v=<timestamp>`.

Verification:
- Web Mobile build refreshed `build/web-mobile/assets/Game/index.js` at `2026-06-10 11:27`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 11-25.log`, ended with `build success`.
- Build output confirms `spawn = v3(this.followPos).subtract(forward.clone().multiplyScalar(18))`.
- Preview was refreshed in the in-app browser.

Risks / notes:
- Browser automation did not wait until the natural level end; final spawn-side visual check should be done by playing to the end in preview.
- The existing splash image path warning remains unchanged.

Next step:
- Play to the final stand-shoot section and confirm enemies now enter from the front side of the troops.

## 2026-06-10 11:15 - End-Level Endless Enemies And GM Win

Status: Done

What changed:
- Added end-level debug endless enemy spawning in `RoleLayer`: when all player roles reach final stand-shoot formation, the level keeps adding existing `Normal` enemies in batches of 40, capped at 260 active enemies to avoid browser lockups.
- Natural end-level victory is paused while `endlessEndEnemyEnabled` is true, so the final combat area can keep running for debug.
- Added `GM 胜利` to the runtime GM panel. It calls the existing `GameEvents.GameOver` with `true`.
- Added a second fixed-position visible `GM 胜利` button on the GM panel because the current UI/adapted viewport can push the first rows partly offscreen.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `assets/Game/Script/Custom/RoleLayer.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=true"`
- In-app browser opened `http://127.0.0.1:8080/?v=<timestamp>` and clicked the visible `GM 胜利` button.

Verification:
- Web Mobile build refreshed `build/web-mobile/assets/Game/index.js` at `2026-06-10 11:14`.
- Latest build log: `temp/builder/log/web-mobile2026-6-10 11-13.log`, ended with `build success`.
- Build output contains `endlessEndEnemyEnabled`, the end-level spawn path, and the visible `GM 胜利` button at `v3(155, 50, 0)`.
- Browser verification passed: clicking `GM 胜利` logged `GM: 胜利` and opened `FinishAwardBoxUI`.

Risks / notes:
- Build logs still show pre-existing splash image config error for `E:\cocos-store\GameClient-JiZhanTuWei\assets\Init\Assets\bg.jpg`; Cocos still reports build success.
- End-level endless spawning was verified in build output, but not by waiting to naturally reach the level end during browser automation.
- GM panel is still a rough debug overlay and can visually overlap some game popups; functionally the visible win button was clickable.

Next step:
- If the debug overlay will be used heavily, clean up the GM panel layout into a proper scroll/fixed side panel.

## 2026-06-09 22:20 - Live GM Existing-Only Gifts

Status: Done

What changed:
- Added a code-generated Live GM panel from `LevelManager`.
- GM buttons only call existing game events and prefabs: add soldiers, multiply soldiers, drone, weapon prop, turret, mine, rocket, saw, spikes, hammer.
- No new gift skill mechanics were introduced.

Files touched:
- `assets/Game/Script/Common/LevelManager.ts`
- `docs/gameplay-handoff.md`

Commands run:
- `node C:\CocosCreator\3.8.3\resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js --noEmit --pretty false`
- `C:\CocosCreator\3.8.3\CocosCreator.exe --project C:\projects\JiZhanTuWei_3.8.3ts --build "platform=web-mobile;debug=true"`
- Playwright-core with system Chrome opened `http://127.0.0.1:8080/` and clicked GM buttons.

Verification:
- TypeScript check runs but the project has pre-existing declaration and unrelated UI errors; no new `LevelManager.ts` errors appeared in the output.
- Web Mobile build output refreshed at `build/web-mobile` around 22:15 and contains `LiveGmPanel` in `assets/Game/index.js`.
- Browser verification passed: GM panel rendered, clicking GM buttons logged `GM: +1兵` and `GM: 无人机`; original add-soldier handler also logged `+ 1`, confirming the existing `RoleEvents.AddRoles` path ran.
- Screenshot artifacts: `gm-verify-ready.png`, `gm-verify-plus-drone.png`.

Risks / notes:
- GM prop buttons spawn existing props near the current player position and rely on the original prop collision/effect logic.
- The GM panel is intentionally a runtime-created debug panel; it is visible over gameplay and may sit visually behind modal popups, but click tests still fired.

Next step:
- Wire real Douyin comment/gift callbacks to the same existing-event actions when platform input is ready.
