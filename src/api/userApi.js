// src/api/userApi.js
import api from "./api";

export const getUserPublicKey = (userId) => {
  return api.get(`/profile/users/${userId}/public-key`);
};
