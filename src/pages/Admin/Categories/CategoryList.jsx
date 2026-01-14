import React, { useEffect, useState } from "react";
import socket from "../../../socket";
import "./CategoryList.css";
import api from "../../../api";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  // const load = async () => {
  //   const res = await fetch("http://localhost:5000/categories");
  //   setCategories(await res.json());
  // };

  const load = async () => {
    const data = await api("/categories");
    setCategories(data);
  };

  const toggleRow = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    load();
    socket.on("categoriesUpdated", load);
    return () => socket.off("categoriesUpdated");
  }, []);

  // const toggleActive = async (c) => {
  //   setCategories((prev) =>
  //     prev.map((x) => (x._id === c._id ? { ...x, isActive: !x.isActive } : x))
  //   );

  //   await fetch(`http://localhost:5000/categories/${c._id}/active`, {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //     },
  //     body: JSON.stringify({ isActive: !c.isActive }),
  //   });
  // };

  const toggleActive = async (c) => {
    const next = !c.isActive;

    // optimistic UI
    setCategories((prev) =>
      prev.map((x) => (x._id === c._id ? { ...x, isActive: next } : x))
    );

    try {
      await api(`/categories/${c._id}/active`, {
        method: "PUT",
        body: { isActive: next },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (err) {
      // rollback on failure
      setCategories((prev) =>
        prev.map((x) => (x._id === c._id ? { ...x, isActive: c.isActive } : x))
      );
      alert("Failed to update category status");
    }
  };

  return (
    <div className="category-list">
      <h3 className="category-title">📂 Categories</h3>
      <input
        className="category-search"
        placeholder="Search category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {categories
        .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
        .map((c) => (
          <div key={c._id} className="category-card">
            {/* LEFT (IMAGE + TITLE) */}
            <div className="category-main" onClick={() => toggleRow(c._id)}>
              <img src={c.image} className="category-image" />

              <div className="category-info">
                <span className="category-name">{c.title}</span>
                {!c.isActive && (
                  <span className="inactive-badge">Disabled</span>
                )}
              </div>

              {/* TOGGLE SWITCH */}
              <label className="switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={c.isActive}
                  onChange={() => toggleActive(c)}
                />
                <span className="slider" />
              </label>
            </div>

            {/* EXPANDABLE AREA */}
            {openId === c._id && (
              <div className="category-expand">
                {editingId === c._id ? (
                  <InlineEdit category={c} close={() => setEditingId(null)} />
                ) : (
                  <div className="category-actions">
                    <button onClick={() => setEditingId(c._id)}>Edit</button>
                    <button
                      className="danger-btn"
                      onClick={() => setConfirmDelete(c)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

      {/* DELETE CONFIRM MODAL */}
      {confirmDelete && (
        <div className="modal-backdrop">
          <div className="modal-card error">
            <p>
              Delete <b>{confirmDelete.title}</b>?
              <br />
              This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                className="danger-btn"
                onClick={async () => {
                  // await fetch(
                  //   `http://localhost:5000/categories/${confirmDelete._id}`,
                  //   {
                  //     method: "DELETE",
                  //     headers: {
                  //       Authorization: `Bearer ${localStorage.getItem(
                  //         "token"
                  //       )}`,
                  //     },
                  //   }
                  // );

                  await api(`/categories/${confirmDelete._id}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  });

                  socket.emit("categoriesUpdated");
                  setConfirmDelete(null);
                }}
              >
                Delete
              </button>

              <button
                className="secondary-btn"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== */
/* INLINE EDIT */
/* ===================== */
function InlineEdit({ category, close }) {
  const [title, setTitle] = useState(category.title);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(category.image);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview !== category.image) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const save = async () => {
    setSaving(true);

    const fd = new FormData();
    fd.append("title", title);
    if (image) fd.append("image", image);

    // await fetch(`http://localhost:5000/categories/${category._id}`, {
    //   method: "PUT",
    //   headers: {
    //     Authorization: `Bearer ${localStorage.getItem("token")}`,
    //   },
    //   body: fd,
    // });

    await api(`/categories/${category._id}`, {
      method: "PUT",
      body: fd,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    socket.emit("categoriesUpdated");
    close();
  };

  return (
    <div className="edit-box">
      <input
        className="edit-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="file-label">
        Change image
        <input
          type="file"
          className="file-input"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }}
        />
      </label>

      {preview && <img src={preview} className="edit-preview" alt="Preview" />}

      <div className="edit-actions">
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="secondary-btn" onClick={close}>
          Cancel
        </button>
      </div>
    </div>
  );
}
