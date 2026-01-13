import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* 🌍 PUBLIC */
import Menu from "./pages/Menu";
import Login from "./pages/Login";

/* 🧑‍🍽 WAITER */
import Waiter from "./pages/Waiter";

/* 🍳 CHEF */
import Kitchen from "./pages/Kitchen";

/* 🔐 ADMIN */
import AdminDashboard from "./pages/Admin/Dashboard";
import ProductList from "./pages/Admin/Products/ProductList";
import AddProduct from "./pages/Admin/Products/AddProduct";
import CategoryList from "./pages/Admin/Categories/CategoryList";
import AddCategory from "./pages/Admin/Categories/AddCategory";
import LiveOrders from "./pages/Admin/Orders/LiveOrders";
import OrderHistory from "./pages/Admin/Orders/OrderHistory";
import TableStatus from "./pages/Admin/Tables/TableStatus";
import ManageUsers from "./pages/Admin/Users/ManageUsers";
import AddUser from "./pages/Admin/Users/AddUser";

/* 🔐 ROUTE GUARD */
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🧑‍🍽 CUSTOMER MENU (QR) */}
        <Route path="/app/:tableNo" element={<Menu />} />

        {/* 🔐 LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* 🧑‍🍽 WAITER (WAITER + ADMIN) */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={["waiter"]}>
              <Waiter />
            </ProtectedRoute>
          }
        />

        {/* 🍳 KITCHEN (CHEF + ADMIN) */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={["chef"]}>
              <Kitchen />
            </ProtectedRoute>
          }
        />

        {/* 🔐 ADMIN ONLY */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ProductList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddProduct />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CategoryList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/categories/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddCategory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <LiveOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/history"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <OrderHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TableStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddUser />
            </ProtectedRoute>
          }
        />

        {/* 🔁 DEFAULT */}
        <Route path="/" element={<Navigate to="/app/1" />} />
      </Routes>
    </Router>
  );
}

export default App;
