import { useEffect, useState } from "react";
import {
  connectWebSocket,
  subscribeToChat,
  subscribeToPresence,
  sendMessage,
  disconnectWebSocket,
} from "../services/websocket";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";

const Chat = () => {
  const chatRoomId = 1;
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState(null);

  // ✅ logged-in user id (already exists in your app)
  const myUserId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    connectWebSocket(() => {
      subscribeToPresence(setPresence);

      subscribeToChat(chatRoomId, (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    });

    return () => disconnectWebSocket();
  }, []);

  return (
    <div className="chat-container">
      <ChatHeader presence={presence} />

      {/* 🔥 PASS myUserId */}
      <MessageList
        messages={messages}
        myUserId={myUserId}
      />

      <MessageInput
        onSend={(text) => sendMessage(chatRoomId, text)}
      />
    </div>
  );
};

export default Chat;
