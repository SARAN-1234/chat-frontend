import { useContext, useState } from "react";
import "../chat.css";
import "./ChatList.css";

/* ===============================
   COMPONENTS
   =============================== */
import SidebarProfile from "./SidebarProfile";
import SidebarSearch from "./SidebarSearch";
import UserSearchResults from "./UserSearchResults";
import ChatList from "./ChatList";
import GroupList from "./GroupList";
import CreateGroupModal from "./CreateGroupModal";

/* ===============================
   HOOKS
   =============================== */
import useSidebarChats from "./hooks/useSidebarChats";
import useUserSearch from "./hooks/useUserSearch";
import useGroupChats from "./hooks/useGroupChats";

/* ===============================
   CONTEXT
   =============================== */
import AuthContext from "../../context/AuthContext";

const Sidebar = ({ onSelectUser }) => {
  const { auth } = useContext(AuthContext);

  const { chats } = useSidebarChats();
  const { groups } = useGroupChats();
  const { search, setSearch, users, loading } = useUserSearch();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  return (
    <div className="sidebar">
      {/* ================= PROFILE ================= */}
      <SidebarProfile />

      {/* ================= CREATE GROUP ================= */}
      <button
        className="new-group-btn"
        onClick={() => setShowCreateGroup(true)}
      >
        ➕ New Group
      </button>

      <div className="sidebar-header">💬 Chats</div>

      {/* ================= SEARCH ================= */}
      <SidebarSearch value={search} onChange={setSearch} />

      {/* ================= LIST ================= */}
      <div className="sidebar-scroll">
        {search.trim() ? (
          /* ===============================
             🔍 USER SEARCH (NEW PRIVATE CHAT)
             =============================== */
          <UserSearchResults
            users={users}
            loading={loading}
            onSelect={(user) => {
              setSearch("");

              onSelectUser({
                type: "PRIVATE",

                // 🔥 MUST BE chatRoomId (null = first message)
                chatRoomId: null,

                // 👤 Receiver identity
                userId: user.id,
                username: user.username,
                email: user.email,
                publicKey: user.publicKey,
              });
            }}
          />
        ) : (
          <>
            {/* ===============================
               💬 PRIVATE CHATS (EXISTING)
               =============================== */}
            <ChatList
              chats={chats}
              authUserId={auth?.userId}
              onSelect={(chat) =>
                onSelectUser({
                  type: "PRIVATE",

                  // ✅ FIX: PUBLIC STRING roomId
                  chatRoomId: chat.roomId,

                  userId: chat.otherUserId,
                  username: chat.otherUsername,
                  email: chat.otherUserEmail,
                  publicKey: chat.otherUserPublicKey,
                })
              }
            />

            {/* ===============================
               👥 GROUP CHATS
               =============================== */}
            <GroupList
              groups={groups}
              onSelect={(group) =>
                onSelectUser({
                  type: "GROUP",

                  // ✅ FIX: PUBLIC STRING roomId
                  chatRoomId: group.roomId,

                  name: group.name,
                  encryptedGroupKeys:
                    group.encryptedGroupKeys ?? {},
                })
              }
            />
          </>
        )}
      </div>

      {/* ================= CREATE GROUP MODAL ================= */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={(group) => {
            setShowCreateGroup(false);

            onSelectUser({
              type: "GROUP",

              // ✅ FIX
              chatRoomId: group.roomId,

              name: group.name,
              encryptedGroupKeys:
                group.encryptedGroupKeys ?? {},
            });
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
