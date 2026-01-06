const UserSearchResults = ({ users, loading, onSelect }) => (
  <div className="sidebar-section">
    <p className="sidebar-title">USERS</p>

    {loading && <p className="no-users">Searching...</p>}
    {!loading && users.length === 0 && (
      <p className="no-users">No users found</p>
    )}

    {users.map((user) => (
      <div
        key={user.id}
        className="user"
        onClick={() => onSelect(user)}
      >
        <span
          className={`status ${
            user.status === "ONLINE" ? "online" : "offline"
          }`}
        ></span>

        <div className="user-info">
          <span className="username">{user.username}</span>
          <span className="email">{user.email}</span>
        </div>
      </div>
    ))}
  </div>
);

export default UserSearchResults;
