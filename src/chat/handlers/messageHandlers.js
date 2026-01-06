import api from "../../api/api";

export const handleSelectUserFactory =
  (setSelectedUser, setActiveRoomId, setShowAiEmail) =>
  async (payload) => {

    setShowAiEmail(false);

    /* ===============================
       🔵 GROUP CHAT
       =============================== */
    if (payload.type === "GROUP") {
      setSelectedUser(payload);
      setActiveRoomId(payload.id);

      localStorage.setItem(
        "lastChat",
        JSON.stringify({
          roomId: payload.id,
          user: payload,
        })
      );

      return;
    }

    /* ===============================
       🟢 PRIVATE CHAT
       =============================== */
    const res = await api.post(
      `/chatroom/one-to-one?otherUserId=${payload.id}`
    );

    const selected = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      type: "PRIVATE",
      roomId: res.data.id,
    };

    setSelectedUser(selected);
    setActiveRoomId(res.data.id);

    localStorage.setItem(
      "lastChat",
      JSON.stringify({
        roomId: res.data.id,
        user: selected,
      })
    );
  };
