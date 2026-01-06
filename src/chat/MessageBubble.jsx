import React from "react";
import "./chat.css";

const MessageBubble = ({ message, isMe, chatType }) => {
  if (!message) return null;

  // ✅ Content is ALREADY prepared by ChatWindow
  const content =
    typeof message.content === "string" && message.content.length > 0
      ? message.content
      : "🔒 Encrypted message";

  return (
    <div className={`message-row ${isMe ? "me" : "other"}`}>
      <div className="message-bubble">
        {/* 👤 GROUP CHAT → show sender name */}
        {chatType === "GROUP" && !isMe && (
          <div className="sender-name">
            {message.sender?.username || "Unknown"}
          </div>
        )}

        {/* 💬 Message text */}
        <div className="message-text">{content}</div>

        {/* ⏰ Time + Read status */}
        <div className="message-meta">
          <span className="message-time">
            {message.timestamp
              ? new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>

          {/* ✓✓ only for my messages */}
          {isMe && (
            <span
              className={`message-status ${
                message.status === "READ" ? "read" : ""
              }`}
            >
              {message.status === "READ" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
