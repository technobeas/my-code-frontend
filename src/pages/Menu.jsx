import React, { useEffect, useState } from "react";
import socket from "../socket";
import "./Menu.css";
import api from "../api";

export default function Menu() {
  const tableFromQR = window.location.pathname.split("/")[2];

  const [tableNo, setTableNo] = useState(
    tableFromQR || localStorage.getItem("tableNo") || ""
  );
  const [orderType] = useState(tableFromQR ? "dine-in" : "takeaway");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // const [showSplash, setShowSplash] = useState(true);
  // const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const splashStartRef = React.useRef(Date.now());

  const loadingMessages = [
    "Brewing your menu… ☕",
    "Heating the oven… 🔥",
    "Plating dishes… 🍽",
    "Almost ready… ✨",
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );
  const [orderId, setOrderId] = useState(localStorage.getItem("orderId"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isOnline = navigator.onLine;

  const popularProducts = products.filter((p) => p.isPopular && p.isAvailable);
  const visibleProducts = products.filter(
    (p) =>
      p.isAvailable && (!selectedCategory || p.category === selectedCategory)
  );

  /* ================= EFFECTS (UNCHANGED) ================= */
  useEffect(() => {
    if (tableNo) localStorage.setItem("tableNo", tableNo);
  }, [tableNo]);

  useEffect(() => {
    if (
      selectedCategory &&
      !categories.some((c) => c.title === selectedCategory && c.isActive)
    ) {
      setSelectedCategory("");
    }
  }, [categories]);

  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [showSplash]);

  useEffect(() => {
    if (!showSplash) return;

    const maxTimer = setTimeout(() => {
      setShowSplash(false);
      setShowSkeleton(true);
    }, 30000); // MAX 30s

    return () => clearTimeout(maxTimer);
  }, [showSplash]);

  const fetchProducts = async () => {
    try {
      const data = await api(
        `/products?search=${search}&category=${selectedCategory}&page=${page}`
      );

      setProducts(data.products);
      setTotalPages(data.totalPages);

      const elapsed = Date.now() - splashStartRef.current;
      const remaining = Math.max(2000 - elapsed, 0);

      setTimeout(() => {
        setShowSplash(false);
        setShowSkeleton(false);
      }, remaining);
    } catch {
      console.error("Products not fetched yet");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, page]);

  useEffect(() => {
    api("/categories").then(setCategories);
  }, []);

  useEffect(() => {
    socket.on("menuUpdated", fetchProducts);
    return () => socket.off("menuUpdated", fetchProducts);
  }, []);

  useEffect(() => {
    socket.on("categoriesUpdated", () => {
      api("/categories").then(setCategories);
    });

    return () => socket.off("categoriesUpdated");
  }, []);

  useEffect(() => {
    socket.on("updateMenuAvailability", (product) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? product : p))
      );
    });
    return () => socket.off("updateMenuAvailability");
  }, []);

  useEffect(() => {
    if (!orderId) return;

    api(`/orders/${orderId}`)
      .then((order) => {
        if (!order || order.status === "served") {
          localStorage.removeItem("orderId");
          setOrderId(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("orderId");
        setOrderId(null);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const savedTable = localStorage.getItem("tableNo");
    if (savedTable && savedTable !== tableNo) {
      localStorage.removeItem("orderId");
      setOrderId(null);
      setCart([]);
    }
  }, [tableNo]);

  useEffect(() => {
    socket.on("productsUpdated", fetchProducts);

    return () => socket.off("productsUpdated", fetchProducts);
  }, [fetchProducts]);

  /* ================= CART LOGIC (UNCHANGED) ================= */
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p._id === product._id);
      if (exists) {
        return prev.map((p) =>
          p._id === product._id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const increaseQty = (id) =>
    setCart((prev) =>
      prev.map((p) => (p._id === id ? { ...p, qty: p.qty + 1 } : p))
    );

  const decreaseQty = (id) =>
    setCart((prev) =>
      prev
        .map((p) => (p._id === id ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((p) => p._id !== id));

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const checkout = async () => {
    if (!isOnline) return alert("Offline: Checkout disabled");
    if (!tableNo && orderType === "dine-in") return alert("Enter table number");
    if (!cart.length) return;

    const totalAmount = Number(total);
    if (Number.isNaN(totalAmount) || totalAmount <= 0) return;

    if (placingOrder) return;
    setPlacingOrder(true);

    try {
      // 1️⃣ TRY ADD-ON
      try {
        await api(
          tableFromQR ? "/orders/addon/by-table" : "/orders/by-waiter",
          {
            method: "PUT",
            body: {
              tableNo: Number(tableNo),
              items: cart,
            },
          }
        );

        socket.emit("refreshOrders");
        setCart([]);
        return;
      } catch {
        // expected → create new order
      }

      // 2️⃣ CREATE NEW ORDER
      const order = await api("/orders", {
        method: "POST",
        body: {
          tableNo: Number(tableNo),
          orderType,
          items: cart,
          total: totalAmount,
        },
      });

      localStorage.setItem("orderId", order._id);
      setOrderId(order._id);
      socket.emit("refreshOrders");
      setCart([]);
    } finally {
      // ✅ only here
      setPlacingOrder(false);
    }
  };

  const callWaiter = () => {
    if (!isOnline) return alert("Offline");
    if (!tableNo) return alert("Table number missing");
    socket.emit("callWaiter", { tableNo, source: "menu" });
  };

  /* ================= UI ================= */
  return (
    <>
      {showSplash && (
        <div className="splash">
          <div className="splash-card">
            <img src="/owl-logo.webp" alt="OWL Cafe" className="splash-logo" />

            <h1>OWL Cafe</h1>
            <p>{loadingMessages[messageIndex]}</p>

            <div className="loader">
              <span />
              <span />
              <span />
            </div>

            {/* <div className="progress">
              <div style={{ width: `${loadingProgress}%` }} />
            </div> */}
          </div>
        </div>
      )}

      <header className="hero">
        <div className="hero-left">
          <img className="hero-image" src="/owl-logo.webp" alt="OWL Cafe" />
          <div className="hero-text">
            <div className="brand">OWL Cafe</div>
            <div className="tagline">Warm Cups. Quiet Nights</div>
          </div>
        </div>

        <button
          className="hero-cart"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open cart"
        >
          🛒
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
      </header>

      <main>
        {!tableFromQR && (
          <div className="search-wrap">
            <input
              placeholder="Enter Table No"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
            />
          </div>
        )}

        <div className="search-wrap">
          <input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {popularProducts.length > 0 && (
          <section>
            <div className="section-heading">
              <h2>Popular</h2>
              <small>Staff picks</small>
            </div>

            <div className="popular-row no-scrollbar">
              {popularProducts.map((p) => (
                <div key={p._id} className="popular-card">
                  <div className="img-wrap">
                    <img src={p.image} alt={p.title} />

                    <div className="price-pill">₹{p.price}</div>

                    {p.orderCount > 0 && (
                      <div className="badge hot">🔥 {p.orderCount}</div>
                    )}
                  </div>

                  <div className="card-body">
                    <h4 className="title">{p.title}</h4>

                    {/* {p.description && <p className="desc">{p.description}</p>} */}

                    <div className="meta">
                      {/* {p.makingTime && (
                        <span className="meta-item">⏱ {p.makingTime} min</span>
                      )} */}

                      {/* {p.ingredients?.length > 0 && (
                        <span className="meta-item">
                          🧂 {p.ingredients.slice(0, 3).join(", ")}
                        </span>
                      )} */}
                    </div>

                    <button className="add-btn" onClick={() => addToCart(p)}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="category-container no-scrollbar">
          {/* ALL */}
          <button
            className={`category-btn ${
              selectedCategory === "" ? "active" : ""
            }`}
            onClick={() => setSelectedCategory("")}
          >
            <div className="category-circle">🍽</div>
            <div className="category-label">All</div>
          </button>

          {/* CATEGORIES */}
          {categories
            .filter((c) => c.isActive !== false)
            .map((cat) => (
              <button
                key={cat._id}
                className={`category-btn ${
                  selectedCategory === cat.title ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat.title)}
              >
                <div className="category-circle">
                  <img src={cat.image} alt={cat.title} />
                </div>
                <div className="category-label">{cat.title}</div>
              </button>
            ))}
        </div>

        <button className="ghost-btn" onClick={callWaiter}>
          🔔 Call Waiter
        </button>

        {showSkeleton ? (
          <MenuSkeleton />
        ) : (
          <div className="grid">
            {visibleProducts.map((p) => (
              <div key={p._id} className="menu-card">
                <div className="img-wrap">
                  <img src={p.image} alt={p.title} />
                </div>

                <div className="card-body">
                  <h4 className="title">{p.title}</h4>

                  {/* optional */}
                  {/* {p.description && <p className="desc">{p.description}</p>} */}

                  {/* <div className="meta">
                    {p.ingredients?.length > 0 && (
                      <span className="meta-item">
                        🧂 {p.ingredients.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div> */}

                  <div className="bottom-row">
                    <div className="bottom-left">
                      {/* <span className="menu-price">₹{p.price}</span> */}
                      {p.makingTime && (
                        <span className="time">⏱ {p.makingTime} min</span>
                      )}
                      {p.orderCount > 0 && (
                        <span className="order-count">
                          🔥 {p.orderCount} ordered
                        </span>
                      )}
                    </div>
                  </div>

                  <button className="add-btn" onClick={() => addToCart(p)}>
                    Add To Cart - ₹{p.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>{page}</span>
          <button onClick={() => setPage(page + 1)}>Next</button>
        </div> */}

        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={num === page ? "active" : ""}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </main>

      {drawerOpen && (
        <>
          <div className="overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer open">
            <div className="drawer-header">
              <h3>Your Cart</h3>
              <button
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
              >
                ✖
              </button>
            </div>

            <div className="drawer-body">
              {cart.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="thumb">
                    <img src={item.image} alt={item.title} />
                  </div>

                  <div className="meta">
                    <div className="title">{item.title}</div>
                    <div className="small">
                      ₹{item.price} × {item.qty}
                    </div>

                    <div className="qty-control">
                      <button onClick={() => decreaseQty(item._id)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => increaseQty(item._id)}>+</button>
                    </div>
                  </div>

                  <button
                    className="remove"
                    onClick={() => removeFromCart(item._id)}
                    aria-label="Remove item"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>

            <div className="checkout-wrap">
              <strong>Total: ₹{total}</strong>
              <button className="drawer-cta" onClick={checkout}>
                Place Order
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function MenuSkeleton() {
  return (
    <div className="grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card skeleton-card">
          <div className="skeleton-img" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}
