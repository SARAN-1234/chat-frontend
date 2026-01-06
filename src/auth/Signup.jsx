import { useState } from "react";
import { signupApi } from "./authApi";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Signup = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signupApi(form);
      alert("Account created successfully");
      navigate("/");
    } catch {
      alert("Signup failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M7 12h10"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="9" cy="15" r="1" fill="#a78bfa" />
            <circle cx="12" cy="15" r="1" fill="#38bdf8" />
            <circle cx="15" cy="15" r="1" fill="#a78bfa" />
          </svg>
          <span>Chat</span>
        </div>

        <h2>Create your account</h2>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            required
          />

          <input
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <button type="submit">Sign Up</button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
