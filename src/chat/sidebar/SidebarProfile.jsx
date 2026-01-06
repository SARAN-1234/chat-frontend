import { useContext } from "react";
import AuthContext from "../../context/AuthContext";

const SidebarProfile = () => {
  const { auth } = useContext(AuthContext);

  return (
    <div className="sidebar-profile">
      <div className="user">
        <span className="status online"></span>
        <div className="user-info">
          <span className="username">{auth?.username}</span>
          <span className="email">You</span>
        </div>
      </div>
    </div>
  );
};

export default SidebarProfile;

