import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;

let chatSubscription = null;
let presenceSubscription = null;
let callSubscription = null;

let onConnectedQueue = new Set();

const WS_URL = "https://chat-backend-fup5.onrender.com/api/ws";

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
    // 🔥 RENDER FIX: SockJS REQUIRED
    webSocketFactory: () =>
      new SockJS(WS_URL, null, {
        transports: ["websocket", "xhr-streaming", "xhr-polling"],
      }),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 0,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      console.log("✅ STOMP CONNECTED");

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
   SEND MESSAGE
   =============================== */
export function sendMessage(roomId, payload) {
  if (!isStompConnected()) {
    console.warn("⚠️ STOMP not connected");
    return;
  }

  console.log("📤 SENDING MESSAGE", payload);

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

  client.publish({
    destination: "/app/call.signal",
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
