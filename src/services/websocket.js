import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;

let chatSubscription = null;
let presenceSubscription = null;
let callSubscription = null;

let onConnectedQueue = new Set();

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

  console.log("🔌 Connecting STOMP →", WS_URL);

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: 3000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: (frame) => {
      console.log("✅ STOMP CONNECTED", frame.headers);

      // 🔥 Flush queued actions
      onConnectedQueue.forEach((cb) => cb());
      onConnectedQueue.clear();

      onConnected?.();
    },

    onDisconnect: () => {
      console.warn("❌ STOMP DISCONNECTED");
    },

    onStompError: (frame) => {
      console.error("❌ STOMP ERROR", frame.headers, frame.body);
    },

    onWebSocketError: (err) => {
      console.error("❌ WS ERROR", err);
    },

    onWebSocketClose: (evt) => {
      console.warn("🔌 WS CLOSED", evt.code, evt.reason);
    },
  });

  client.activate();
}

/* ===============================
   ✅ REQUIRED EXPORT (FIX)
   =============================== */
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

    console.log("📡 Subscribing to /topic/chat/" + roomId);

    chatSubscription = client.subscribe(
      `/topic/chat/${roomId}`,
      (msg) => {
        console.log("📨 WS CHAT MESSAGE", msg.body);
        onMessage(JSON.parse(msg.body));
      }
    );
  };

  if (!isStompConnected()) {
    console.warn("⏳ STOMP not ready, queue chat subscribe");
    onConnectedQueue.add(subscribe);
    return;
  }

  subscribe();
}

/* ===============================
   PRESENCE SUBSCRIBE
   =============================== */
export function subscribeToPresence(onPresence) {
  const subscribe = () => {
    presenceSubscription?.unsubscribe();

    console.log("📡 Subscribing to /topic/presence");

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
   SEND MESSAGE (🔥 FIXED)
   =============================== */
export function sendMessage(roomId, payload) {
  const send = () => {
    console.log("📤 WS SEND → /app/chat.send", {
      roomId,
      receiverId: payload.receiverId ?? null,
    });

    client.publish({
      destination: "/app/chat.send",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        chatRoomId: roomId ?? null,
        receiverId: payload.receiverId ?? null,
        cipherText: payload.cipherText,
        iv: payload.iv,
        encryptedAesKeyForSender:
          payload.encryptedAesKeyForSender ?? null,
        encryptedAesKeyForReceiver:
          payload.encryptedAesKeyForReceiver ?? null,
        type: payload.type ?? "TEXT",
      }),
    });
  };

  if (!isStompConnected()) {
    console.warn("⏳ STOMP not connected → queue SEND");
    onConnectedQueue.add(send);
    return;
  }

  send();
}

/* ===============================
   CALL SIGNALING
   =============================== */
export function subscribeToCallSignals(onSignal) {
  const subscribe = () => {
    callSubscription?.unsubscribe();

    console.log("📡 Subscribing to /user/queue/call");

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

  console.log("📤 WS CALL SIGNAL", signal);

  client.publish({
    destination: "/app/call.signal",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(signal),
  });
}

/* ===============================
   DISCONNECT
   =============================== */
export function disconnectWebSocket() {
  console.log("🔌 Disconnecting STOMP");

  chatSubscription?.unsubscribe();
  presenceSubscription?.unsubscribe();
  callSubscription?.unsubscribe();

  chatSubscription = null;
  presenceSubscription = null;
  callSubscription = null;

  onConnectedQueue.clear();

  client?.deactivate();
  client = null;
}
