import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 🔧 FIX for SockJS / STOMP
import global from "global";
window.global = global;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
