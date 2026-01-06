import { useEffect, useState } from "react";
import api from "../../api/api";
import "./CreateGroupModal.css";

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===============================
     LOAD USERS (SEARCH)
     =============================== */
  useEffect(() => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }

    const controller = new AbortController();

    api
      .get(`/users/search?q=${search}`, {
        signal: controller.signal,
      })
      .then((res) => {
        setUsers(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") {
          console.error("Failed to load users", err);
        }
      });

    return () => controller.abort();
  }, [search]);

  /* ===============================
     TOGGLE USER SELECTION
     =============================== */
  const toggleUser = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  /* ===============================
     CREATE GROUP
     =============================== */
  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;

    setLoading(true);

    try {
      const payload = {
        name: groupName.trim(),
        memberIds: selected.map((u) => Number(u.id)), // 🔥 IMPORTANT FIX
      };

      const res = await api.post("/chatroom/group/create", payload);

      onCreated?.(res.data);
      onClose();
    } catch (err) {
      console.error("Create group failed", err);
      alert("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-modal-backdrop" onClick={onClose}>
      <div
        className="group-modal"
        onClick={(e) => e.stopPropagation()} // prevent close on inside click
      >
        <h3>Create Group</h3>

        <input
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <input
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="group-users">
          {users.length === 0 && search && (
            <p style={{ fontSize: "12px", opacity: 0.6 }}>
              No users found
            </p>
          )}

          {users.map((u) => (
            <div
              key={u.id}
              className={`group-user ${
                selected.some((s) => s.id === u.id) ? "selected" : ""
              }`}
              onClick={() => toggleUser(u)}
            >
              <span>{u.username}</span>
              <span style={{ opacity: 0.6, fontSize: "12px" }}>
                {u.email}
              </span>
            </div>
          ))}
        </div>

        <div className="group-actions">
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button
            onClick={createGroup}
            disabled={loading || !groupName.trim() || selected.length === 0}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
