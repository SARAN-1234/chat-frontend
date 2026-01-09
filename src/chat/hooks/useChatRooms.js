/* =====================================================
   CHAT ROOMS HOOK – E2EE SAFE (FINAL + HARDENED)
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

    // 🔥 ONLY STRING roomId – NO FALLBACK
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

  // 🔥 Track subscribed room
  const subscribedRoomRef = useRef(null);

  /* ===============================
     🔄 LOAD CHAT HISTORY (REST)
     =============================== */
  const loadChatHistory = async (chatRoomId) => {
    try {
      const res = await api.get(`/message/chat/${chatRoomId}`);
      const normalized = res.data.map(normalizeMessage);

      setMessages((prev) => {
        const map = new Map();
        prev.forEach((m) => map.set(m.id, m));
        normalized.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      });

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
     📡 SUBSCRIBE TO ROOM
     =============================== */
  const subscribeRoom = async (chatRoomId) => {
    if (!chatRoomId) return;
    if (subscribedRoomRef.current === chatRoomId) return;

    subscribedRoomRef.current = chatRoomId;
    setActiveRoomId(chatRoomId);
    setMessages([]);

    await loadChatHistory(chatRoomId);

    subscribeToChat(chatRoomId, (msg) => {
      const normalized = normalizeMessage(msg);

      if (normalized.chatRoomId !== chatRoomId) return;

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
     ✉️ SEND MESSAGE (🔥 FIXED)
     =============================== */
  const send = (payload) => {
    if (!activeRoomId || !payload) return;
    if (!isStompConnected()) return;

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

    // 🔥🔥🔥 THIS IS THE FIX 🔥🔥🔥
    sendMessage(
      activeRoomId,
      payload,
      payload.receiverId ?? null
    );
  };

  return {
    messages,
    activeRoomId,
    subscribeRoom,
    send,
  };
}
