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
  if (client?.active || client?.connected) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  client = new Client({
    webSocketFactory: () =>
      new SockJS(WS_URL, null, {
        transports: ["websocket", "xhr-streaming", "xhr-polling"],
      }),

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      onConnectedQueue.forEach((cb) => cb());
      onConnectedQueue.clear();
      onConnected?.();
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
      (msg) => onMessage(JSON.parse(msg.body))
    );
  };

  if (!isStompConnected()) {
    onConnectedQueue.add(subscribe);
    return;
  }

  subscribe();
}

/* ===============================
   ✅ PRESENCE SUBSCRIBE (MISSING FIX)
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
   SEND MESSAGE
   =============================== */
export function sendMessage(roomId, payload) {
  if (!isStompConnected()) return;

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
