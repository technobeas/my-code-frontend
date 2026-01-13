import React from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function LogoutButton() {
  const navigate = useNavigate();

  const logout = () => {
    const userId = localStorage.getItem("userId");

    // 🔥 Tell server immediately
    if (userId && socket.connected) {
      socket.emit("userOffline", userId);
    }

    // Clear auth
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    navigate("/login", { replace: true });
  };

  return <button onClick={logout}>Logout</button>;
}
