import React, { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { MainPage } from "./components/MainPage";
import { BookRoomPage } from "./components/BookRoomPage"; // renamed

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Main dashboard */}
        <Route
          path="/main"
          element={
            <RequireAuth>
              <MainPage />
            </RequireAuth>
          }
        />

        {/* Book a Room page */}
        <Route
          path="/book-room"
          element={
            <RequireAuth>
              <BookRoomPage />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
