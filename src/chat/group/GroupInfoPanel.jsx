import { useEffect, useState, useContext } from "react";
import api from "../../api/api";
import AuthContext from "../../context/AuthContext";

import "./GroupInfoPanel.css";

const GroupInfoPanel = ({ group, onClose }) => {
  const { auth } = useContext(AuthContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  /* ===============================
     LOAD GROUP MEMBERS
     =============================== */
  useEffect(() => {
    if (!group?.id) return;

    setLoading(true);

    api
      .get(`/chatroom/group/${group.id}/members`)
      .then((res) => setMembers(res.data))
      .catch((err) => {
        console.error("Failed to load group members", err);
      })
      .finally(() => setLoading(false));
  }, [group?.id]);

  /* ===============================
     LEAVE GROUP
     =============================== */
  const leaveGroup = async () => {
    if (leaving) return;

    const confirmLeave = window.confirm(
      "Are you sure you want to leave this group?"
    );
    if (!confirmLeave) return;

    try {
      setLeaving(true);
      await api.post(`/chatroom/group/${group.id}/leave`);
      onClose(); // close panel after leaving
    } catch (err) {
      console.error("Failed to leave group", err);
      alert("Failed to leave group");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="group-info-backdrop" onClick={onClose}>
      <div
        className="group-info"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===============================
           HEADER
           =============================== */}
        <div className="group-info-header">
          <h3>{group?.name || "Group"}</h3>
          <button onClick={onClose}>✖</button>
        </div>

        {/* ===============================
           META
           =============================== */}
        <p style={{ opacity: 0.7 }}>
          {loading ? "Loading members..." : `${members.length} members`}
        </p>

        {/* ===============================
           MEMBERS
           =============================== */}
        <div className="group-members">
          {members.map((m) => (
            <div key={m.userId} className="group-member">
              <span>{m.username}</span>

              {m.role === "ADMIN" && (
                <span className="admin-badge">Admin</span>
              )}

              {m.userId === auth?.userId && (
                <span className="you-badge">You</span>
              )}
            </div>
          ))}
        </div>

        {/* ===============================
           ACTIONS
           =============================== */}
        <button
          className="leave-btn"
          onClick={leaveGroup}
          disabled={leaving}
        >
          {leaving ? "Leaving..." : "Leave Group"}
        </button>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
