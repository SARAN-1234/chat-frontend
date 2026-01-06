const SidebarSearch = ({ value, onChange }) => (
  <input
    type="text"
    className="user-search"
    placeholder="Search users..."
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default SidebarSearch;
