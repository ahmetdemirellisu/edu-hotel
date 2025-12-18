import React, { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { BookRoomPage } from "./components/BookRoomPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Dashboard } from "./components/Dashboard"; // ✅ add this

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/main"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* ✅ Now shows the actual Dashboard component */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/book-room"
          element={
            <RequireAuth>
              <BookRoomPage />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}