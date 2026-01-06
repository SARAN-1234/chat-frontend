import { createContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const storedAuth = localStorage.getItem("auth");
    return storedAuth ? JSON.parse(storedAuth) : null;
  });

  const login = (data) => {
    setAuth((prev) => {
      const merged = {
        ...(prev || {}),
        ...data, // ✅ merge instead of replace
      };

      localStorage.setItem("auth", JSON.stringify(merged));
      localStorage.setItem("token", merged.token);

      return merged;
    });
  };

  const logout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
