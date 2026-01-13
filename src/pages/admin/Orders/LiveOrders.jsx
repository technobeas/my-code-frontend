import React, { useEffect, useState } from "react";
import socket from "../../../socket";
import "./LiveOrders.css";
import api from "../../../api";

export default function LiveOrders() {
  const [orders, setOrders] = useState([]);
  const [openId, setOpenId] = useState(null);

  // const load = async () => {
  //   const res = await fetch("http://localhost:5000/orders");
  //   setOrders(await res.json());
  // };

  const load = async () => {
    try {
      const data = await api("/orders");
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  };

  useEffect(() => {
    load();
    socket.on("refreshOrders", load);
    return () => socket.off("refreshOrders");
  }, []);

  return (
    <div className="order-history">
      <h2>🔥 Live Orders</h2>

      {orders.length === 0 && <p className="empty">No live orders right now</p>}

      {orders.map((order) => {
        const open = openId === order._id;

        return (
          <div key={order._id} className="order-card">
            {/* HEADER */}
            <div
              className="order-header"
              onClick={() => setOpenId(open ? null : order._id)}
            >
              <h4>🪑 Table {order.tableNo}</h4>

              {/* <div className="header-right">
                <span className={`status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
                <span className="order-total">₹{order.total}</span>
              </div> */}

              <div className="header-right">
                <span className={`status ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>

                {order.assignedChef && (
                  <span className="chef-chip">
                    👨‍🍳 {order.assignedChef.name}
                  </span>
                )}

                <span className="order-total">₹{order.total}</span>
              </div>
            </div>

            {/* META */}
            <p className="order-meta">
              Order #{order._id.slice(-6)} •{" "}
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>

            {/* DETAILS */}
            {open && (
              <div className="order-details">
                {/* ITEMS */}
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

                {/* ADD-ONS */}
                {order.addOns?.length > 0 && (
                  <div className="addons">
                    <strong>Add-ons</strong>

                    {order.addOns.map((addon, i) => (
                      <ul key={i}>
                        {addon.items.map((a, j) => (
                          <li key={j}>
                            <span>
                              {a.title} × {a.qty}
                            </span>
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
  );
}
