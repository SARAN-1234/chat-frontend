/* =====================================================
   CHAT WINDOW – E2EE SAFE (FINAL – CORRECT)
   ===================================================== */

import { useEffect, useRef, useContext, useState } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import AuthContext from "../context/AuthContext";

/* ===============================
   PRIVATE CHAT CRYPTO
   =============================== */
import {
  importPrivateKey,
  decryptAESKey,
  decryptWithAES,
} from "./group/utils/crypto";

/* ===============================
   GROUP CHAT CRYPTO
   =============================== */
import {
  getGroupAESKey,
  decryptGroupMessage,
} from "./group/utils/groupKeyStore";

import { getUserPublicKey } from "../api/userApi";

/* ===============================
   MESSAGE NORMALIZER
   =============================== */
function normalizeMessage(m) {
  return {
    ...m,
    sender: m.sender ?? {
      id: m.senderId,
      username: m.senderUsername,
    },
    encryptedAesKeyForSender:
      m.encryptedAesKeyForSender ?? null,
    encryptedAesKeyForReceiver:
      m.encryptedAesKeyForReceiver ?? null,
  };
}

const ChatWindow = ({
  messages,
  selectedUser,
  presence,
  onSend,
  onStartCall,
  onToggleAi,
  onToggleGroupInfo,
}) => {
  const messagesEndRef = useRef(null);
  const lastSignatureRef = useRef("");

  const { auth } = useContext(AuthContext);
  const myUserId = auth?.userId;

  const isGroup = selectedUser?.type === "GROUP";

  const [viewMessages, setViewMessages] = useState([]);
  const [receiverPublicKey, setReceiverPublicKey] = useState(null);
  const [loadingKey, setLoadingKey] = useState(false);

  /* ===============================
     🔑 FETCH RECEIVER PUBLIC KEY (PRIVATE)
     =============================== */
  useEffect(() => {
    if (!selectedUser || selectedUser.type !== "PRIVATE") {
      setReceiverPublicKey(null);
      return;
    }

    let cancelled = false;
    setLoadingKey(true);

    // 🔥 MUST USE userId (receiver user)
    getUserPublicKey(selectedUser.userId)
      .then((res) => {
        if (!cancelled) {
          setReceiverPublicKey(res.data?.publicKey || null);
        }
      })
      .catch(() => {
        if (!cancelled) setReceiverPublicKey(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingKey(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUser?.userId, selectedUser?.type]);

  /* ===============================
     🔓 DECRYPT MESSAGES
     =============================== */
  useEffect(() => {
    const prepareMessages = async () => {
      if (!messages || messages.length === 0) {
        lastSignatureRef.current = "";
        setViewMessages([]);
        return;
      }

      const signature = messages
        .filter((m) => !String(m.id).startsWith("temp-"))
        .map((m) => `${m.id}:${m.timestamp}`)
        .join("|");

      if (signature === lastSignatureRef.current) return;
      lastSignatureRef.current = signature;

      const privateKeyBase64 = localStorage.getItem("privateKey");

      if (!privateKeyBase64) {
        setViewMessages(
          messages.map((m) => ({
            ...m,
            content: "🔒 Encrypted message",
          }))
        );
        return;
      }

      const privateKey = await importPrivateKey(privateKeyBase64);

      const decrypted = await Promise.all(
        messages.map(async (raw) => {
          const m = normalizeMessage(raw);

          if (!m.cipherText || !m.iv) {
            return { ...m, content: "🕓 Old message" };
          }

          /* ===============================
             🔐 GROUP MESSAGE
             =============================== */
          if (isGroup) {
            try {
              const groupAESKey = await getGroupAESKey({
                groupId: selectedUser.roomId, // ✅ STRING roomId
                encryptedGroupKeys: selectedUser.encryptedGroupKeys,
                myUserId,
              });

              const plainText = await decryptGroupMessage({
                groupAESKey,
                cipherText: m.cipherText,
                iv: m.iv,
              });

              return { ...m, content: plainText };
            } catch (e) {
              console.error("Group decrypt failed", e);
              return { ...m, content: "🔒 Unable to decrypt" };
            }
          }

          /* ===============================
             🔐 PRIVATE MESSAGE
             =============================== */
          let aesKey = null;

          if (m.encryptedAesKeyForSender) {
            try {
              aesKey = await decryptAESKey(
                privateKey,
                m.encryptedAesKeyForSender
              );
            } catch {}
          }

          if (!aesKey && m.encryptedAesKeyForReceiver) {
            try {
              aesKey = await decryptAESKey(
                privateKey,
                m.encryptedAesKeyForReceiver
              );
            } catch {}
          }

          if (!aesKey) {
            return { ...m, content: "🔒 Unable to decrypt" };
          }

          try {
            const plainText = await decryptWithAES(
              aesKey,
              m.cipherText,
              m.iv
            );
            return { ...m, content: plainText };
          } catch {
            return { ...m, content: "🔒 Unable to decrypt" };
          }
        })
      );

      setViewMessages(decrypted);
    };

    prepareMessages();
  }, [messages, selectedUser?.roomId, isGroup, myUserId]);

  /* ===============================
     AUTO SCROLL
     =============================== */
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [viewMessages.length]);

  if (!selectedUser) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          Select a chat to start messaging
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* ================= HEADER ================= */}
      <div className="chat-header">
        <div>
          <strong>
            {isGroup ? selectedUser.name : selectedUser.username}
          </strong>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {isGroup
              ? "Group conversation"
              : presence?.status === "ONLINE"
              ? "🟢 Online"
              : presence?.lastSeen
              ? "Last seen " +
                new Date(presence.lastSeen).toLocaleString("en-IN")
              : "Offline"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {isGroup && (
            <button onClick={onToggleGroupInfo}>ℹ️</button>
          )}
          {!isGroup && (
            <>
              <button onClick={onToggleAi}>🤖</button>
              <button onClick={() => onStartCall(selectedUser)}>📞</button>
            </>
          )}
        </div>
      </div>

      {/* ================= MESSAGES ================= */}
      <div className="messages">
        {viewMessages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isMe={Number(m.sender.id) === Number(myUserId)}
            chatType={selectedUser.type}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ================= INPUT ================= */}
      <MessageInput
        chatType={selectedUser.type}
        selectedUser={selectedUser}     // MUST contain roomId
        receiverPublicKey={receiverPublicKey}
        loadingKey={loadingKey}
        onSend={onSend}                 // 🔥 NO re-wrapping
      />
    </div>
  );
};

export default ChatWindow;
