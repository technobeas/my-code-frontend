import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "./Login.css";
import api from "../api"; // adjust path if needed

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // 👈 modal message
  const navigate = useNavigate();

  // const login = async () => {
  //   if (!email || !password) {
  //     setError("Email and password are required.");
  //     return;
  //   }

  //   try {
  //     const res = await fetch("http://localhost:5000/auth/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email, password }),
  //     });

  //     const data = await res.json();
  //     console.log("LOGIN RESPONSE:", data);

  //     if (!res.ok) {
  //       setError(data.msg || "Login failed");
  //       return;
  //     }

  //     localStorage.setItem("token", data.token);
  //     localStorage.setItem("role", data.role);
  //     localStorage.setItem("userId", data.userId);
  //     localStorage.setItem("name", data.name); // ✅ ADD THIS

  //     socket.emit("userOnline", data.userId);

  //     switch (data.role) {
  //       case "admin":
  //         navigate("/admin", { replace: true });
  //         break;
  //       case "waiter":
  //         navigate("/waiter", { replace: true });
  //         break;
  //       case "chef":
  //         navigate("/kitchen", { replace: true });
  //         break;
  //       default:
  //         navigate("/", { replace: true });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     setError("Server error. Please try again.");
  //   }
  // };

  const login = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      console.log("LOGIN RESPONSE:", data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("name", data.name);

      socket.emit("userOnline", data.userId);

      switch (data.role) {
        case "admin":
          navigate("/admin", { replace: true });
          break;
        case "waiter":
          navigate("/waiter", { replace: true });
          break;
        case "chef":
          navigate("/kitchen", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.msg || "Invalid email or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>

      {/* ===== MODAL ===== */}
      {error && (
        <div className="modal-backdrop">
          <div className="modal">
            <p>{error}</p>
            <button onClick={() => setError("")}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
