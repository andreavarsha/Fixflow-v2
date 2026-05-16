import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Login from "./pages/Login";
import Signup from "./pages/SignUp.tsx";
import OwnerDashboard from "./pages/owner/Dashboard.tsx";
import SupplierDashboard from "./pages/supplier/Dashboard.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import RolePicker from "./pages/RolePicker";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <>
            <AuthLoading><div className="p-8">Loading...</div></AuthLoading>
            <Authenticated><RolePicker /></Authenticated>
            <Unauthenticated><Navigate to="/login" /></Unauthenticated>
          </>
        }
      />

      <Route path="/owner/dashboard" element={<Authenticated><OwnerDashboard /></Authenticated>} />
      <Route path="/supplier/dashboard" element={<Authenticated><SupplierDashboard /></Authenticated>} />
      <Route path="/admin/dashboard" element={<Authenticated><AdminDashboard /></Authenticated>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
