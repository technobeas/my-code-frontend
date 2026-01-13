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
import AdminLayout from "./pages/Admin/AdminLayout";
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
        {/* 🧑‍🍽 CUSTOMER MENU */}
        <Route path="/app/:tableNo" element={<Menu />} />

        {/* 🔐 LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* 🧑‍🍽 WAITER */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={["waiter"]}>
              <Waiter />
            </ProtectedRoute>
          }
        />

        {/* 🍳 CHEF */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={["chef"]}>
              <Kitchen />
            </ProtectedRoute>
          }
        />

        {/* 🔐 ADMIN (NESTED) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="products" />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="categories" element={<CategoryList />} />
          <Route path="categories/add" element={<AddCategory />} />
          <Route path="orders" element={<LiveOrders />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="tables" element={<TableStatus />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="users/add" element={<AddUser />} />
        </Route>

        {/* 🔁 DEFAULT */}
        <Route path="/" element={<Navigate to="/app/1" />} />
      </Routes>
    </Router>
  );
}

export default App;
