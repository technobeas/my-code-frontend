import React, { useEffect, useState } from "react";
import socket from "../../../socket";
import "./AddProduct.css";
import api from "../../../api";

export default function AddProduct() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    makingTime: "",
    ingredients: "",
    isPopular: false,
  });

  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ===================== */
  /* FETCH CATEGORIES */
  /* ===================== */
  // useEffect(() => {
  //   fetch("http://localhost:5000/categories")
  //     .then((res) => res.json())
  //     .then(setCategories);
  // }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api("/categories");
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    loadCategories();
  }, []);

  /* ===================== */
  /* HANDLE CHANGE */
  /* ===================== */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // setForm({
    //   ...form,
    //   [name]: type === "checkbox" ? checked : value,
    // });

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [modal, setModal] = useState({
    open: false,
    type: "", // "success" | "error"
    message: "",
  });

  /* ===================== */
  /* SUBMIT PRODUCT */
  /* ===================== */
  const submit = async () => {
    if (adding) return;

    if (!image) {
      setModal({
        open: true,
        type: "error",
        message: "Image is required",
      });
      return;
    }

    if (!form.category) {
      setModal({
        open: true,
        type: "error",
        message: "Category is required",
      });
      return;
    }

    setAdding(true);

    try {
      const fd = new FormData();

      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("price", form.price);
      fd.append("category", form.category);
      fd.append("makingTime", form.makingTime);
      fd.append("isPopular", form.isPopular);

      fd.append(
        "ingredients",
        JSON.stringify(form.ingredients.split(",").map((i) => i.trim()))
      );

      fd.append("image", image);

      // const res = await fetch("http://localhost:5000/products", {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: fd,
      // });

      await api("/products", {
        method: "POST",
        body: fd,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      socket.emit("menuUpdated");

      setModal({
        open: true,
        type: "success",
        message: "✅ Product added successfully",
      });

      // reset
      setForm({
        title: "",
        description: "",
        price: "",
        category: "",
        makingTime: "",
        ingredients: "",
        isPopular: false,
      });
      setImage(null);
      setPreview(null);
    } catch (err) {
      setModal({
        open: true,
        type: "error",
        message: err.message || "Something went wrong",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="add-product-card">
      <h3 className="add-product-title">➕ Add Product</h3>

      <input
        className="add-product-input"
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
      />

      <textarea
        className="add-product-textarea"
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      />

      <input
        className="add-product-input"
        name="price"
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={handleChange}
      />

      {/* <select
        className="add-product-select"
        name="category"
        value={form.category}
        onChange={handleChange}
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c.title}>
            {c.title}
          </option>
        ))}
      </select> */}

      <input
        className="add-product-input"
        list="category-list"
        name="category"
        placeholder="Search or type category"
        value={form.category}
        onChange={handleChange}
      />

      <datalist id="category-list">
        {categories.map((c) => (
          <option key={c._id} value={c.title} />
        ))}
      </datalist>

      <input
        className="add-product-input"
        name="makingTime"
        type="number"
        placeholder="Making Time (minutes)"
        value={form.makingTime}
        onChange={handleChange}
      />

      <input
        className="add-product-input"
        name="ingredients"
        placeholder="Ingredients (comma separated)"
        value={form.ingredients}
        onChange={handleChange}
      />

      {/* <label className="add-product-checkbox">
        <input
          type="checkbox"
          name="isPopular"
          checked={form.isPopular}
          onChange={handleChange}
        />
        Popular Item
      </label> */}

      <label className="popular-toggle">
        <input
          type="checkbox"
          name="isPopular"
          checked={form.isPopular}
          onChange={handleChange}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">Popular Item</span>
      </label>

      {/* FILE UPLOAD */}
      <label className="file-label">
        Upload Product Image
        <input
          className="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }}
        />
      </label>

      {/* IMAGE PREVIEW */}
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="preview" />
          <button
            type="button"
            className="remove-image"
            onClick={() => {
              if (preview) URL.revokeObjectURL(preview);
              setImage(null);
              setPreview(null);
            }}
          >
            Remove Image
          </button>
        </div>
      )}

      <button className="add-product-btn" onClick={submit} disabled={adding}>
        {adding ? "Adding..." : "Add Product"}
      </button>

      {modal.open && (
        <div className="modal-backdrop">
          <div className={`modal-card ${modal.type}`}>
            <p>{modal.message}</p>
            <button onClick={() => setModal({ open: false })}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
