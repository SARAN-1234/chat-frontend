/* =====================================================
   CHAT ROOMS HOOK – E2EE SAFE (FINAL – PRODUCTION)
   ===================================================== */

import { useRef, useState } from "react";
import api from "../../api/api";
import {
  subscribeToChat,
  sendMessage,
  isStompConnected,
} from "../../services/websocket";
import { markMessageAsRead } from "../../api/messageApi";

/* ===============================
   🔧 MESSAGE NORMALIZER
   =============================== */
function normalizeMessage(m) {
  return {
    id: m.id,
    chatRoomId: m.chatRoomId,

    cipherText: m.cipherText ?? null,
    iv: m.iv ?? null,

    encryptedAesKeyForSender:
      m.encryptedAesKeyForSender ?? null,
    encryptedAesKeyForReceiver:
      m.encryptedAesKeyForReceiver ?? null,

    sender: m.sender ?? {
      id: m.senderId,
      username: m.senderUsername,
    },

    type: m.type ?? "TEXT",
    status: m.status ?? "SENT",
    timestamp: m.timestamp,
  };
}

export default function useChatRooms(auth) {
  const [messages, setMessages] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);

  // 🔥 Prevent duplicate subscriptions
  const subscribedRoomRef = useRef(null);

  /* ===============================
     🔄 LOAD CHAT HISTORY (REST)
     =============================== */
  const loadChatHistory = async (roomId) => {
    try {
      const res = await api.get(`/message/chat/${roomId}`);
      const normalized = res.data.map(normalizeMessage);
      setMessages(normalized);

      normalized.forEach((msg) => {
        if (Number(msg.sender.id) !== Number(auth.userId)) {
          markMessageAsRead(msg.id).catch(() => {});
        }
      });
    } catch (err) {
      console.error("❌ Failed to load chat history", err);
    }
  };

  /* ===============================
     📡 SUBSCRIBE TO ROOM (WS)
     =============================== */
  const subscribeRoom = async (roomId) => {
    if (!roomId) return;

    if (subscribedRoomRef.current === roomId) return;

    subscribedRoomRef.current = roomId;
    setActiveRoomId(roomId);
    setMessages([]);

    await loadChatHistory(roomId);

    subscribeToChat(roomId, (msg) => {
      const normalized = normalizeMessage(msg);

      /* 🔥 ADOPT ROOM ID AFTER FIRST MESSAGE */
      if (!activeRoomId && normalized.chatRoomId) {
        setActiveRoomId(normalized.chatRoomId);
        subscribedRoomRef.current = normalized.chatRoomId;
      }

      if (normalized.chatRoomId !== roomId) return;

      setMessages((prev) => {
        const filtered = prev.filter(
          (m) =>
            !(
              String(m.id).startsWith("temp-") &&
              Number(m.sender.id) === Number(normalized.sender.id)
            )
        );

        if (filtered.some((m) => m.id === normalized.id)) {
          return filtered;
        }

        return [...filtered, normalized];
      });

      if (Number(normalized.sender.id) !== Number(auth.userId)) {
        markMessageAsRead(normalized.id).catch(() => {});
      }
    });
  };

  /* ===============================
     ✉️ SEND MESSAGE (FINAL FIX)
     =============================== */
  const send = (payload) => {
    if (!payload) return;
    if (!isStompConnected()) return;

    // 🔥 Allow FIRST private message
    const roomIdToSend =
      payload.chatRoomId ?? activeRoomId ?? null;

    /* 🔮 Optimistic UI ONLY for existing rooms */
    if (activeRoomId) {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        chatRoomId: activeRoomId,

        cipherText: payload.cipherText,
        iv: payload.iv,

        encryptedAesKeyForSender:
          payload.encryptedAesKeyForSender ?? null,
        encryptedAesKeyForReceiver:
          payload.encryptedAesKeyForReceiver ?? null,

        sender: {
          id: auth.userId,
          username: auth.username,
        },

        type: payload.type ?? "TEXT",
        status: "SENT",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);
    }

    // 📡 SEND TO BACKEND
    sendMessage(roomIdToSend, payload);
  };

  return {
    messages,
    activeRoomId,
    subscribeRoom,
    send,
  };
}
