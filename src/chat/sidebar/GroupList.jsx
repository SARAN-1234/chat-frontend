const GroupList = ({ groups, onSelect, activeGroupId }) => (
  <div className="sidebar-section">
    <p className="sidebar-title">GROUPS</p>

    {groups.length === 0 && (
      <p className="no-users">No groups yet</p>
    )}

    {groups.map((group) => (
      <div
        key={group.id}
        className={`user ${
          activeGroupId === group.id ? "active" : ""
        }`}
        onClick={() => onSelect(group)}   // ✅ PASS FULL OBJECT
      >
        <div className="status offline" />

        <div className="user-info">
          <span className="username">
            {group.name}
          </span>

          <span className="email">
            {group.memberCount} members
          </span>
        </div>
      </div>
    ))}
  </div>
);

export default GroupList;
