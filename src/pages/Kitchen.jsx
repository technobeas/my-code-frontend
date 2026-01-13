import React, { useEffect, useState } from "react";
import socket from "../socket";
import LogoutButton from "../components/LogoutButton";
import "./kitchen.css";
import api from "../api"; // adjust path if needed

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [searchTable, setSearchTable] = useState("");

  const [openSections, setOpenSections] = useState({
    priority: true,
    making: true,
    pending: false,
    ready: false,
  });
  const [callModal, setCallModal] = useState({
    open: false,
    message: "",
  });

  const [disableModal, setDisableModal] = useState({
    open: false,
    message: "",
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    const handleAdminCall = ({ message }) => {
      setCallModal({
        open: true,
        message,
      });
    };

    socket.on("adminCall", handleAdminCall);

    return () => {
      socket.off("adminCall", handleAdminCall);
    };
  }, []);

  useEffect(() => {
    const handleDisable = (id) => {
      if (id === localStorage.getItem("userId")) {
        setDisableModal({
          open: true,
          message:
            "Your account has been disabled. Please contact administration.",
        });
      }
    };

    socket.on("userDisabled", handleDisable);

    return () => {
      socket.off("userDisabled", handleDisable);
    };
  }, []);

  useEffect(() => {
    loadOrders();

    socket.on("refreshOrders", loadOrders);

    return () => {
      socket.off("refreshOrders", loadOrders);
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

  const authHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadOrders = async () => {
    const data = await api("/orders/kitchen", {
      headers: authHeaders,
    });
    setOrders(data);
  };

  // const loadOrders = async () => {
  //   const res = await fetch("http://localhost:5000/orders/kitchen", {
  //     headers: authHeader,
  //   });

  //   const data = await res.json();
  //   setOrders(data);
  // };

  // const updateStatus = async (id, status) => {
  //   const res = await fetch(`http://localhost:5000/orders/${id}/status`, {
  //     method: "PUT",
  //     headers: authHeader,
  //     body: JSON.stringify({ status }),
  //   });

  //   if (!res.ok) {
  //     const data = await res.json();

  //     // 👇 Expected case: someone else already took it
  //     if (res.status === 409) {
  //       alert(data.msg); // or toast/snackbar
  //       return;
  //     }

  //     alert("Failed to update order");
  //     return;
  //   }

  //   // success → backend will emit refreshOrders
  // };

  const updateStatus = async (id, status) => {
    try {
      await api(`/orders/${id}/status`, {
        method: "PUT",
        body: { status },
        headers: authHeaders,
      });
      // backend emits refreshOrders
    } catch (err) {
      alert("Order already taken or failed to update");
    }
  };

  // const togglePriority = async (id, isPriority) => {
  //   await fetch(`http://localhost:5000/orders/${id}/priority`, {
  //     method: "PUT",
  //     headers: authHeader,
  //     body: JSON.stringify({ isPriority }),
  //   });
  // };

  const togglePriority = async (id, isPriority) => {
    await api(`/orders/${id}/priority`, {
      method: "PUT",
      body: { isPriority },
      headers: authHeaders,
    });
  };

  const callWaiter = (tableNo) => {
    socket.emit("callWaiter", {
      tableNo,
      source: "kitchen",
    });
  };

  /* ========================= */
  /* GROUP BY TABLE */
  /* ========================= */

  const grouped = orders.reduce((acc, order) => {
    const key =
      order.status === "ready"
        ? `${order.tableNo}-${order._id}`
        : order.tableNo;

    if (!acc[key]) {
      acc[key] = {
        tableNo: order.tableNo,
        orders: [],
        latestAt: order.createdAt,
      };
    }

    acc[key].orders.push(order);

    if (new Date(order.createdAt) > new Date(acc[key].latestAt)) {
      acc[key].latestAt = order.createdAt;
    }

    return acc;
  }, {});

  const tables = Object.values(grouped)
    .filter((t) =>
      searchTable ? String(t.tableNo).includes(searchTable.trim()) : true
    )
    .sort((a, b) => new Date(b.latestAt) - new Date(a.latestAt));

  /* ========================= */
  /* STATUS LISTS */
  /* ========================= */

  const priorityTables = tables.filter((t) =>
    t.orders.some((o) => o.isPriority && o.status === "pending")
  );

  const pendingTables = tables.filter(
    (t) =>
      t.orders.every((o) => o.status === "pending") &&
      !t.orders.some((o) => o.isPriority)
  );

  const makingTables = tables.filter((t) =>
    t.orders.some((o) => o.status === "making")
  );

  const readyTables = tables.filter((t) =>
    t.orders.some((o) => o.status === "ready")
  );

  return (
    <div className="kitchen-wrapper">
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
            <h3>Account Disabled</h3>
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

      <div className="dashboard-header">
        <h2 className="dashboard-title">🍳 Kitchen Dashboard</h2>

        <div className="dashboard-actions">
          <LogoutButton />

          <input
            className="dashboard-search"
            placeholder="🔍 Search by Table No"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
          />
        </div>

        <div className="dashboard-stats">
          <div className="stat pending">
            Pending
            <span>{pendingTables.length}</span>
          </div>

          <div className="stat making">
            Making
            <span>{makingTables.length}</span>
          </div>

          <div className="stat ready">
            Ready
            <span>{readyTables.length}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div
          className="section-header priority"
          onClick={() => toggleSection("priority")}
        >
          {/* <span>🚨 Priority Orders</span> */}
          <span className="section-title-text">
            <span className="icon priority-icon" /> Priority Orders
          </span>

          <span className="badge">{priorityTables.length}</span>
        </div>

        {openSections.priority && (
          <div className="section-content">
            {priorityTables.map((table) => (
              <TableCard
                // key={`priority-${table.tableNo}`}
                key={`priority-${table.orders[0]._id}`}
                table={table}
                updateStatus={updateStatus}
                togglePriority={togglePriority}
                callWaiter={callWaiter}
              />
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div
          className="section-header making"
          onClick={() => toggleSection("making")}
        >
          {/* <span>🔥 Making Orders</span> */}
          <span className="section-title-text">
            <span className="icon making-icon" /> Making Orders
          </span>

          <span className="badge">{makingTables.length}</span>
        </div>

        {openSections.making && (
          <div className="section-content">
            {makingTables.map((table) => (
              <TableCard
                // key={`making-${table.tableNo}`}
                key={`making-${table.orders[0]._id}`}
                table={table}
                updateStatus={updateStatus}
                togglePriority={togglePriority}
                callWaiter={callWaiter}
              />
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div
          className="section-header pending"
          onClick={() => toggleSection("pending")}
        >
          {/* <span>⏳ Pending Orders</span> */}
          <span className="section-title-text">
            <span className="icon pending-icon" /> Pending Orders
          </span>
          <span className="badge">{pendingTables.length}</span>
        </div>

        {openSections.pending && (
          <div className="section-content">
            {pendingTables.map((table) => (
              <TableCard
                // key={`pending-${table.tableNo}`}
                key={`pending-${table.orders[0]._id}`}
                table={table}
                updateStatus={updateStatus}
                togglePriority={togglePriority}
                callWaiter={callWaiter}
              />
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div
          className="section-header ready"
          onClick={() => toggleSection("ready")}
        >
          {/* <span>✅ Ready Orders</span> */}
          <span className="section-title-text">
            <span className="icon ready-icon" /> Ready Orders
          </span>
          <span className="badge">{readyTables.length}</span>
        </div>

        {openSections.ready && (
          <div className="section-content">
            {readyTables.map((table) => (
              <TableCard
                // key={`ready-${table.tableNo}`}
                key={`ready-${table.orders[0]._id}`}
                table={table}
                updateStatus={updateStatus}
                togglePriority={togglePriority}
                callWaiter={callWaiter}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================= */
/* TABLE CARD */
/* ========================= */

function TableCard({ table, updateStatus, togglePriority, callWaiter }) {
  const orders = table.orders;

  const isPriority = orders.some((o) => o.isPriority);
  const isPending = orders.every((o) => o.status === "pending");
  const isMaking = orders.some((o) => o.status === "making");
  const isReady = orders.some((o) => o.status === "ready");
  const assignedChef = orders[0].assignedChef;

  const isLocked = isReady;

  return (
    <div
      style={{
        border: isPriority ? "2px solid red" : "1px solid #ccc",
        margin: "10px 0",
        padding: "10px",
        borderRadius: "6px",
        background: isLocked ? "#f9f9f9" : "#fff",
      }}
    >
      <h4 className="table-header">
        <div className="table-left">
          <span className="table-icon" />
          <span className="table-text">
            Table <strong>{table.tableNo}</strong>
          </span>
        </div>

        {/* <div className="table-right">
          {isPriority && <span className="chip chip-priority">PRIORITY</span>}
          {isLocked && <span className="chip chip-ready">READY</span>}
        </div> */}

        <div className="table-right">
          {isPriority && <span className="chip chip-priority">PRIORITY</span>}

          {assignedChef && (
            <span className="chip chip-chef">👨‍🍳 {assignedChef.name}</span>
          )}

          {isLocked && <span className="chip chip-ready">READY</span>}
        </div>
      </h4>

      <ul className="items-list">
        {orders.map((order) => (
          <React.Fragment key={order._id}>
            {order.items.map((item, i) => (
              <li key={`item-${i}`} className="item-row">
                <span className="item-name">{item.title}</span>
                <span className="item-qty">×{item.qty}</span>
              </li>
            ))}

            {order.addOns?.flatMap((addon, ai) =>
              addon.items.map((item, ii) => (
                <li key={`addon-${ai}-${ii}`} className="addon-row">
                  <span className="addon-tag">ADD</span>
                  <span className="item-name">{item.title}</span>
                  <span className="item-qty">×{item.qty}</span>
                </li>
              ))
            )}
          </React.Fragment>
        ))}
      </ul>

      {isLocked && <p className="locked-text">Waiting for pickup</p>}

      {/* {!isLocked && isPending && (
        <button onClick={() => updateStatus(orders[0]._id, "making")}>
          Start Making
        </button>
      )} */}

      {!isLocked && isPending && !assignedChef && (
        <button onClick={() => updateStatus(orders[0]._id, "making")}>
          Start Making
        </button>
      )}

      {!isLocked && isMaking && (
        <button onClick={() => updateStatus(orders[0]._id, "ready")}>
          Mark Ready
        </button>
      )}

      {!isLocked && !isPriority && (
        <button onClick={() => togglePriority(orders[0]._id, true)}>
          Mark Priority
        </button>
      )}

      {isReady && (
        <button onClick={() => callWaiter(table.tableNo)}>
          🔔 Call Waiter (Pickup)
        </button>
      )}
    </div>
  );
}
