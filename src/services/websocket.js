/* =====================================================
   WEBSOCKET SERVICE – STOMP (FINAL, FIXED)
   -----------------------------------------------------
   ✅ Single STOMP client instance
   ✅ No duplicate subscriptions
   ✅ No onConnect queue explosion
   ✅ No backend REST loops
   ✅ E2EE safe
   ===================================================== */

import { Client } from "@stomp/stompjs";

let client = null;

// 🔹 ACTIVE SUBSCRIPTIONS
let chatSubscription = null;
let presenceSubscription = null;
let callSubscription = null;

// 🔥 FIX: Use Set instead of Array (NO duplicates)
let onConnectedQueue = new Set();

/* ===============================
   🔌 CONNECT
   =============================== */
export function connectWebSocket(onConnected) {
  // ❌ Prevent duplicate clients
  if (client?.active || client?.connected) {
    console.warn("⚠️ STOMP already active");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ JWT missing");
    return;
  }

  client = new Client({
    brokerURL: "ws://localhost:8080/api/ws",

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 0, // manual reconnect only
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      console.log("✅ STOMP CONNECTED");

      // 🔥 Flush queued callbacks ONCE
      onConnectedQueue.forEach((cb) => cb());
      onConnectedQueue.clear();

      onConnected?.();
    },

    onDisconnect: () => {
      console.warn("❌ STOMP DISCONNECTED");
    },

    onStompError: (err) => {
      console.error("❌ STOMP ERROR", err);
    },
  });

  client.activate();
}

export function isStompConnected() {
  return client?.connected === true;
}

/* ===============================
   💬 CHAT SUBSCRIBE (SAFE)
   =============================== */
export function subscribeToChat(roomId, onMessage) {
  if (!roomId) return;

  const subscribe = () => {
    chatSubscription?.unsubscribe();

    chatSubscription = client.subscribe(
      `/topic/chat/${roomId}`,
      (msg) => {
        const parsed = JSON.parse(msg.body);
        console.log("📨 WS CHAT MESSAGE:", parsed);
        onMessage(parsed);
      }
    );
  };

  if (!isStompConnected()) {
    onConnectedQueue.add(subscribe); // 🔥 NO duplicates
    return;
  }

  subscribe();
}

/* ===============================
   🟢 PRESENCE SUBSCRIBE
   =============================== */
export function subscribeToPresence(onPresence) {
  const subscribe = () => {
    presenceSubscription?.unsubscribe();

    presenceSubscription = client.subscribe(
      "/topic/presence",
      (msg) => onPresence(JSON.parse(msg.body))
    );
  };

  if (!isStompConnected()) {
    onConnectedQueue.add(subscribe);
    return;
  }

  subscribe();
}

/* ===============================
   ✉️ SEND CHAT MESSAGE (E2EE)
   =============================== */
export function sendMessage(roomId, payload) {
  if (!isStompConnected()) {
    console.warn("⚠️ Cannot send, STOMP not connected");
    return;
  }

  if (
    !payload ||
    !payload.cipherText ||
    !payload.iv ||
    !payload.encryptedAesKeyForSender ||
    !payload.encryptedAesKeyForReceiver
  ) {
    throw new Error("Invalid encrypted payload");
  }

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify({
      chatRoomId: roomId,
      cipherText: payload.cipherText,
      iv: payload.iv,
      encryptedAesKeyForSender: payload.encryptedAesKeyForSender,
      encryptedAesKeyForReceiver: payload.encryptedAesKeyForReceiver,
    }),
  });
}

/* =====================================================
   📞 CALL SIGNALING
   ===================================================== */
export function subscribeToCallSignals(onSignal) {
  const subscribe = () => {
    callSubscription?.unsubscribe();

    callSubscription = client.subscribe(
      "/user/queue/call",
      (msg) => onSignal(JSON.parse(msg.body))
    );
  };

  if (!isStompConnected()) {
    onConnectedQueue.add(subscribe);
    return;
  }

  subscribe();
}

export function sendCallSignal(signal) {
  if (!isStompConnected()) {
    console.warn("⚠️ Cannot send call signal, STOMP not connected");
    return;
  }

  client.publish({
    destination: "/app/call.signal",
    body: JSON.stringify(signal),
  });
}

/* ===============================
   ❌ DISCONNECT (CLEAN)
   =============================== */
export function disconnectWebSocket() {
  chatSubscription?.unsubscribe();
  presenceSubscription?.unsubscribe();
  callSubscription?.unsubscribe();

  chatSubscription = null;
  presenceSubscription = null;
  callSubscription = null;

  onConnectedQueue.clear();

  client?.deactivate();
  client = null;

  console.log("🔌 STOMP fully disconnected");
}
