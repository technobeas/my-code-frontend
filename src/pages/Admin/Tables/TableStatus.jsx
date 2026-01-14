import React, { useEffect, useState } from "react";
import socket from "../../../socket";
import "./TableStatus.css";
import api from "../../../api";

export default function TableStatus() {
  const [orders, setOrders] = useState([]);
  const [searchTable, setSearchTable] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 5;

  const [modal, setModal] = useState({
    open: false,
    type: null, // "paid" | "close"
    orderId: null,
  });

  /* ===================== */
  /* LOAD ORDERS */
  /* ===================== */
  const load = async () => {
    try {
      const data = await api("/orders");
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  };

  /* ===================== */
  /* INITIAL + SOCKET */
  /* ===================== */
  useEffect(() => {
    load();
    socket.on("refreshOrders", load);

    return () => socket.off("refreshOrders", load);
  }, []);

  /* ===================== */
  /* FILTER VALID ORDERS */
  /* ===================== */
  const validOrders = orders.filter((order) => {
    if (order.status === "served" && order.paid) return false;

    if (
      order.items.length === 0 &&
      (!order.addOns || order.addOns.length === 0)
    ) {
      return false;
    }

    if (searchTable) {
      return String(order.tableNo).includes(searchTable.trim());
    }

    return true;
  });

  /* ===================== */
  /* SORT */
  /* ===================== */
  const sortedOrders = [...validOrders].sort((a, b) => {
    if (a.tableNo !== b.tableNo) return a.tableNo - b.tableNo;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  /* ===================== */
  /* PAGINATION */
  /* ===================== */
  const totalPages = Math.ceil(sortedOrders.length / limit);
  const paginatedOrders = sortedOrders.slice((page - 1) * limit, page * limit);

  /* ===================== */
  /* ACTIONS */
  /* ===================== */
  const markPaid = async (orderId) => {
    await api(`/orders/${orderId}`, {
      method: "PUT",
      body: { paid: true },
    });

    socket.emit("refreshOrders");
  };

  const freeTable = async (orderId) => {
    await api(`/orders/${orderId}`, {
      method: "PUT",
      body: { status: "served", paid: true },
    });

    socket.emit("refreshOrders");
  };

  const getStatusUI = (order) => {
    if (order.status === "ready") return { label: "Ready" };
    if (order.status === "making") return { label: "Making" };
    if (order.status === "pending") return { label: "Pending" };
    if (order.status === "served" && !order.paid)
      return { label: "Awaiting Payment" };

    return { label: order.status };
  };

  /* ===================== */
  /* UI */
  /* ===================== */
  return (
    <div className="table-manager">
      <h2>🪑 Table Manager (Admin)</h2>

      <input
        className="table-search"
        placeholder="🔍 Search Table No"
        value={searchTable}
        onChange={(e) => {
          setSearchTable(e.target.value);
          setPage(1);
        }}
      />

      {sortedOrders.length === 0 && (
        <p className="table-empty">✅ All tables are free</p>
      )}

      {paginatedOrders.map((order) => {
        const status = getStatusUI(order);
        const isExpanded = expanded === order._id;

        return (
          <div key={order._id} className="table-card">
            <div
              className="table-header clickable"
              onClick={() => setExpanded(isExpanded ? null : order._id)}
            >
              <h3>🪑 Table {order.tableNo}</h3>

              <div className="header-right">
                <span
                  className={`status-badge status-${status.label
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {status.label}
                </span>

                {order.assignedChef && (
                  <span className="chef-chip">
                    👨‍🍳 {order.assignedChef.name}
                  </span>
                )}
              </div>
            </div>

            {isExpanded && (
              <>
                <ul className="order-items">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.title} × {item.qty}
                      <span>₹{item.qty * item.price}</span>
                    </li>
                  ))}

                  {order.addOns?.flatMap((addon, i) =>
                    addon.items.map((item, j) => (
                      <li key={`${i}-${j}`} className="addon">
                        {item.title} × {item.qty}
                        <span>₹{item.qty * item.price}</span>
                      </li>
                    ))
                  )}
                </ul>

                <p className="order-total">
                  <strong>Total:</strong> ₹{order.total}
                </p>

                <div className="table-actions">
                  {order.status === "served" && !order.paid && (
                    <button
                      className="table-btn btn-paid"
                      onClick={() =>
                        setModal({
                          open: true,
                          type: "paid",
                          orderId: order._id,
                        })
                      }
                    >
                      💰 Mark Paid
                    </button>
                  )}

                  {order.status === "pending" && (
                    <button
                      className="table-btn btn-close"
                      onClick={() =>
                        setModal({
                          open: true,
                          type: "close",
                          orderId: order._id,
                        })
                      }
                    >
                      🆓 Close Order
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn ${page === p ? "primary" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className="btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL */}
      {modal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>
              {modal.type === "paid"
                ? "Mark order as paid?"
                : "Close this order?"}
            </h3>

            <p>This action cannot be undone.</p>

            <div className="modal-actions">
              <button
                className="table-btn btn-close"
                onClick={async () => {
                  if (modal.type === "paid") {
                    await markPaid(modal.orderId);
                  } else {
                    await freeTable(modal.orderId);
                  }
                  setModal({ open: false });
                }}
              >
                Confirm
              </button>

              <button
                className="table-btn"
                onClick={() => setModal({ open: false })}
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
