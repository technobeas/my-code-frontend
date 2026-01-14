import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import LogoutButton from "../../components/LogoutButton";
import "./AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <h2 className="admin-title">Admin Dashboard</h2>

      <ul className="admin-nav">
        <li>
          <NavLink to="products">Products</NavLink>
        </li>
        <li>
          <NavLink to="products/add">Add Product</NavLink>
        </li>

        <li>
          <NavLink to="categories">Categories</NavLink>
        </li>
        <li>
          <NavLink to="categories/add">Add Category</NavLink>
        </li>

        <li>
          <NavLink to="orders">Live Orders</NavLink>
        </li>
        <li>
          <NavLink to="history">Order History</NavLink>
        </li>

        <li>
          <NavLink to="tables">Tables</NavLink>
        </li>

        <li>
          <NavLink to="users">Users</NavLink>
        </li>
        <li>
          <NavLink to="users/add">Add User</NavLink>
        </li>
      </ul>

      <div className="admin-logout">
        <LogoutButton />
      </div>

      <hr className="admin-divider" />

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
