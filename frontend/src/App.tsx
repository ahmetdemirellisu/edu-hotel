import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { MainPage } from "./components/MainPage";

// Simple auth guard using localStorage token
function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // not logged in → send to login
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Main page after login */}
        <Route
          path="/main"
          element={
            <RequireAuth>
              <MainPage />
            </RequireAuth>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
