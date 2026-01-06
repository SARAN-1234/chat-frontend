import { useState, useContext } from "react";
import { updateProfile } from "../api/profileApi";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import {
  FaUser,
  FaPhoneAlt,
  FaInfoCircle,
  FaCamera
} from "react-icons/fa";
import avatar from "../assets/avatar.jpg";
import "./ProfileSetup.css";

const ProfileSetup = () => {
  const [form, setForm] = useState({
    displayName: "",
    phoneNumber: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ READ AUTH CONTEXT
  const { auth, login } = useContext(AuthContext);

  const isValid =
    form.displayName.trim() !== "" &&
    form.phoneNumber.trim() !== "";

  const submit = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);

      await updateProfile({
        displayName: form.displayName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        bio: form.bio.trim(),
      });

      // ✅ UPDATE AUTH STATE (🔥 CRITICAL FIX)
      login({
        ...auth,
        profileCompleted: true,
      });

      navigate("/chat");
    } catch (err) {
      console.error("Profile update failed", err);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-card">
        <h2 className="title">Complete Your Profile</h2>
        <p className="subtitle">
          Let others know who you are
        </p>

        {/* Avatar */}
        <div className="avatar-wrapper">
          <img src={avatar} alt="Profile" />
          <div className="camera-icon">
            <FaCamera />
          </div>
        </div>

        {/* Display Name */}
        <div className="input-group">
          <FaUser className="input-icon" />
          <input
            type="text"
            placeholder="Display Name"
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
          />
        </div>

        {/* Phone */}
        <div className="input-group">
          <FaPhoneAlt className="input-icon" />
          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm({ ...form, phoneNumber: e.target.value })
            }
          />
        </div>

        {/* Bio */}
        <div className="input-group textarea">
          <FaInfoCircle className="input-icon" />
          <textarea
            placeholder="Short bio (optional)"
            value={form.bio}
            onChange={(e) =>
              setForm({ ...form, bio: e.target.value })
            }
          />
        </div>

        <button
          className="submit-btn"
          onClick={submit}
          disabled={!isValid || loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
