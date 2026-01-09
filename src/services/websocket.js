import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;

let chatSubscription = null;
let presenceSubscription = null;
let callSubscription = null;

let onConnectedQueue = new Set();

// ✅ Correct because you set server.servlet.context-path=/api
const WS_URL = "https://chat-backend-fup5.onrender.com/api/ws";

/* ===============================
   CONNECT WEBSOCKET
   =============================== */
export function connectWebSocket(onConnected) {
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
    // 🔥 Render + SockJS compatible
    webSocketFactory: () =>
      new SockJS(WS_URL, null, {
        transports: ["websocket", "xhr-streaming", "xhr-polling"],
      }),

    // ✅ JWT for CONNECT frame
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 0,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      console.log("✅ STOMP CONNECTED");

      // Flush queued subscriptions
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
   CHAT SUBSCRIBE
   =============================== */
export function subscribeToChat(roomId, onMessage) {
  if (!roomId) return;

  const subscribe = () => {
    chatSubscription?.unsubscribe();

    chatSubscription = client.subscribe(
      `/topic/chat/${roomId}`,
      (msg) => {
        const parsed = JSON.parse(msg.body);
        console.log("📨 CHAT:", parsed);
        onMessage(parsed);
      }
    );
  };

  if (!isStompConnected()) {
    onConnectedQueue.add(subscribe);
    return;
  }

  subscribe();
}

/* ===============================
   SEND MESSAGE  ✅ FIXED
   =============================== */
export function sendMessage(roomId, payload) {
  if (!isStompConnected()) {
    console.warn("⚠️ STOMP not connected");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ JWT missing for SEND");
    return;
  }

  console.log("📤 SENDING MESSAGE", {
    roomId,
    payload,
  });

  client.publish({
    destination: "/app/chat.send",

    // 🔥 REQUIRED: JWT on SEND frame
    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      chatRoomId: roomId,
      cipherText: payload.cipherText,
      iv: payload.iv,
      encryptedAesKeyForSender: payload.encryptedAesKeyForSender ?? null,
      encryptedAesKeyForReceiver: payload.encryptedAesKeyForReceiver ?? null,
      type: payload.type ?? "TEXT",
    }),
  });
}

/* ===============================
   CALL SIGNALING
   =============================== */
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
  if (!isStompConnected()) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  client.publish({
    destination: "/app/call.signal",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(signal),
  });
}

/* ===============================
   DISCONNECT
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
