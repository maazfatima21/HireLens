import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
export function ProtectedRoute() { const { isAuthenticated } = useAuth(); return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />; }
export function RoleRoute({ role }: { role: Role }) {
	const { user } = useAuth();
	if (user?.role === role) return <Outlet />;
	const home = user?.role === "ADMIN" ? "/admin" : user?.role === "RECRUITER" ? "/recruiter/dashboard" : "/dashboard";
	return <Navigate to={home} replace />;
}
