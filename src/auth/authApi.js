import axios from "axios";

const API_URL = "https://chat-backend-fup5.onrender.com/api/auth";

export const loginApi = (data) => {
  return axios.post(`${API_URL}/login`, data);
};

export const signupApi = (data) => {
  return axios.post(`${API_URL}/signup`, data);
};
