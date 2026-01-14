import React, { useEffect, useMemo, useState } from "react";
import "./OrderHistory.css";
import api from "../../../api";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openId, setOpenId] = useState(null);

  /* ===================== */
  /* LOAD HISTORY */
  /* ===================== */
  // useEffect(() => {
  //   fetch("http://localhost:5000/orders/history")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setOrders(data);
  //       setLoading(false);
  //     });
  // }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api("/orders/history");
        setOrders(data);
      } catch (err) {
        console.error("Failed to load order history", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const isFiltering = search || fromDate || toDate;

  /* ===================== */
  /* FILTERED ORDERS */
  /* ===================== */
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);

    return orders.filter((order) => {
      const orderDate = new Date(order.updatedAt);

      /* 🔒 DEFAULT: ONLY LAST 3 DAYS */
      if (!isFiltering && orderDate < threeDaysAgo) {
        return false;
      }

      /* 🔍 EXACT SEARCH */
      if (search) {
        const tableMatch = String(order.tableNo) === search.trim();
        const orderMatch = order._id === search.trim();
        if (!tableMatch && !orderMatch) return false;
      }

      /* 📅 DATE FILTER */
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (orderDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (orderDate > to) return false;
      }

      return true;
    });
  }, [orders, search, fromDate, toDate, isFiltering]);

  /* ===================== */
  /* TOTAL SUMMARY */
  /* ===================== */
  const grandTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  if (loading) return <p>Loading order history...</p>;

  return (
    <div className="order-history">
      <h2>📜 Order History</h2>

      {/* CONTROLS */}
      <div className="controls">
        <input
          placeholder="Exact Table No or Order ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      {/* SUMMARY */}
      {/* <p className="summary">
        <strong>Orders:</strong> {filteredOrders.length} |{" "}
        <strong>Total Revenue:</strong>{" "}
        <span className="order-total">₹{grandTotal}</span>
      </p> */}

      <p className="summary">
        <strong>Orders:</strong> {filteredOrders.length} |{" "}
        <strong>Total Revenue:</strong>{" "}
        <span className="order-total">₹{grandTotal}</span>
        {!isFiltering && <span> (Last 3 days)</span>}
      </p>

      {filteredOrders.length === 0 && (
        <p className="empty">No matching orders</p>
      )}
      <div className="orders-scroll">
        {filteredOrders.map((order) => {
          const open = openId === order._id;

          return (
            <div key={order._id} className="order-card">
              <div
                className="order-header"
                onClick={() => setOpenId(open ? null : order._id)}
              >
                <h4>🪑 Table {order.tableNo}</h4>
                <span className="order-total">₹{order.total}</span>
              </div>

              <p className="order-meta">
                Completed: {new Date(order.updatedAt).toLocaleString()}
              </p>

              {open && (
                <div className="order-details">
                  <ul>
                    {order.items.map((item, i) => (
                      <li key={i}>
                        <span>
                          {item.title} × {item.qty}
                        </span>
                        <span>₹{item.qty * item.price}</span>
                      </li>
                    ))}
                  </ul>

                  {order.addOns?.length > 0 && (
                    <div className="addons">
                      <strong>Add-ons</strong>
                      {order.addOns.map((addon, i) => (
                        <ul key={i}>
                          {addon.items.map((a, j) => (
                            <li key={j}>
                              ➕ {a.title} × {a.qty}
                              <span>₹{a.qty * a.price}</span>
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
