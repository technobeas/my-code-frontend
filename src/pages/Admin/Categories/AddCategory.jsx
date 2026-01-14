import React, { useState, useEffect } from "react";
import socket from "../../../socket";
import "./AddCategory.css";
import api from "../../../api";

export default function AddCategory() {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    message: "",
    type: "success", // success | error
  });

  // const submit = async () => {
  //   if (!title || !image) {
  //     setModal({
  //       open: true,
  //       message: "Title and image are required.",
  //       type: "error",
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const fd = new FormData();
  //     fd.append("title", title);
  //     fd.append("image", image);

  //     const res = await fetch("http://localhost:5000/categories", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //       body: fd,
  //     });

  //     if (!res.ok) {
  //       throw new Error("Category add failed");
  //     }

  //     socket.emit("categoriesUpdated");

  //     setModal({
  //       open: true,
  //       message: "Category added successfully.",
  //       type: "success",
  //     });

  //     setTitle("");
  //     setImage(null);
  //     setPreview(null);
  //   } catch (err) {
  //     setModal({
  //       open: true,
  //       message: err.message || "Something went wrong",
  //       type: "error",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const submit = async () => {
    if (!title || !image) {
      setModal({
        open: true,
        message: "Title and image are required.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", title);
      fd.append("image", image);

      await api("/categories", {
        method: "POST",
        body: fd,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      socket.emit("categoriesUpdated");

      setModal({
        open: true,
        message: "Category added successfully.",
        type: "success",
      });

      setTitle("");
      setImage(null);
      setPreview(null);
    } catch (err) {
      setModal({
        open: true,
        message: err.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="add-category-card">
        <h3 className="add-category-title">Add Category</h3>

        <input
          className="add-category-input"
          placeholder="Category title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="file-label">
          Upload category image
          <input
            type="file"
            className="file-input"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              setImage(file);
              setPreview(URL.createObjectURL(file));
            }}
          />
        </label>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <button
              className="remove-image"
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setImage(null);
                setPreview(null);
              }}
            >
              Remove
            </button>
          </div>
        )}

        <button
          className="add-category-btn"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Category"}
        </button>
      </div>

      {/* ===== MODAL ===== */}
      {modal.open && (
        <div className="modal-backdrop">
          <div className={`modal-card ${modal.type}`}>
            <p>{modal.message}</p>
            <button onClick={() => setModal({ ...modal, open: false })}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
