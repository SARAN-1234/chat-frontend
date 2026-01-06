import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ProfileGuard = ({ children }) => {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  if (!auth) return null;

  // ✅ Allow profile setup page itself
  if (
    !auth.profileCompleted &&
    location.pathname !== "/profile-setup"
  ) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProfileGuard;
