import React from "react";

const ChatList = ({ chats, authUserId, onSelect }) => {
  return (
    <div className="sidebar-section">
      <p className="sidebar-title">CHATS</p>

      {chats.length === 0 && (
        <p className="no-users">No conversations yet</p>
      )}

      {chats.map((chat) => (
        <div
          key={chat.roomId} // ✅ STRING roomId
          className="user"
          onClick={() =>
            onSelect({
              type: "PRIVATE",

              // 🔥 ONLY VALUE USED FOR MESSAGING
              chatRoomId: chat.roomId, // ✅ STRING

              // 👤 User identity (UI / presence only)
              userId: chat.otherUserId,
              username: chat.otherUsername,
              email: chat.otherUserEmail,
              publicKey: chat.otherUserPublicKey,
            })
          }
        >
          <div className="user-info">
            <span className="username">
              {chat.otherUsername}
            </span>

            <span className="email">
              {chat.lastMessageSenderId === authUserId
                ? `You: ${chat.lastMessage}`
                : chat.lastMessage}
            </span>
          </div>

          <div className="chat-time">
            {new Date(chat.lastMessageTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(ChatList);
