import api from "./api";

/* =========================================================
   👤 PROFILE
   ========================================================= */

/**
 * Check if profile is completed
 */
export const checkProfileCompleted = async () => {
  const res = await api.get("/profile/completed");
  return res.data.completed;
};

/**
 * Get logged-in user's profile
 */
export const getProfile = () => {
  return api.get("/profile");
};

/**
 * Update profile details
 */
export const updateProfile = (data) => {
  // IMPORTANT: do NOT stringify, axios handles JSON
  return api.put("/profile", data);
};

/* =========================================================
   🔐 PUBLIC KEY (E2EE)
   ========================================================= */

/**
 * Upload RSA public key to backend
 * Called once after login if key not present
 */
export const uploadPublicKey = (publicKey) => {
  return api.put("/profile/public-key", {
    publicKey,
  });
};
