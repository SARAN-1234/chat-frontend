import axios from "axios";

const http = axios.create({
  baseURL: "http://localhost:8080/api", // backend context-path
});

/* ===== REQUEST INTERCEPTOR ===== */
http.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔴 CRITICAL: force JSON body
    config.headers["Content-Type"] = "application/json";

    return config;
  },
  (error) => Promise.reject(error)
);

/* ===== RESPONSE INTERCEPTOR ===== */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }

    if (status === 403) {
      window.location.href = "/profile-setup";
    }

    return Promise.reject(error);
  }
);

export default http;
