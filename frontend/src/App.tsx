import React, { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "./components/ui/sonner";

import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { BookRoomPage } from "./components/BookRoomPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminLogin } from "./components/admin/AdminLogin";
import { Dashboard } from "./components/Dashboard";
import { Payment } from "./components/Payment";
import { MyReservations } from "./components/Myreservations";
import { MyAccount } from "./components/MyAccount";
import { NotificationsPage } from "./components/NotificationsPage";
import { ContactSupportPage } from "./components/ContactSupportPage";
import { LandingPage } from "./components/LandingPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdminAuth({ children }: { children: ReactNode }) {
  if (!sessionStorage.getItem("adminToken")) return <Navigate to="/admin-login" replace />;
  return children;
}

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.15, ease: EASE } },
};

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/admin-login" element={<PageTransition><AdminLogin /></PageTransition>} />

        <Route
          path="/main"
          element={
            <RequireAuth>
              <PageTransition><Dashboard /></PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <PageTransition><Dashboard /></PageTransition>
            </RequireAuth>
          }
        />

        <Route path="/payment" element={<PageTransition><Payment /></PageTransition>} />

        <Route
          path="/book-room"
          element={
            <RequireAuth>
              <PageTransition><BookRoomPage /></PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/reservations"
          element={
            <RequireAuth>
              <PageTransition><MyReservations /></PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <PageTransition><MyAccount /></PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <PageTransition><AdminDashboard /></PageTransition>
            </RequireAdminAuth>
          }
        />

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <PageTransition><NotificationsPage /></PageTransition>
            </RequireAuth>
          }
        />

        <Route
          path="/contact"
          element={
            <RequireAuth>
              <PageTransition><ContactSupportPage /></PageTransition>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router basename={import.meta.env.VITE_BASE_PATH || "/"}>
      <AnimatedRoutes />
      <Toaster position="bottom-right" richColors closeButton />
    </Router>
  );
}
