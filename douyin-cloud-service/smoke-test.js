"use strict";

const assert = require("assert");
const { spawn } = require("child_process");

const APP_ID = "tt02d6746b9cb2fc0e10";
const PORT = Number(process.env.PORT || 18080 + Math.floor(Math.random() * 1000));
const baseUrl = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function main() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
      DOUYIN_APP_ID: APP_ID,
      LIVE_TASK_START_URL: `${baseUrl}/mock/start-task`
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    await wait(800);

    const health = await request("/api/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.body.code, 0);
    assert.equal(health.body.service, "jizhantuwei-live-cloud-service");

    const start = await request("/start_game", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tt-appid": APP_ID,
        "x-room-id": "room-debug"
      },
      body: JSON.stringify({})
    });
    assert.equal(start.response.status, 200);
    assert.equal(start.body.code, 0);
    assert.equal(start.body.data.appId, APP_ID);
    assert.deepEqual(
      start.body.data.taskResults.map(result => result.msgType),
      ["live_like", "live_comment", "live_gift", "live_fansclub", "live_user_enter_leave"]
    );

    const comment = await request("/live_data_callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        msg_type: "live_comment",
        msg_id: "msg-1",
        roomid: "room-debug",
        content: "join"
      })
    });
    assert.equal(comment.response.status, 200);
    assert.equal(comment.body.data.msgType, "live_comment");

    const platformGift = await request("/live_data_callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-room-id": "room-header",
        "x-tt-appid": APP_ID
      },
      body: JSON.stringify([
        {
          msg_id: "platform-gift-1",
          sec_openid: "platform-openid",
          sec_gift_id: "platform-gift-id",
          gift_name: "超级空投",
          gift_num: 1,
          gift_value: 888,
          nickname: "platform-user",
          timestamp: Date.now(),
          test: true
        }
      ])
    });
    assert.equal(platformGift.response.status, 200);
    assert.equal(platformGift.body.data.msgType, "live_gift");
    assert.equal(platformGift.body.data.giftType, "giant");
    assert.equal(platformGift.body.data.roomId, "room-header");

    const platformSelfTestGifts = [
      ["self-test-pistol", "n1/Dg1905sj1FyoBlQBvmbaDZFBNaKuKZH6zxHkv8Lg5x2cRfrKUTb8gzMs=", 10, "pistol"],
      ["self-test-shotgun", "28rYzVFNyXEXFC8HI+f/WG+I7a6lfl3OyZZjUS+CVuwCgYZrPrUdytGHu0c=", 100, "shotgun"],
      ["self-test-machine", "IkkadLfz7O/a5UR45p/OOCCG6ewAWVbsuzR/Z+v1v76CBU+mTG/wPjqdpfg=", 990, "machine"],
      ["self-test-giant", "lsEGaeC++k/yZbzTU2ST64EukfpPENQmqEZxaK9v1+7etK+qnCRKOnDyjsE=", 8880, "giant"]
    ];
    for (const [msgId, giftId, giftValue, giftType] of platformSelfTestGifts) {
      const platformSelfTestGift = await request("/live_data_callback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-room-id": "room-platform-self-test",
          "x-tt-appid": APP_ID
        },
        body: JSON.stringify([
          {
            msg_id: msgId,
            sec_openid: "platform-self-test-openid",
            sec_gift_id: giftId,
            gift_num: 1,
            gift_value: giftValue,
            nickname: "platform-self-test-user",
            timestamp: Date.now(),
            test: true
          }
        ])
      });
      assert.equal(platformSelfTestGift.response.status, 200);
      assert.equal(platformSelfTestGift.body.data.msgType, "live_gift");
      assert.equal(platformSelfTestGift.body.data.giftType, giftType);
      assert.equal(platformSelfTestGift.body.data.roomId, "room-platform-self-test");
    }

    const magicFairyStickGift = await request("/live_data_callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-room-id": "room-magic-gift",
        "x-tt-appid": APP_ID
      },
      body: JSON.stringify([
        {
          msg_id: "magic-fairy-stick-1",
          sec_openid: "magic-openid",
          sec_gift_id: "n1/Dg1905sj1FyoBlQBvmbaDZFBNaKuKZH6zxHkv8Lg5x2cRfrKUTb8gzMs=",
          sec_magic_gift_id: "9tPFzcpEQFovisU3j3coz5tqj/qQ5LHJQJWob/X5bLbxm1s7kYLj0aGSb4k=",
          gift_num: 1,
          gift_value: 10,
          nickname: "magic-user",
          timestamp: Date.now()
        }
      ])
    });
    assert.equal(magicFairyStickGift.response.status, 200);
    assert.equal(magicFairyStickGift.body.data.msgType, "live_gift");
    assert.equal(magicFairyStickGift.body.data.giftType, "shotgun");
    assert.equal(
      magicFairyStickGift.body.data.magicGiftId,
      "9tPFzcpEQFovisU3j3coz5tqj/qQ5LHJQJWob/X5bLbxm1s7kYLj0aGSb4k="
    );

    const colorFairyStickGifts = [
      ["color-blue-stick", "blue fairy stick", "shotgun"],
      ["color-purple-stick", "purple fairy stick", "machine"],
      ["color-gold-stick", "gold fairy stick", "giant"]
    ];
    for (const [msgId, giftName, giftType] of colorFairyStickGifts) {
      const colorFairyStickGift = await request("/live_data_callback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-room-id": "room-color-gift",
          "x-tt-appid": APP_ID
        },
        body: JSON.stringify([
          {
            msg_id: msgId,
            sec_openid: "color-openid",
            sec_gift_id: `${msgId}-id`,
            gift_name: giftName,
            gift_num: 1,
            gift_value: 10,
            nickname: "color-user",
            timestamp: Date.now()
          }
        ])
      });
      assert.equal(colorFairyStickGift.response.status, 200);
      assert.equal(colorFairyStickGift.body.data.msgType, "live_gift");
      assert.equal(colorFairyStickGift.body.data.giftType, giftType);
    }

    const platformColorFairyStickGifts = [
      ["platform-blue-stick", "eplFUy7i0B0fiv0Iym1MpOZa5XmUE8g/WUAyJ6Tc+UJJDpcs7pzclNOz/WM=", "shotgun"],
      ["platform-purple-stick", "4I66OIE1HKWfM7PNvAHtAgYUSNlggSEgcpo3ai8GYQXAWqjrDuH8NtjsWEQ=", "machine"],
      ["platform-yellow-stick", "gs+95ujNzXXSCtLTv97fWgbApTQi0sqz1BULB+7w62g+v4sFxINvxOIrXCw=", "giant"]
    ];
    for (const [msgId, giftId, giftType] of platformColorFairyStickGifts) {
      const platformColorFairyStickGift = await request("/live_data_callback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-room-id": "room-platform-color-gift",
          "x-tt-appid": APP_ID
        },
        body: JSON.stringify([
          {
            msg_id: msgId,
            sec_openid: "platform-color-openid",
            sec_gift_id: giftId,
            gift_num: 1,
            gift_value: 10,
            nickname: "platform-color-user",
            timestamp: Date.now()
          }
        ])
      });
      assert.equal(platformColorFairyStickGift.response.status, 200);
      assert.equal(platformColorFairyStickGift.body.data.msgType, "live_gift");
      assert.equal(platformColorFairyStickGift.body.data.giftType, giftType);
    }

    const unknownCheapGift = await request("/live_data_callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-room-id": "room-cheap-gift",
        "x-tt-appid": APP_ID
      },
      body: JSON.stringify([
        {
          msg_id: "cheap-gift-1",
          sec_openid: "cheap-openid",
          sec_gift_id: "unknown-cheap-gift",
          gift_num: 1,
          gift_value: 10,
          nickname: "cheap-user",
          timestamp: Date.now()
        }
      ])
    });
    assert.equal(unknownCheapGift.response.status, 200);
    assert.equal(unknownCheapGift.body.data.msgType, "live_gift");
    assert.equal(unknownCheapGift.body.data.giftType, "pistol");

    const platformViewerEnter = await request("/live_data_callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([
        {
          msg_id: "platform-enter-1",
          sec_openid: "platform-openid",
          nickname: "platform-user",
          is_old_player: 0,
          grade_level: "L1",
          enter_room_type: 1,
          inviter_gather_openid: "inviter-openid",
          timestamp: Date.now()
        }
      ])
    });
    assert.equal(platformViewerEnter.response.status, 200);
    assert.equal(platformViewerEnter.body.data.msgType, "live_user_enter");

    const explicitEnterLeave = await request("/live_data_callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        msg_type: "live_user_enter_leave",
        msg_id: "platform-enter-leave-1",
        sec_openid: "platform-openid",
        nickname: "platform-user",
        enter_room_type: 1,
        timestamp: Date.now()
      })
    });
    assert.equal(explicitEnterLeave.response.status, 200);
    assert.equal(explicitEnterLeave.body.data.msgType, "live_user_enter");

    const websocketComment = await request("/websocket_callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-room-id": "room-websocket",
        "x-tt-appid": APP_ID
      },
      body: JSON.stringify({
        msg_type: "live_comment",
        msg_id: "websocket-comment-1",
        content: "join"
      })
    });
    assert.equal(websocketComment.response.status, 200);
    assert.equal(websocketComment.body.data.msgType, "live_comment");
    assert.equal(websocketComment.body.data.callbackPath, "/websocket_callback");
    assert.equal(websocketComment.body.data.roomId, "room-websocket");

    const state = await request("/api/live/state");
    assert.equal(state.body.data.counters.live_comment, 2);
    assert.equal(state.body.data.counters.live_gift, 13);
    assert.equal(state.body.data.counters.live_user_enter, 2);
    assert.equal(state.body.data.counters.unknown, 0);

    const events = await request("/api/live/events?after=0");
    assert.equal(events.response.status, 200);
    assert.ok(events.body.data.latestSeq >= 17);
    assert.deepEqual(
      events.body.data.events.map(event => event.msgType),
      [
        "live_comment",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_gift",
        "live_user_enter",
        "live_user_enter",
        "live_comment"
      ]
    );

    console.log("smoke test passed");
  } finally {
    child.kill();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
