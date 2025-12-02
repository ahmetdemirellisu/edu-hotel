import React, { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { MainPage } from "./components/MainPage";
import { BookRoomPage } from "./components/BookRoomPage";
import { AdminDashboard } from "./components/AdminDashboard";

// 🔒 Auth wrapper
function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* User pages */}
        <Route
          path="/main"
          element={
            <RequireAuth>
              <MainPage />
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

        {/* ADMIN PAGE (NEW ✔✔✔) */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
