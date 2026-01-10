import { useContext, useState, useEffect, useCallback } from "react";
import AuthContext from "../context/AuthContext";
import "./chat.css";

/* ===============================
   COMPONENTS
   =============================== */
import Sidebar from "./sidebar/Sidebar";
import ChatWindow from "./ChatWindow";
import AiEmailPanel from "./AiEmailPanel";
import IncomingCallPopup from "./IncomingCallPopup";
import GroupInfoPanel from "./group/GroupInfoPanel.jsx";

/* ===============================
   HOOKS
   =============================== */
import useChatSocket from "./hooks/useChatSocket";
import useChatRooms from "./hooks/useChatRooms";

const ChatPage = () => {
  const { auth, logout } = useContext(AuthContext);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showAiEmail, setShowAiEmail] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  /* ===============================
     🔐 HARD E2EE GUARD
     =============================== */
  const privateKey = localStorage.getItem("privateKey");

  if (!auth || !auth.publicKey || !privateKey) {
    return (
      <div className="chat-page">
        <div className="chat-main">
          <div className="chat-error">
            <h3>🔐 Encrypted chat unavailable</h3>
            <p>
              Your private encryption key is missing.
              <br />
              Encrypted messages cannot be recovered.
            </p>
            <button onClick={logout}>Go back to login</button>
          </div>
        </div>
      </div>
    );
  }

  /* ===============================
     🔌 SOCKET + PRESENCE
     =============================== */
  const { presenceMap, incomingCall, setIncomingCall } =
    useChatSocket(auth);

  /* ===============================
     💬 CHAT ROOMS + WS
     =============================== */
  const {
    messages,
    activeRoomId,
    setActiveRoomId,
    subscribeRoom,
    send,
  } = useChatRooms(auth);

  /* ===============================
     👤 USER / GROUP SELECTION
     =============================== */
  const handleSelectUser = useCallback(
    (payload) => {
      let normalized = null;

      /* ---------- PRIVATE CHAT ---------- */
      if (payload.type === "PRIVATE") {
        normalized = {
          type: "PRIVATE",

          // ✅ string | null (first message)
          chatRoomId: payload.chatRoomId ?? null,

          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          publicKey: payload.publicKey,
        };
      }

      /* ---------- GROUP CHAT ---------- */
      if (payload.type === "GROUP") {
        normalized = {
          type: "GROUP",

          chatRoomId: payload.chatRoomId,

          name: payload.name,
          encryptedGroupKeys: payload.encryptedGroupKeys ?? {},
        };
      }

      if (!normalized) {
        console.error("❌ Invalid chat selection payload:", payload);
        return;
      }

      setSelectedUser(normalized);

      // 🔥 DO NOT force room for first private message
      if (normalized.chatRoomId) {
        setActiveRoomId(normalized.chatRoomId);
      }

      setShowAiEmail(false);
      setShowGroupInfo(false);

      localStorage.setItem(
        "lastChat",
        JSON.stringify({ chatRoomId: normalized.chatRoomId })
      );
    },
    [setActiveRoomId]
  );

  /* ===============================
     🔄 RESTORE LAST ROOM
     =============================== */
  useEffect(() => {
    const saved = localStorage.getItem("lastChat");
    if (!saved) return;

    try {
      const { chatRoomId } = JSON.parse(saved);
      if (chatRoomId) {
        setActiveRoomId(chatRoomId);
      }
    } catch {
      localStorage.removeItem("lastChat");
    }
  }, [setActiveRoomId]);

  /* ===============================
     🔥 SINGLE WS SUBSCRIPTION
     =============================== */
  useEffect(() => {
    if (!activeRoomId) return;
    subscribeRoom(activeRoomId);
  }, [activeRoomId, subscribeRoom]);

  return (
    <div className="chat-page">
      {/* ================= SIDEBAR ================= */}
      <Sidebar onSelectUser={handleSelectUser} />

      {/* ================= CHAT MAIN ================= */}
      <div className="chat-main">
        <ChatWindow
          messages={messages}
          selectedUser={selectedUser}
          presence={
            selectedUser?.type === "PRIVATE"
              ? presenceMap?.[Number(selectedUser.userId)]
              : null
          }
          onSend={send}
          onToggleAi={() => setShowAiEmail((p) => !p)}
          onToggleGroupInfo={() =>
            setShowGroupInfo((p) => !p)
          }
        />

        {showAiEmail && selectedUser?.type === "PRIVATE" && (
          <AiEmailPanel
            recipient={selectedUser.email}
            senderName={auth.username}
            onClose={() => setShowAiEmail(false)}
          />
        )}

        {showGroupInfo && selectedUser?.type === "GROUP" && (
          <GroupInfoPanel
            group={selectedUser}
            onClose={() => setShowGroupInfo(false)}
          />
        )}
      </div>

      {/* ================= CALL ================= */}
      {incomingCall && (
        <IncomingCallPopup
          caller={incomingCall}
          onAccept={() => setIncomingCall(null)}
          onReject={() => setIncomingCall(null)}
        />
      )}
    </div>
  );
};

export default ChatPage;
