import React, { useEffect, useState } from "react";
import socket from "../../../socket";
import "./ManageUsers.css";
import api from "../../../api";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [modal, setModal] = useState({
    open: false,
    type: "success", // success | error | confirm
    message: "",
    userId: null,
  });

  const authHeader = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  /* ===================== */
  /* LOAD USERS */
  /* ===================== */
  const loadUsers = async () => {
    try {
      const data = await api("/admin/users", {
        headers: authHeader,
      });
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  /* ===================== */
  /* SOCKET */
  /* ===================== */
  useEffect(() => {
    loadUsers();

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    // Ask server for current status
    socket.emit("getOnlineUsers");

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  /* ===================== */
  /* ENABLE / DISABLE USER */
  /* ===================== */
  const toggleUser = async (id, isCurrentlyActive) => {
    try {
      await api(`/admin/users/${id}/toggle`, {
        method: "PUT",
        headers: authHeader,
      });

      // If disabling → force logout
      if (isCurrentlyActive) {
        socket.emit("disableUser", id);
      }

      loadUsers();
    } catch (err) {
      console.error("Failed to toggle user", err);
    }
  };

  /* ===================== */
  /* UPDATE PASSWORD */
  /* ===================== */
  const updatePassword = async (id) => {
    if (!passwords[id]) {
      return setModal({
        open: true,
        type: "error",
        message: "Please enter a new password.",
      });
    }

    try {
      await api(`/admin/users/${id}/password`, {
        method: "PUT",
        body: { password: passwords[id] },
        headers: authHeader,
      });

      setModal({
        open: true,
        type: "success",
        message: "✅ Password updated successfully",
      });

      setPasswords((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      setModal({
        open: true,
        type: "error",
        message: "Failed to update password",
      });
    }
  };

  /* ===================== */
  /* DELETE USER */
  /* ===================== */
  const deleteUser = async (id) => {
    try {
      await api(`/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });

      setUsers((prev) => prev.filter((u) => u._id !== id));

      setModal({
        open: true,
        type: "success",
        message: "🗑 User deleted successfully",
      });
    } catch (err) {
      setModal({
        open: true,
        type: "error",
        message: "Failed to delete user",
      });
    }
  };

  /* ===================== */
  /* UI (UNCHANGED) */
  /* ===================== */
  return (
    <div>
      <div className="manage-users">
        <h3>👥 Manage Users</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Online</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const isOnline = onlineUsers.includes(u._id);

                return (
                  <tr key={u._id} className={!u.active ? "disabled" : ""}>
                    <td>{u.name}</td>
                    <td>
                      <strong>{u.role}</strong>
                    </td>

                    <td>
                      <span
                        className={`badge ${u.active ? "active" : "disabled"}`}
                      >
                        {u.active ? "Active" : "Disabled"}
                      </span>
                    </td>

                    <td>
                      <span className={isOnline ? "online" : "offline"}>
                        {isOnline ? "🟢 Online" : "🔴 Offline"}
                      </span>
                    </td>

                    <td>
                      <div className="actions">
                        <button
                          className={`btn ${
                            u.active ? "btn-disable" : "btn-toggle"
                          }`}
                          onClick={() => toggleUser(u._id, u.active)}
                        >
                          {u.active ? "Disable" : "Enable"}
                        </button>

                        <button
                          className="btn btn-call"
                          disabled={!isOnline}
                          onClick={() =>
                            socket.emit("callUser", {
                              userId: u._id,
                              from: "Admin",
                            })
                          }
                        >
                          📞 Call
                        </button>

                        <div className="password-row">
                          <input
                            type="password"
                            className="password-input"
                            placeholder="New password"
                            value={passwords[u._id] || ""}
                            onChange={(e) =>
                              setPasswords((prev) => ({
                                ...prev,
                                [u._id]: e.target.value,
                              }))
                            }
                          />

                          <button
                            className="btn btn-password"
                            onClick={() => updatePassword(u._id)}
                          >
                            Reset
                          </button>
                        </div>

                        <button
                          className="btn btn-delete"
                          onClick={() =>
                            setModal({
                              open: true,
                              type: "confirm",
                              userId: u._id,
                              message: `Delete "${u.name}"? This action cannot be undone.`,
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL (UNCHANGED) */}
      {modal.open && (
        <div className="modal-backdrop">
          <div className={`modal ${modal.type}`}>
            <p>{modal.message}</p>

            {modal.type === "confirm" ? (
              <div className="modal-actions">
                <button
                  className="modal-btn danger"
                  onClick={() => {
                    deleteUser(modal.userId);
                    setModal({ open: false });
                  }}
                >
                  Yes, Delete
                </button>

                <button
                  className="modal-btn"
                  onClick={() => setModal({ open: false })}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="modal-btn"
                onClick={() => setModal({ open: false })}
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
