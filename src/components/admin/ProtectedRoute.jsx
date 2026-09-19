import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Layout-route gate: renders the nested admin routes only when logged in.
export default function ProtectedRoute() {
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}