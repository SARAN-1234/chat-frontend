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
          key={chat.chatRoomId}
          className="user"
          onClick={() =>
            onSelect({
              type: "PRIVATE",

              // ✅ THE MOST IMPORTANT FIX
              chatRoomId: chat.chatRoomId,

              // 👤 user identity (NOT used for messaging)
              userId: chat.otherUserId,
              username: chat.otherUsername,
              email: chat.otherUserEmail,
            })
          }
        >
          <div className="user-info">
            <span className="username">{chat.otherUsername}</span>

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

/* 🔥 PREVENT UNNECESSARY RERENDERS */
export default React.memo(ChatList);
