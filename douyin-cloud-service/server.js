"use strict";

const http = require("http");

const PORT = Number(process.env.PORT || 8000);
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 1024 * 1024);
const LIVE_TASK_START_URL =
  process.env.LIVE_TASK_START_URL ||
  "http://webcast-bytedance-com.openapi.dyc.ivolces.com/api/live_data/task/start";
const DEFAULT_APP_ID = process.env.DOUYIN_APP_ID || "tt02d6746b9cb2fc0e10";

const LIVE_MSG_TYPES = ["live_like", "live_comment", "live_gift", "live_fansclub", "live_user_enter_leave"];
const KNOWN_CALLBACK_TYPES = [
  ...LIVE_MSG_TYPES,
  "live_user_enter",
  "live_user_leave",
  "live_user_enter_leave"
];
const recentStarts = [];
const recentCallbacks = [];
const startedTaskKeyObj = {};
let latestEventSeq = 0;
const latestState = {
  startedAt: null,
  roomId: "",
  appId: "",
  anchorOpenId: "",
  lastEventAt: null,
  counters: {
    live_like: 0,
    live_comment: 0,
    live_gift: 0,
    live_fansclub: 0,
    live_user_enter: 0,
    live_user_leave: 0,
    live_user_enter_leave: 0,
    unknown: 0
  }
};

function pushLimited(list, item, limit = 50) {
  list.unshift(item);
  if (list.length > limit) list.length = limit;
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-tt-appid,x-appid,x-room-id,x-roomid,x-tt-roomid,x-tt-room-id,x-anchor-openid,x-tt-source"
  });
  res.end(payload);
}

function sendNoContent(res) {
  res.writeHead(204, {
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-tt-appid,x-appid,x-room-id,x-roomid,x-tt-roomid,x-tt-room-id,x-anchor-openid,x-tt-source"
  });
  res.end();
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("request body too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(Object.assign(new Error("invalid json body"), { statusCode: 400, raw }));
      }
    });

    req.on("error", reject);
  });
}

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value || "";
}

function pickFirst(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).length > 0) || "";
}

function pickObject(...values) {
  return values.find(value => value && typeof value === "object" && !Array.isArray(value)) || {};
}

function getPrimaryPayload(body) {
  if (Array.isArray(body)) {
    return body.find(value => value && typeof value === "object" && !Array.isArray(value)) || {};
  }
  return body && typeof body === "object" ? body : {};
}

function getRequestContext(req, body = {}) {
  const payload = getPrimaryPayload(body);
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const appId = pickFirst(
    getHeader(req, "x-tt-appid"),
    getHeader(req, "x-appid"),
    payload.appid,
    payload.appId,
    payload.app_id,
    data.appid,
    data.appId,
    data.app_id,
    DEFAULT_APP_ID
  );
  const roomId = pickFirst(
    getHeader(req, "x-room-id"),
    getHeader(req, "x-roomid"),
    getHeader(req, "x-tt-roomid"),
    getHeader(req, "x-tt-room-id"),
    payload.roomid,
    payload.room_id,
    payload.roomId,
    data.roomid,
    data.room_id,
    data.roomId
  );
  const anchorOpenId = pickFirst(
    getHeader(req, "x-anchor-openid"),
    payload.anchor_open_id,
    payload.anchorOpenId,
    data.anchor_open_id,
    data.anchorOpenId
  );
  return {
    appId,
    roomId,
    anchorOpenId,
    source: getHeader(req, "x-tt-source"),
    headers: {
      appId: getHeader(req, "x-tt-appid"),
      appIdAlt: getHeader(req, "x-appid"),
      roomId: getHeader(req, "x-room-id"),
      roomIdAlt: getHeader(req, "x-roomid"),
      ttRoomId: getHeader(req, "x-tt-roomid"),
      ttRoomIdAlt: getHeader(req, "x-tt-room-id"),
      anchorOpenId: getHeader(req, "x-anchor-openid"),
      source: getHeader(req, "x-tt-source")
    }
  };
}

function hasAnyField(sources, keys) {
  return sources.some(source =>
    keys.some(key => Object.prototype.hasOwnProperty.call(source, key) && pickFirst(source[key]))
  );
}

function mapEventType(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[-\s]/g, "_");
  if (!normalized) return "";
  if (KNOWN_CALLBACK_TYPES.includes(normalized)) return normalized;
  if (["gift", "gift_data", "live_gift_data", "send_gift"].includes(normalized)) return "live_gift";
  if (["comment", "comment_data", "live_comment_data", "chat"].includes(normalized)) return "live_comment";
  if (["like", "like_data", "live_like_data", "digg"].includes(normalized)) return "live_like";
  if (["fansclub", "fans_club", "fanclub", "fan_club", "live_fans_club"].includes(normalized)) {
    return "live_fansclub";
  }
  if (["enter", "enter_room", "room_enter", "user_enter", "audience_enter"].includes(normalized)) {
    return "live_user_enter";
  }
  if (["leave", "leave_room", "room_leave", "user_leave", "audience_leave"].includes(normalized)) {
    return "live_user_leave";
  }
  return value;
}

function normalizeEventType(body, data, gift) {
  const explicit = mapEventType(
    pickFirst(body.msg_type, body.msgType, body.event, body.type, body.message_type, data.msg_type, data.msgType)
  );

  const sources = [body, data, gift].filter(source => source && typeof source === "object");
  const enterRoomType = Number(pickFirst(body.enter_room_type, data.enter_room_type) || 0);
  if (explicit === "live_user_enter_leave") {
    if (enterRoomType === 1) return "live_user_enter";
    if (enterRoomType === 2) return "live_user_leave";
  }
  if (explicit) return explicit;

  if (enterRoomType === 1) return "live_user_enter";
  if (enterRoomType === 2) return "live_user_leave";

  if (
    hasAnyField(sources, [
      "sec_gift_id",
      "gift_id",
      "giftId",
      "gift_name",
      "giftName",
      "gift_num",
      "gift_count",
      "gift_value",
      "sec_magic_gift_id"
    ])
  ) {
    return "live_gift";
  }
  if (hasAnyField(sources, ["comment", "content", "text", "msg_content", "comment_content"])) {
    return "live_comment";
  }
  if (hasAnyField(sources, ["like_count", "like_num", "digg_count", "total_like_count"])) {
    return "live_like";
  }
  if (hasAnyField(sources, ["fansclub_level", "fans_club_level", "fanclub_level", "club_level", "fansclub_action"])) {
    return "live_fansclub";
  }
  if (
    hasAnyField(sources, [
      "enter_type",
      "leave_type",
      "enter_room",
      "leave_room",
      "enter_room_type",
      "is_old_player",
      "grade_level",
      "inviter_gather_openid"
    ])
  ) {
    return "live_user_enter_leave";
  }
  return "unknown";
}

const PLATFORM_GIFT_ID_TO_SOLDIER_TYPE = new Map([
  ["n1/Dg1905sj1FyoBlQBvmbaDZFBNaKuKZH6zxHkv8Lg5x2cRfrKUTb8gzMs=", "pistol"],
  ["eplFUy7i0B0fiv0Iym1MpOZa5XmUE8g/WUAyJ6Tc+UJJDpcs7pzclNOz/WM=", "shotgun"],
  ["4I66OIE1HKWfM7PNvAHtAgYUSNlggSEgcpo3ai8GYQXAWqjrDuH8NtjsWEQ=", "machine"],
  ["gs+95ujNzXXSCtLTv97fWgbApTQi0sqz1BULB+7w62g+v4sFxINvxOIrXCw=", "giant"],
  ["28rYzVFNyXEXFC8HI+f/WG+I7a6lfl3OyZZjUS+CVuwCgYZrPrUdytGHu0c=", "shotgun"],
  ["IkkadLfz7O/a5UR45p/OOCCG6ewAWVbsuzR/Z+v1v76CBU+mTG/wPjqdpfg=", "machine"],
  ["lsEGaeC++k/yZbzTU2ST64EukfpPENQmqEZxaK9v1+7etK+qnCRKOnDyjsE=", "giant"]
]);

const PLATFORM_MAGIC_GIFT_ID_TO_SOLDIER_TYPE = new Map([
  // Observed from the real-room gift payload; keep magic gift ids first so
  // low-price colored fairy-stick variants can override the base gift id.
  ["9tPFzcpEQFovisU3j3coz5tqj/qQ5LHJQJWob/X5bLbxm1s7kYLj0aGSb4k=", "shotgun"]
]);

function mapGiftSoldierType(giftName, giftId, giftValue, magicGiftId) {
  const knownMagicGiftType = PLATFORM_MAGIC_GIFT_ID_TO_SOLDIER_TYPE.get(String(magicGiftId || ""));
  if (knownMagicGiftType) return knownMagicGiftType;

  const knownGiftType = PLATFORM_GIFT_ID_TO_SOLDIER_TYPE.get(String(giftId || ""));
  if (knownGiftType) return knownGiftType;

  const key = `${giftName || ""} ${giftId || ""} ${magicGiftId || ""}`.toLowerCase();
  const value = Number(giftValue || 0);

  if (key.includes("fairy") || key.includes("stick") || key.includes("sparkler") || key.includes("xiannv")) {
    if (
      key.includes("blue") ||
      key.includes("cyan") ||
      key.includes("green") ||
      key.includes("teal") ||
      key.includes("\u84dd") ||
      key.includes("\u9752") ||
      key.includes("\u7eff")
    ) {
      return "shotgun";
    }
    if (
      key.includes("purple") ||
      key.includes("violet") ||
      key.includes("\u7d2b")
    ) {
      return "machine";
    }
    if (
      key.includes("gold") ||
      key.includes("yellow") ||
      key.includes("orange") ||
      key.includes("\u91d1") ||
      key.includes("\u9ec4") ||
      key.includes("\u6a59")
    ) {
      return "giant";
    }
    return "pistol";
  }

  if (key.includes("shotgun") || key.includes("short") || key.includes("能力药丸")) return "shotgun";
  if (key.includes("machine") || key.includes("heavy") || key.includes("能量电池")) return "machine";
  if (
    key.includes("giant") ||
    key.includes("超级空投") ||
    key.includes("神秘空投") ||
    key.includes("超能喷射") ||
    key.includes("稀有宝箱")
  ) {
    return "giant";
  }
  if (key.includes("pistol") || key.includes("仙女棒")) return "pistol";

  if (value === 10) return "pistol";
  if (value === 99) return "machine";
  if ([520, 888, 1200, 3000].includes(value)) return "giant";
  return "pistol";
}

function normalizeCallback(body) {
  const payload = getPrimaryPayload(body);
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const user = pickObject(payload.user_info, payload.userInfo, payload.user, data.user_info, data.userInfo, data.user);
  const gift = pickObject(payload.gift_info, payload.giftInfo, payload.gift, data.gift_info, data.giftInfo, data.gift);
  const msgType = normalizeEventType(payload, data, gift);
  const giftId = pickFirst(
    payload.sec_gift_id,
    payload.gift_id,
    payload.giftId,
    data.sec_gift_id,
    data.gift_id,
    data.giftId,
    gift.sec_gift_id,
    gift.gift_id,
    gift.giftId,
    gift.id
  );
  const giftName = pickFirst(payload.gift_name, payload.giftName, data.gift_name, data.giftName, gift.gift_name, gift.giftName, gift.name, giftId);
  const giftValue = Number(pickFirst(payload.gift_value, payload.giftValue, data.gift_value, data.giftValue, gift.gift_value, gift.giftValue) || 0);
  const magicGiftId = pickFirst(
    payload.sec_magic_gift_id,
    payload.magic_gift_id,
    payload.magicGiftId,
    data.sec_magic_gift_id,
    data.magic_gift_id,
    data.magicGiftId,
    gift.sec_magic_gift_id,
    gift.magic_gift_id,
    gift.magicGiftId
  );
  const avatarUrl = pickFirst(
    payload.avatar_url,
    payload.avatarUrl,
    payload.avatar,
    data.avatar_url,
    data.avatarUrl,
    data.avatar,
    user.avatar_url,
    user.avatarUrl,
    user.avatar
  );

  return {
    msgType,
    msgId: pickFirst(payload.msg_id, payload.msgId, payload.message_id, data.msg_id, data.msgId),
    roomId: pickFirst(payload.roomid, payload.room_id, payload.roomId, data.roomid, data.room_id, data.roomId),
    openId: pickFirst(
      payload.open_id,
      payload.openId,
      payload.user_open_id,
      payload.sec_openid,
      payload.sec_open_id,
      data.open_id,
      data.openId,
      data.sec_openid,
      data.sec_open_id,
      user.open_id,
      user.openId,
      user.user_open_id,
      user.sec_openid
    ),
    nickName: pickFirst(payload.nickname, payload.nickName, payload.user_nickname, data.nickname, data.nickName, user.nickname, user.nickName, user.nick_name),
    avatarUrl,
    giftName,
    giftId,
    magicGiftId,
    giftValue,
    giftType: msgType === "live_gift" ? mapGiftSoldierType(giftName, giftId, giftValue, magicGiftId) : "",
    comment: pickFirst(payload.comment, payload.content, payload.text, payload.msg_content, data.comment, data.content, data.text, data.msg_content),
    enterRoomType: Number(pickFirst(payload.enter_room_type, data.enter_room_type) || 0),
    isOldPlayer: pickFirst(payload.is_old_player, data.is_old_player),
    gradeLevel: pickFirst(payload.grade_level, data.grade_level),
    inviterOpenId: pickFirst(payload.inviter_gather_openid, data.inviter_gather_openid),
    count: Number(
      pickFirst(
        payload.count,
        payload.like_count,
        payload.like_num,
        payload.gift_count,
        payload.gift_num,
        data.count,
        data.like_count,
        data.like_num,
        data.gift_count,
        data.gift_num,
        gift.count,
        gift.gift_count,
        gift.gift_num
      ) || 1
    ),
    raw: body
  };
}

async function startLiveDataTask(appId, roomId, msgType) {
  if (!appId || !roomId) {
    return { msgType, skipped: true, reason: "missing appId or roomId" };
  }

  const response = await fetch(LIVE_TASK_START_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ appid: appId, roomid: roomId, msg_type: msgType })
  });

  const text = await response.text();
  return {
    msgType,
    ok: response.ok,
    status: response.status,
    body: text.slice(0, 1000)
  };
}

async function ensureLiveDataTasks(appId, roomId, reason) {
  appId = appId || DEFAULT_APP_ID;
  if (!roomId) {
    return null;
  }

  const key = `${appId}|${roomId}`;
  if (startedTaskKeyObj[key]) {
    return { appId, roomId, skipped: true, reason: "already_started" };
  }
  startedTaskKeyObj[key] = true;

  const event = {
    at: new Date().toISOString(),
    appId,
    roomId,
    anchorOpenId: "",
    reason,
    taskResults: []
  };
  latestState.startedAt = latestState.startedAt || event.at;
  latestState.appId = latestState.appId || appId;
  latestState.roomId = latestState.roomId || roomId;
  pushLimited(recentStarts, event);

  for (const msgType of LIVE_MSG_TYPES) {
    try {
      event.taskResults.push(await startLiveDataTask(appId, roomId, msgType));
    } catch (error) {
      event.taskResults.push({ msgType, ok: false, error: error.message });
    }
  }
  return event;
}

async function handleStartGame(req, res) {
  const body = await readJsonBody(req);
  const context = getRequestContext(req, body);
  const appId = context.appId;
  const roomId = context.roomId;
  const anchorOpenId = context.anchorOpenId;
  const event = {
    at: new Date().toISOString(),
    appId,
    roomId,
    anchorOpenId,
    headers: {
      appId: getHeader(req, "x-tt-appid"),
      roomId: getHeader(req, "x-room-id"),
      source: getHeader(req, "x-tt-source")
    }
  };

  latestState.startedAt = event.at;
  latestState.appId = appId;
  latestState.roomId = roomId;
  latestState.anchorOpenId = anchorOpenId;
  pushLimited(recentStarts, event);

  const taskResults = [];
  if (appId && roomId) {
    startedTaskKeyObj[`${appId}|${roomId}`] = true;
  }
  for (const msgType of LIVE_MSG_TYPES) {
    try {
      taskResults.push(await startLiveDataTask(appId, roomId, msgType));
    } catch (error) {
      taskResults.push({ msgType, ok: false, error: error.message });
    }
  }

  sendJson(res, 200, {
    code: 0,
    message: "start_game handled",
    data: {
      appId,
      roomId,
      anchorOpenId,
      taskResults
    }
  });
}

async function handleLiveDataCallback(req, res, callbackPath = "/live_data_callback") {
  const body = await readJsonBody(req);
  const context = getRequestContext(req, body);
  const event = normalizeCallback(body);
  event.seq = ++latestEventSeq;
  event.at = new Date().toISOString();
  event.roomId = pickFirst(event.roomId, context.roomId);
  event.appId = context.appId;
  event.anchorOpenId = context.anchorOpenId;
  event.source = context.source;
  event.callbackPath = callbackPath;
  event.headers = context.headers;

  latestState.lastEventAt = event.at;
  latestState.appId = latestState.appId || event.appId || "";
  latestState.roomId = latestState.roomId || event.roomId || "";
  latestState.anchorOpenId = latestState.anchorOpenId || event.anchorOpenId || "";
  if (KNOWN_CALLBACK_TYPES.includes(event.msgType)) {
    latestState.counters[event.msgType] = (latestState.counters[event.msgType] || 0) + 1;
  } else {
    latestState.counters.unknown += 1;
  }
  pushLimited(recentCallbacks, event);
  if (event.roomId) {
    ensureLiveDataTasks(event.appId, event.roomId, `auto:${callbackPath}`).catch(error => {
      pushLimited(recentStarts, {
        at: new Date().toISOString(),
        appId: event.appId,
        roomId: event.roomId,
        reason: `auto:${callbackPath}`,
        error: error.message
      });
    });
  }

  sendJson(res, 200, {
    code: 0,
    message: "live data accepted",
    data: {
      msgType: event.msgType,
      msgId: event.msgId,
      roomId: event.roomId,
      giftId: event.giftId,
      magicGiftId: event.magicGiftId,
      giftType: event.giftType,
      callbackPath,
      seq: event.seq
    }
  });
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/api/health")) {
    sendJson(res, 200, { code: 0, message: "ok", service: "jizhantuwei-live-cloud-service" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/start_game") {
    await handleStartGame(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/finish_game") {
    const body = await readJsonBody(req);
    sendJson(res, 200, { code: 0, message: "finish_game handled", data: body });
    return;
  }

  if (req.method === "POST" && url.pathname === "/live_data_callback") {
    await handleLiveDataCallback(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/websocket_callback") {
    await handleLiveDataCallback(req, res, "/websocket_callback");
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/live/state") {
    sendJson(res, 200, { code: 0, data: latestState });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/live/events") {
    const after = Number(url.searchParams.get("after") || 0);
    const events = recentCallbacks
      .filter(event => Number(event.seq || 0) > after)
      .sort((a, b) => Number(a.seq || 0) - Number(b.seq || 0));
    sendJson(res, 200, { code: 0, data: { latestSeq: latestEventSeq, events } });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/douyin/diagnostics") {
    sendJson(res, 200, { code: 0, data: { latestState, recentStarts, recentCallbacks } });
    return;
  }

  sendJson(res, 404, { code: 404, message: "not found", path: url.pathname });
}

const server = http.createServer((req, res) => {
  route(req, res).catch(error => {
    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
      code: statusCode,
      message: error.message || "internal server error"
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`jizhantuwei-live-cloud-service listening on ${PORT}`);
});
