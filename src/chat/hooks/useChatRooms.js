/* =====================================================
   CHAT ROOMS HOOK – E2EE SAFE (FINAL)
   -----------------------------------------------------
   - REST = source of truth for history
   - WebSocket = real-time updates
   - Supports optimistic UI
   - Reload-safe
   - Prevents duplicates
   - Prevents message loss
   - FIXES: old chat showing on room switch
   ===================================================== */

import { useRef, useState } from "react";
import api from "../../api/api";
import {
  subscribeToChat,
  sendMessage,
  isStompConnected,
} from "../../services/websocket";
import { markMessageAsRead } from "../../api/messageApi";

/* =====================================================
   🔧 MESSAGE NORMALIZER
   ===================================================== */
function normalizeMessage(m) {
  return {
    id: m.id,
    chatRoomId: m.chatRoomId ?? m.chatRoom?.id,

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

  // 🔥 Track currently subscribed room (prevents duplicate WS subs)
  const subscribedRoomRef = useRef(null);

  /* =====================================================
     🔄 LOAD CHAT HISTORY (REST = SOURCE OF TRUTH)
     ===================================================== */
  const loadChatHistory = async (roomId) => {
    try {
      const res = await api.get(`/message/chat/${roomId}`);
      const normalized = res.data.map(normalizeMessage);

      setMessages((prev) => {
        const map = new Map();

        // keep WS messages if they arrived early
        prev.forEach((m) => map.set(m.id, m));
        normalized.forEach((m) => map.set(m.id, m));

        return Array.from(map.values()).sort(
          (a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );
      });

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

  /* =====================================================
     📡 SUBSCRIBE TO CHAT ROOM (SAFE + FIXED)
     ===================================================== */
  const subscribeRoom = async (roomId) => {
    if (!roomId) return;

    // 🛑 Prevent duplicate subscription
    if (subscribedRoomRef.current === roomId) return;

    // 🔥 Clear messages immediately when switching rooms
    setMessages([]);

    subscribedRoomRef.current = roomId;
    setActiveRoomId(roomId);

    // 🔄 Load history FIRST
    await loadChatHistory(roomId);

    // 📡 Subscribe to WebSocket
    subscribeToChat(roomId, (msg) => {
      const normalized = normalizeMessage(msg);

      setMessages((prev) => {
        // Remove matching optimistic temp message
        const filtered = prev.filter(
          (m) =>
            !(
              String(m.id).startsWith("temp-") &&
              Number(m.sender.id) ===
                Number(normalized.sender.id) &&
              new Date(m.timestamp) <=
                new Date(normalized.timestamp)
            )
        );

        // Prevent duplicates
        if (filtered.some((m) => m.id === normalized.id)) {
          return filtered;
        }

        return [...filtered, normalized];
      });

      // ✅ Mark as read
      if (
        Number(normalized.sender.id) !==
        Number(auth.userId)
      ) {
        markMessageAsRead(normalized.id).catch(() => {});
      }
    });
  };

  /* =====================================================
     ✉️ SEND MESSAGE (E2EE + OPTIMISTIC UI)
     ===================================================== */
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

    // 🔥 Optimistic UI
    setMessages((prev) => [...prev, tempMessage]);

    // 🔥 Send to server
    sendMessage(activeRoomId, payload);
  };

  return {
    messages,
    activeRoomId,
    setActiveRoomId,
    subscribeRoom,
    send,
  };
}
