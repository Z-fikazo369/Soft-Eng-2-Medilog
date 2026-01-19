// File: components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "admin";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. ✅ HABANG NAGLO-LOAD: Magpakita ng Spinner
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // 2. KUNG TAPOS NA MAG-LOAD at HINDI naka-login: Redirect sa Login
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. CHECK ROLE: Kung mali ang role, redirect sa tamang dashboard
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user?.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // 4. Kung okay lahat, i-render ang page
  return <>{children}</>;
};

export default ProtectedRoute;
