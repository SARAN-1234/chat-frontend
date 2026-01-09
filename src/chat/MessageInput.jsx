import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";

/* ===============================
   PRIVATE CHAT CRYPTO
   =============================== */
import {
  importPublicKey,
  generateAESKey,
  encryptWithAES,
  encryptAESKey,
} from "./group/utils/crypto";

/* ===============================
   GROUP CHAT CRYPTO
   =============================== */
import {
  getGroupAESKey,
  encryptGroupMessage,
} from "./group/utils/groupKeyStore";

/* =====================================================
   MESSAGE INPUT (PRIVATE + GROUP E2EE)
   ===================================================== */
const MessageInput = ({
  onSend,
  receiverPublicKey,
  loadingKey,
  chatType,     // "PRIVATE" | "GROUP"
  selectedUser, // MUST contain chatRoomId (string | null)
}) => {
  const { auth } = useContext(AuthContext);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const disabled =
    sending ||
    (chatType === "PRIVATE" && (loadingKey || !receiverPublicKey));

  /* =====================================================
     🔐 ENCRYPT + SEND MESSAGE
     ===================================================== */
  const handleSend = async () => {
    if (disabled || !text.trim()) return;

    try {
      setSending(true);

      /* ===============================
         🔒 PRIVATE CHAT
         =============================== */
      if (chatType === "PRIVATE") {
        if (!selectedUser?.userId) {
          alert("Receiver missing. Reselect the user.");
          return;
        }

        const senderPublicKeyBase64 = auth?.publicKey;
        if (!senderPublicKeyBase64) {
          alert("Sender public key missing");
          return;
        }

        const receiverRsaKey = await importPublicKey(receiverPublicKey);
        const senderRsaKey = await importPublicKey(senderPublicKeyBase64);

        const aesKey = await generateAESKey();
        const { cipherText, iv } = await encryptWithAES(aesKey, text);

        const encryptedAesKeyForSender =
          await encryptAESKey(senderRsaKey, aesKey);

        const encryptedAesKeyForReceiver =
          await encryptAESKey(receiverRsaKey, aesKey);

        // ✅ ALLOW chatRoomId to be NULL (FIRST MESSAGE)
        onSend({
          chatRoomId: selectedUser.chatRoomId ?? null,
          receiverId: selectedUser.userId,   // 🔥 THIS CREATES ROOM
          type: "TEXT",
          cipherText,
          iv,
          encryptedAesKeyForSender,
          encryptedAesKeyForReceiver,
        });

        setText("");
        return;
      }

      /* ===============================
         👥 GROUP CHAT
         =============================== */
      if (chatType === "GROUP") {
        if (!selectedUser?.chatRoomId) {
          alert("Group room not ready");
          return;
        }

        const groupAESKey = await getGroupAESKey({
          groupId: selectedUser.chatRoomId,
          encryptedGroupKeys: selectedUser.encryptedGroupKeys,
          myUserId: auth.userId,
        });

        const { cipherText, iv } =
          await encryptGroupMessage(groupAESKey, text);

        onSend({
          chatRoomId: selectedUser.chatRoomId,
          type: "TEXT",
          cipherText,
          iv,
        });

        setText("");
      }
    } catch (err) {
      console.error("❌ Encryption / send failed", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-input">
      <input
        value={text}
        disabled={disabled}
        placeholder={
          chatType === "PRIVATE" && loadingKey
            ? "Loading encryption key..."
            : "Type a message..."
        }
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <button onClick={handleSend} disabled={disabled}>
        {sending ? "…" : "➤"}
      </button>
    </div>
  );
};

export default MessageInput;
