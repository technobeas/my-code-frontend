import React, { useEffect, useState } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import "./Waiter.css";
import api from "../api"; // adjust path if needed

export default function Waiter() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [manualTable, setManualTable] = useState("");
  const [searchTable, setSearchTable] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [modal, setModal] = useState({
    open: false,
    type: "info", // info | error
    message: "",
  });

  const [callModal, setCallModal] = useState({
    open: false,
    message: "",
  });

  const [disableModal, setDisableModal] = useState({
    open: false,
    message: "",
  });

  // ✅ TOGGLE STATES
  const [showReady, setShowReady] = useState(true);
  const [showUnpaid, setShowUnpaid] = useState(true);

  // const token = localStorage.getItem("token");

  // const authHeader = {
  //   "Content-Type": "application/json",
  //   Authorization: `Bearer ${token}`,
  // };

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  /* ===================== */
  /* FETCH ORDERS */
  /* ===================== */
  // const fetchOrders = async () => {
  //   const res = await fetch("http://localhost:5000/orders", {
  //     headers: authHeader,
  //   });
  //   const data = await res.json();
  //   setOrders(data);
  // };

  const fetchOrders = async () => {
    const data = await api("/orders", {
      headers: authHeaders,
    });
    setOrders(data);
  };

  /* ===================== */
  /* SOCKET: WAITER CALL */
  /* ===================== */
  const getCallMessage = (source) => {
    if (source === "menu") return "Customer needs assistance";
    if (source === "kitchen") return "Order ready – pickup from kitchen";
    return "Waiter call";
  };

  /* ===================== */
  /* SOCKET + INITIAL LOAD */
  /* ===================== */

  useEffect(() => {
    const handleAdminCall = ({ message }) => {
      setCallModal({
        open: true,
        message: message || "📞 Admin is calling you",
      });
    };

    socket.on("adminCall", handleAdminCall);
    return () => socket.off("adminCall", handleAdminCall);
  }, []);

  useEffect(() => {
    fetchOrders();

    socket.on("refreshOrders", fetchOrders);

    return () => {
      socket.off("refreshOrders", fetchOrders);
    };
  }, []);

  useEffect(() => {
    const handleDisable = (id) => {
      if (id === localStorage.getItem("userId")) {
        setDisableModal({
          open: true,
          message: "🚫 Your account has been disabled by admin.",
        });
      }
    };

    socket.on("userDisabled", handleDisable);

    return () => {
      socket.off("userDisabled", handleDisable);
    };
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("userOnline", userId);
    }

    return () => {
      if (userId) socket.emit("userOffline", userId);
    };
  }, []);

  useEffect(() => {
    const handleSync = (calls) => {
      setNotifications(
        calls.map((c) => ({
          tableNo: c.tableNo,
          source: c.source,
          message: getCallMessage(c.source),
          handledBy: c.handledBy,
        }))
      );
    };

    socket.on("syncActiveCalls", handleSync);
    return () => socket.off("syncActiveCalls", handleSync);
  }, []);

  useEffect(() => {
    socket.on("waiterCalled", ({ tableNo, source, handledBy }) => {
      setNotifications((prev) => {
        // prevent duplicates
        if (prev.some((n) => n.tableNo === tableNo && n.source === source)) {
          return prev;
        }

        return [
          ...prev,
          {
            tableNo,
            source,
            message: getCallMessage(source),
            handledBy,
          },
        ];
      });
    });

    socket.on("waiterCallHandled", ({ tableNo, source, handledBy }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.tableNo === tableNo && n.source === source ? { ...n, handledBy } : n
        )
      );

      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => !(n.tableNo === tableNo && n.source === source))
        );
      }, 5000);
    });

    return () => {
      socket.off("waiterCalled");
      socket.off("waiterCallHandled");
    };
  }, []);

  /* ===================== */
  /* SEARCH FILTER */
  /* ===================== */
  const filteredOrders = orders.filter((o) =>
    searchTable ? String(o.tableNo).includes(searchTable.trim()) : true
  );

  /* ===================== */
  /* ACTIONS */
  /* ===================== */
  // const markServed = async (order) => {
  //   await fetch(`http://localhost:5000/orders/${order._id}`, {
  //     method: "PUT",
  //     headers: authHeader,
  //     body: JSON.stringify({ status: "served" }),
  //   });

  //   socket.emit("refreshOrders");
  // };

  // const markPaid = async (order) => {
  //   await fetch(`http://localhost:5000/orders/${order._id}`, {
  //     method: "PUT",
  //     headers: authHeader,
  //     body: JSON.stringify({ paid: true }),
  //   });

  //   socket.emit("refreshOrders");
  // };

  const markServed = async (order) => {
    await api(`/orders/${order._id}`, {
      method: "PUT",
      headers: authHeaders,
      body: { status: "served" },
    });

    socket.emit("refreshOrders");
  };

  const markPaid = async (order) => {
    await api(`/orders/${order._id}`, {
      method: "PUT",
      headers: authHeaders,
      body: { paid: true },
    });

    socket.emit("refreshOrders");
  };

  const createOrderForCustomer = () => {
    if (!manualTable) {
      setModal({
        open: true,
        type: "error",
        message: "Please enter a table number.",
      });
      return;
    }

    navigate(`/app/${manualTable}`);
    setManualTable("");
  };

  /* ===================== */
  /* ORDER GROUPS */
  /* ===================== */
  const readyOrders = filteredOrders.filter((o) => o.status === "ready");
  const servedUnpaidOrders = filteredOrders.filter(
    (o) => o.status === "served" && !o.paid
  );

  return (
    <div className="waiter-page">
      <div className="notifications">
        {notifications.map((n) => (
          <div
            key={`${n.tableNo}-${n.source}`}
            className={`notification ${n.source}`}
          >
            <strong>Table {n.tableNo}</strong>

            <p className="notification-message">{n.message}</p>

            {n.handledBy ? (
              <p className="handled">✅ {n.handledBy.name} is handling</p>
            ) : (
              <div className="actions">
                <button
                  onClick={() =>
                    socket.emit("handleWaiterCall", {
                      tableNo: n.tableNo,
                      source: n.source, // 🔥 REQUIRED
                      userId: localStorage.getItem("userId"),
                      name: localStorage.getItem("name"),
                    })
                  }
                >
                  Handle
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {callModal.open && (
        <div className="modal-backdrop">
          <div className="modal info">
            <p>{callModal.message}</p>
            <button
              className="modal-btn"
              onClick={() => setCallModal({ open: false, message: "" })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {disableModal.open && (
        <div className="modal-backdrop">
          <div className="modal danger">
            <p>{disableModal.message}</p>
            <button
              className="modal-btn"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {modal.open && modal.type === "info" && (
        <div className="modal-backdrop">
          <div className="modal info">
            <p>{modal.message}</p>

            <button
              className="modal-btn"
              onClick={() => setModal({ open: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="waiter-header">
        <h2>Waiter Dashboard</h2>
        <LogoutButton />
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="waiter-controls">
        <div className="waiter-search">
          <input
            className="waiter-input"
            placeholder="Search by Table No"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
          />
        </div>

        <div className="waiter-create">
          <h3>Create Order</h3>
          <div className="waiter-create-row">
            <input
              className="waiter-input"
              placeholder="Enter Table No"
              value={manualTable}
              onChange={(e) => setManualTable(e.target.value)}
            />
            <button className="waiter-btn" onClick={createOrderForCustomer}>
              Create
            </button>
          </div>
        </div>
      </div>

      {/* ================= READY ORDERS ================= */}
      <div className="waiter-section">
        <div
          className="waiter-section-header ready"
          onClick={() => setShowReady(!showReady)}
        >
          <span>Ready Orders</span>
          <span className="waiter-badge">{readyOrders.length}</span>
        </div>

        {showReady && (
          <div className="waiter-section-content">
            {readyOrders.map((order) => (
              <OrderCard key={order._id} order={order}>
                <button
                  className="waiter-btn secondary"
                  onClick={() => markServed(order)}
                >
                  Mark Served
                </button>
              </OrderCard>
            ))}
          </div>
        )}
      </div>

      {/* ================= UNPAID ================= */}
      <div className="waiter-section">
        <div
          className="waiter-section-header unpaid"
          onClick={() => setShowUnpaid(!showUnpaid)}
        >
          <span>Served (Unpaid)</span>
          <span className="waiter-badge">{servedUnpaidOrders.length}</span>
        </div>

        {showUnpaid && (
          <div className="waiter-section-content">
            {servedUnpaidOrders.map((order) => (
              <OrderCard key={order._id} order={order}>
                <button
                  className="waiter-btn pay"
                  onClick={() => markPaid(order)}
                >
                  Mark Paid
                </button>
              </OrderCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== */
/* ORDER CARD */
/* ===================== */
// function OrderCard({ order, children, faded }) {
//   return (
//     <div className={`order-card ${faded ? "faded" : ""}`}>
//       <h4 className="order-title">Table {order.tableNo}</h4>

//       <ul className="order-items">
//         {order.items.map((item, i) => (
//           <li key={i}>
//             <span>{item.title}</span>
//             <span>× {item.qty}</span>
//           </li>
//         ))}

//         {order.addOns?.flatMap((addon) =>
//           addon.items.map((item, i) => (
//             <li key={`addon-${i}`} className="order-addon">
//               {item.title} × {item.qty}
//             </li>
//           ))
//         )}
//       </ul>

//       <p className="order-total">
//         <strong>Total:</strong> ₹{order.total}
//       </p>

//       <div className="order-actions">{children}</div>
//     </div>
//   );
// }

function OrderCard({ order, children, faded }) {
  return (
    <div className={`order-card ${faded ? "faded" : ""}`}>
      <h4 className="order-title">Table {order.tableNo}</h4>

      {/* MAIN ITEMS */}
      <ul className="order-items">
        {order.items.map((item, i) => (
          <li key={i} className="order-item">
            <span>{item.title}</span>
            <span>× {item.qty}</span>
          </li>
        ))}
      </ul>

      {/* ADD-ONS (SEPARATE SECTION) */}
      {order.addOns?.length > 0 && (
        <div className="addon-section">
          <p className="addon-title">Add-ons</p>

          <ul className="addon-items">
            {order.addOns.flatMap((addon, ai) =>
              addon.items.map((item, i) => (
                <li key={`addon-${ai}-${i}`} className="addon-item">
                  <span>{item.title}</span>
                  <span>× {item.qty}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <p className="order-total">
        <strong>Total:</strong> ₹{order.total}
      </p>

      <div className="order-actions">{children}</div>
    </div>
  );
}
