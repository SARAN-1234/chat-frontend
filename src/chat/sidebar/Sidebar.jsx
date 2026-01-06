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
      {/* PROFILE */}
      <SidebarProfile />

      {/* CREATE GROUP */}
      <button
        className="new-group-btn"
        onClick={() => setShowCreateGroup(true)}
      >
        ➕ New Group
      </button>

      <div className="sidebar-header">💬 Chats</div>

      {/* SEARCH */}
      <SidebarSearch value={search} onChange={setSearch} />

      {/* LIST */}
      <div className="sidebar-scroll">
        {search.trim() ? (
          <UserSearchResults
            users={users}
            loading={loading}
            onSelect={(user) => {
              setSearch("");
              onSelectUser({
                ...user,
                type: "PRIVATE",
              });
            }}
          />
        ) : (
          <>
            {/* PRIVATE CHATS */}
            <ChatList
              chats={chats}
              authUserId={auth?.userId}
              onSelect={(user) =>
                onSelectUser({
                  ...user,
                  type: "PRIVATE",
                })
              }
            />

            {/* GROUP CHATS ✅ */}
            <GroupList
              groups={groups}
              onSelect={(group) =>
                onSelectUser({
                  ...group,
                  type: "GROUP",

                  // 🔐 🔥 CRITICAL — DO NOT DROP THIS
                  encryptedGroupKeys:
                    group.encryptedGroupKeys ?? {},
                })
              }
            />
          </>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={(group) => {
            setShowCreateGroup(false);

            // 🔐 Ensure keys exist even for newly created group
            onSelectUser({
              ...group,
              type: "GROUP",
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
