import { useEffect, useState } from "react";
import api from "../../../api/api";

export default function useSidebarChats() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const res = await api.get("/chatroom/sidebar");

      const sorted = [...res.data].sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      setChats(sorted);
    } catch (err) {
      console.error("❌ Failed to load chat sidebar", err);
    }
  };

  return { chats };
}
