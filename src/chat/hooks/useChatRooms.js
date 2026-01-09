/* =====================================================
   CHAT ROOMS HOOK – E2EE SAFE (FINAL, CORRECTED)
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
  const loadChatHistory = async (chatRoomId) => {
    try {
      const res = await api.get(`/message/chat/${chatRoomId}`);
      const normalized = res.data.map(normalizeMessage);

      setMessages(normalized);

      // ✅ Mark messages as read
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
  const subscribeRoom = async (chatRoomId) => {
    if (!chatRoomId) return;

    // 🛑 Avoid re-subscribing same room
    if (subscribedRoomRef.current === chatRoomId) return;

    subscribedRoomRef.current = chatRoomId;
    setActiveRoomId(chatRoomId);
    setMessages([]);

    // 🔄 Load REST history first
    await loadChatHistory(chatRoomId);

    // 📡 WebSocket subscribe
    subscribeToChat(chatRoomId, (msg) => {
      const normalized = normalizeMessage(msg);

      // 🛑 Hard room isolation
      if (normalized.chatRoomId !== chatRoomId) return;

      setMessages((prev) => {
        // Remove optimistic temp message from same sender
        const filtered = prev.filter(
          (m) =>
            !(
              String(m.id).startsWith("temp-") &&
              Number(m.sender.id) === Number(normalized.sender.id)
            )
        );

        // Prevent duplicates
        if (filtered.some((m) => m.id === normalized.id)) {
          return filtered;
        }

        return [...filtered, normalized];
      });

      // ✅ Mark read
      if (Number(normalized.sender.id) !== Number(auth.userId)) {
        markMessageAsRead(normalized.id).catch(() => {});
      }
    });
  };

  /* ===============================
     ✉️ SEND MESSAGE (🔥 FIXED)
     =============================== */
  const send = (payload) => {
    if (!payload) return;
    if (!isStompConnected()) return;

    /**
     * 🔥 CRITICAL FIX
     * First private message has:
     *   - activeRoomId === null
     *   - payload.receiverId EXISTS
     * Backend will create the room.
     */
    const roomIdToSend =
      payload.chatRoomId ?? activeRoomId ?? null;

    /* ===============================
       🔮 Optimistic UI (ONLY when room exists)
       =============================== */
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

    // 📡 SEND TO BACKEND (receiverId PRESERVED)
    sendMessage(roomIdToSend, payload);
  };

  return {
    messages,
    activeRoomId,
    subscribeRoom,
    send,
  };
}
