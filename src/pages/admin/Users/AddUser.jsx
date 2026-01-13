import React, { useState } from "react";
import "./AddUser.css";
import api from "../../../api";

export default function AddUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "waiter",
  });

  const [creating, setCreating] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    type: "success", // "success" | "error"
    message: "",
  });

  const submit = async () => {
    if (creating) return;

    // ===== VALIDATION =====
    if (!form.name.trim()) {
      return setModal({
        open: true,
        type: "error",
        message: "Name is required",
      });
    }

    if (!form.email.trim()) {
      return setModal({
        open: true,
        type: "error",
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return setModal({
        open: true,
        type: "error",
        message: "Please enter a valid email address",
      });
    }

    if (!form.password) {
      return setModal({
        open: true,
        type: "error",
        message: "Password is required",
      });
    }

    if (form.password.length < 6) {
      return setModal({
        open: true,
        type: "error",
        message: "Password must be at least 6 characters long",
      });
    }

    if (!form.role) {
      return setModal({
        open: true,
        type: "error",
        message: "Role is required",
      });
    }

    // ===== API CALL =====
    setCreating(true);

    try {
      await api("/admin/register-user", {
        method: "POST",
        body: form,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setModal({
        open: true,
        type: "success",
        message: "✅ User created successfully",
      });

      setForm({
        name: "",
        email: "",
        password: "",
        role: "waiter",
      });
    } catch (err) {
      setModal({
        open: true,
        type: "error",
        message: err.message || "Failed to create user",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="add-user">
        <h3>Create Staff</h3>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          disabled={creating}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
          disabled={creating}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
          disabled={creating}
        />

        <select
          value={form.role}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, role: e.target.value }))
          }
          disabled={creating}
        >
          <option value="waiter">Waiter</option>
          <option value="chef">Chef</option>
        </select>

        <button onClick={submit} disabled={creating}>
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {/* MODAL */}
      {modal.open && (
        <div className="modal-backdrop">
          <div className={`modal ${modal.type}`}>
            <p>{modal.message}</p>

            <button
              onClick={() => setModal({ open: false })}
              className="modal-btn"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
