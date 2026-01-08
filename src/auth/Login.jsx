import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { loginApi } from "./authApi";
import { getProfile, uploadPublicKey } from "../api/profileApi";

import {
  generateRSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
} from "../chat/group/utils/crypto";

import "./Auth.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      /* ===============================
         1️⃣ AUTHENTICATE
         =============================== */
      const res = await loginApi({ username, password });

      const {
        token,
        userId,
        username: loggedInUsername,
        profileCompleted,
      } = res.data;

      /* ==================================================
         2️⃣ SAVE JWT IMMEDIATELY (CRITICAL FIX)
         ================================================== */
      login({
        token,
        userId,
        username: loggedInUsername,
        profileCompleted,
        publicKey: null, // temporary
      });

      /* ===============================
         3️⃣ LOAD PROFILE (JWT SAFE)
         =============================== */
      const profileRes = await getProfile();
      const profile = profileRes.data;

      let publicKey = profile.publicKey;
      const storedPrivateKey = localStorage.getItem("privateKey");

      /* ===============================
         4️⃣ PRIVATE KEY LOST CASE
         =============================== */
      if (publicKey && !storedPrivateKey) {
        alert(
          "🔐 Encrypted messages cannot be decrypted on this device.\n\n" +
          "Your private key is missing.\n" +
          "Please use your original device or reset encryption."
        );
        logout();
        return;
      }

      /* ===============================
         5️⃣ FIRST LOGIN → GENERATE KEYS
         =============================== */
      if (!publicKey) {
        const { publicKey: pub, privateKey } =
          await generateRSAKeyPair();

        const exportedPublicKey = await exportPublicKey(pub);
        const exportedPrivateKey = await exportPrivateKey(privateKey);

        localStorage.setItem("privateKey", exportedPrivateKey);
        await uploadPublicKey(exportedPublicKey);

        publicKey = exportedPublicKey;
      }

      /* ===============================
         6️⃣ FINAL AUTH STATE UPDATE
         =============================== */
      login({
        token,
        userId,
        username: loggedInUsername,
        profileCompleted,
        publicKey,
      });

      /* ===============================
         7️⃣ REDIRECT
         =============================== */
      navigate(profileCompleted ? "/chat" : "/profile-setup", {
        replace: true,
      });

    } catch (err) {
      console.error(err);
      alert(
        err.response?.status === 401
          ? "Invalid username or password"
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign in</h2>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p>
          Don’t have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
