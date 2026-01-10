import { useRef, useState } from "react";
import api from "../../api/api";
import {
  subscribeToChat,
  sendMessage,
  isStompConnected,
} from "../../services/websocket";
import { markMessageAsRead } from "../../api/messageApi";

function normalizeMessage(m) {
  return {
    id: m.id,
    chatRoomId: m.chatRoomId,
    cipherText: m.cipherText ?? null,
    iv: m.iv ?? null,
    encryptedAesKeyForSender: m.encryptedAesKeyForSender ?? null,
    encryptedAesKeyForReceiver: m.encryptedAesKeyForReceiver ?? null,
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

  const activeRoomRef = useRef(null);
  const subscribedRoomRef = useRef(null);

  const loadChatHistory = async (roomId) => {
    const res = await api.get(`/message/chat/${roomId}`);
    const normalized = res.data.map(normalizeMessage);
    setMessages(normalized);

    normalized.forEach((msg) => {
      if (Number(msg.sender.id) !== Number(auth.userId)) {
        markMessageAsRead(msg.id).catch(() => {});
      }
    });
  };

  const subscribeRoom = async (roomId) => {
    if (!roomId) return;
    if (subscribedRoomRef.current === roomId) return;

    subscribedRoomRef.current = roomId;
    activeRoomRef.current = roomId;
    setActiveRoomId(roomId);
    setMessages([]);

    await loadChatHistory(roomId);

    subscribeToChat(roomId, (msg) => {
      const normalized = normalizeMessage(msg);

      // ✅ Adopt room after first private message
      if (!activeRoomRef.current && normalized.chatRoomId) {
        activeRoomRef.current = normalized.chatRoomId;
        subscribedRoomRef.current = normalized.chatRoomId;
        setActiveRoomId(normalized.chatRoomId);
      }

      if (
        activeRoomRef.current &&
        normalized.chatRoomId !== activeRoomRef.current
      ) {
        return;
      }

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

  const send = (payload) => {
    if (!payload) return;
    if (!isStompConnected()) return;

    const roomIdToSend =
      payload.chatRoomId ?? activeRoomRef.current ?? null;

    if (activeRoomRef.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          chatRoomId: activeRoomRef.current,
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
        },
      ]);
    }

    sendMessage(roomIdToSend, payload);
  };

  return { messages, activeRoomId, subscribeRoom, send };
}
