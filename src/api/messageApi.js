import api from "./api";

export const markMessageAsRead = async (messageId) => {
  try {
    await api.post(`/message/read?messageId=${messageId}`);
  } catch (err) {
    console.error("Failed to mark message as read", err);
  }
};
