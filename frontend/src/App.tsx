import React, { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { BookRoomPage } from "./components/BookRoomPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Dashboard } from "./components/Dashboard"; 
import { Payment } from "./components/Payment";
import { MyReservations } from "./components/Myreservations";

import { MyAccount } from "./components/MyAccount";
import { NotificationsPage } from "./components/NotificationsPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router basename="/ehp">
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
        <Route path="/payment" element={<Payment />} />

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
          path="/reservations"
          element={
            <RequireAuth>
              <MyReservations />
            </RequireAuth>
          }
        />

        {/* 2. Add the Profile Route */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <MyAccount />
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

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationsPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
