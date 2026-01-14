import React, { useEffect, useState } from "react";
import socket from "../../../socket";
import "./ProductList.css";
import api from "../../../api";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editPreview, setEditPreview] = useState(null);

  /* ===================== */
  /* FETCH PRODUCTS */
  /* ===================== */
  // const fetchProducts = async () => {
  //   const res = await fetch(`http://localhost:5000/products?search=${search}`);
  //   const data = await res.json();
  //   setProducts(data);
  // };

  // const fetchProducts = async () => {
  //   const res = await fetch(
  //     `http://localhost:5000/products/Allproducts?search=${search}&page=${page}&limit=${limit}`
  //   );
  //   const data = await res.json();

  //   // expected backend response:
  //   // { products: [], totalPages: number }

  //   if (Array.isArray(data)) {
  //     // fallback if backend does NOT paginate yet
  //     setProducts(data);
  //     setTotalPages(1);
  //   } else {
  //     setProducts(data.products);
  //     setTotalPages(data.totalPages);
  //   }
  // };

  const fetchProducts = async () => {
    try {
      const data = await api(
        `/products/Allproducts?search=${search}&page=${page}&limit=${limit}`
      );

      if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(1);
      } else {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [search, page]);

  /* ===================== */
  /* SOCKET */
  /* ===================== */
  // useEffect(() => {
  //   socket.on("menuUpdated", fetchProducts);
  //   return () => socket.off("menuUpdated", fetchProducts);
  // }, [page, search]);

  useEffect(() => {
    socket.on("menuUpdated", fetchProducts);
    return () => socket.off("menuUpdated", fetchProducts);
  }, []); // ✅ NOT dependent on page/search

  // const categories = Array.from(
  //   new Set(products.map((p) => p.category).filter(Boolean))
  // );

  // useEffect(() => {
  //   fetch("http://localhost:5000/categories")
  //     .then((res) => res.json())
  //     .then(setCategories)
  //     .catch(console.error);
  // }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api("/categories");
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (editPreview) URL.revokeObjectURL(editPreview);
    };
  }, [editPreview]);

  useEffect(() => {
    if (!editing) {
      setEditPreview(null);
    }
  }, [editing]);

  /* ===================== */
  /* TOGGLE AVAILABILITY */
  /* ===================== */
  // const toggleAvailability = async (p) => {
  //   setProducts((prev) =>
  //     prev.map((item) =>
  //       item._id === p._id ? { ...item, isAvailable: !p.isAvailable } : item
  //     )
  //   );

  //   await fetch(`http://localhost:5000/products/${p._id}/availability`, {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //     },
  //     body: JSON.stringify({ isAvailable: !p.isAvailable }),
  //   });
  // };

  const toggleAvailability = async (p) => {
    const next = !p.isAvailable;

    setProducts((prev) =>
      prev.map((x) => (x._id === p._id ? { ...x, isAvailable: next } : x))
    );

    try {
      await api(`/products/${p._id}/availability`, {
        method: "PUT",
        body: { isAvailable: next },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch {
      // rollback
      setProducts((prev) =>
        prev.map((x) =>
          x._id === p._id ? { ...x, isAvailable: p.isAvailable } : x
        )
      );
    }
  };

  /* ===================== */
  /* TOGGLE POPULAR */
  /* ===================== */
  // const togglePopular = async (p) => {
  //   const fd = new FormData();
  //   fd.append("isPopular", !p.isPopular);

  //   await fetch(`http://localhost:5000/products/${p._id}`, {
  //     method: "PUT",
  //     headers: {
  //       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //     },
  //     body: fd,
  //   });

  //   socket.emit("menuUpdated");
  // };

  // const togglePopular = async (p) => {
  //   try {
  //     await api(`/products/${p._id}`, {
  //       method: "PUT",
  //       body: { isPopular: !p.isPopular },
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //     });

  //     socket.emit("menuUpdated");
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const togglePopular = async (p) => {
    try {
      const fd = new FormData();
      fd.append("isPopular", !p.isPopular);

      await api(`/products/${p._id}`, {
        method: "PUT",
        body: fd,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      socket.emit("menuUpdated");
    } catch (err) {
      console.error(err);
    }
  };

  /* ===================== */
  /* DELETE PRODUCT */
  /* ===================== */
  // const confirmDelete = async () => {
  //   if (!deleteTarget) return;

  //   await fetch(`http://localhost:5000/products/${deleteTarget}`, {
  //     method: "DELETE",
  //     headers: {
  //       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //     },
  //   });

  //   setDeleteTarget(null);
  //   socket.emit("menuUpdated");
  // };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api(`/products/${deleteTarget}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      socket.emit("menuUpdated");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="product-list">
      <h3>📦 Products</h3>

      <input
        className="product-search"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {products.length === 0 && <p>No products found</p>}

      {products.map((p) => (
        <div
          key={p._id}
          className={`product-row ${!p.isAvailable ? "disabled" : ""}`}
        >
          {/* HEADER (CLICKABLE) */}
          <div
            className="product-main clickable"
            onClick={() => setExpanded(expanded === p._id ? null : p._id)}
          >
            <img src={p.image} alt={p.title} className="product-image" />

            <div className="product-info">
              <b>{p.title}</b>
              <span className="product-price">₹{p.price}</span>
            </div>

            <div className="badge-group">
              <span
                className={`badge ${
                  p.isAvailable ? "available" : "unavailable"
                }`}
              >
                {p.isAvailable ? "Available" : "Disabled"}
              </span>

              {p.isPopular && <span className="badge popular">⭐ Popular</span>}
            </div>
          </div>

          {/* EXPANDED */}
          {expanded === p._id && (
            <div className="product-expand">
              {/* TOGGLES */}
              <div className="product-actions">
                <div className="toggle-group">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={p.isAvailable}
                      onChange={() => toggleAvailability(p)}
                    />
                    <span className="slider" />
                  </label>
                  <span>Available</span>
                </div>

                <div className="toggle-group">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={p.isPopular}
                      onChange={() => togglePopular(p)}
                    />
                    <span className="slider" />
                  </label>
                  <span>Popular</span>
                </div>

                <button
                  className="btn primary"
                  disabled={saving}
                  onClick={() =>
                    setEditing({
                      ...p,
                      ingredients: (p.ingredients || []).join(", "),
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className="btn danger"
                  onClick={() => setDeleteTarget(p._id)}
                >
                  Delete
                </button>
              </div>

              {/* EDIT PANEL */}
              {editing && editing._id === p._id && (
                <div className="edit-panel">
                  <input
                    placeholder="Title"
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                  />

                  <textarea
                    placeholder="Description"
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        description: e.target.value,
                      })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Price"
                    value={editing.price}
                    onChange={(e) =>
                      setEditing({ ...editing, price: e.target.value })
                    }
                  />

                  {/* <input
                    placeholder="Category"
                    value={editing.category || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  /> */}

                  <input
                    list="category-list"
                    placeholder="Search or type category"
                    value={editing.category || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  />

                  <datalist id="category-list">
                    {categories.map((c) => (
                      <option key={c._id} value={c.title} />
                    ))}
                  </datalist>

                  <input
                    type="number"
                    placeholder="Making time (min)"
                    value={editing.makingTime || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        makingTime: e.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Ingredients (comma separated)"
                    value={editing.ingredients || ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        ingredients: e.target.value,
                      })
                    }
                  />

                  <label className="popular-toggle">
                    <input
                      type="checkbox"
                      checked={editing.isPopular}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          isPopular: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider" />
                    <span className="toggle-label">Popular</span>
                  </label>

                  <label className="file-label">
                    Upload Image
                    <input
                      className="file-input"
                      type="file"
                      accept="image/*"
                      // onChange={(e) =>
                      //   setEditing({
                      //     ...editing,
                      //     imageFile: e.target.files[0],
                      //   })
                      // }

                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        setEditing({ ...editing, imageFile: file });
                        setEditPreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>

                  {/* {editing.imageFile && (
                    <div className="image-preview">
                      <img
                        src={URL.createObjectURL(editing.imageFile)}
                        alt="preview"
                      />
                    </div>
                  )} */}

                  {editPreview && (
                    <div className="image-preview">
                      <img src={editPreview} alt="preview" />
                    </div>
                  )}

                  <div className="edit-actions">
                    <button
                      className="btn primary"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);

                        const fd = new FormData();
                        Object.entries({
                          title: editing.title,
                          description: editing.description || "",
                          price: editing.price,
                          category: editing.category || "",
                          makingTime: editing.makingTime || "",
                          ingredients: editing.ingredients || "",
                          isPopular: editing.isPopular,
                        }).forEach(([k, v]) => fd.append(k, v));

                        if (editing.imageFile)
                          fd.append("image", editing.imageFile);

                        // await fetch(
                        //   `http://localhost:5000/products/${editing._id}`,
                        //   {
                        //     method: "PUT",
                        //     headers: {
                        //       Authorization: `Bearer ${localStorage.getItem(
                        //         "token"
                        //       )}`,
                        //     },
                        //     body: fd,
                        //   }
                        // );

                        await api(`/products/${editing._id}`, {
                          method: "PUT",
                          body: fd,
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                        });

                        setSaving(false);
                        setEditing(null);
                        socket.emit("menuUpdated");
                      }}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>

                    <button
                      className="btn"
                      disabled={saving}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber = page <= 3 ? i + 1 : page - 2 + i;

            if (pageNumber > totalPages) return null;

            return (
              <button
                key={pageNumber}
                className={`btn ${page === pageNumber ? "primary" : ""}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            className="btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Delete Product?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn danger" onClick={confirmDelete}>
                Delete
              </button>
              <button className="btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
