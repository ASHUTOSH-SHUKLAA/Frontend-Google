import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/components/auth-provider";

export function AuthGuard({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "admin" | "user" }) {
  const { user, role, loading, configError, authError, accessToken } = useAuth();
  const location = useLocation();

  if (configError) return <div className="auth-message"><b>Firebase setup required</b><p>{configError}</p></div>;
  if (loading) return <div className="auth-message">Checking your access…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (authError || !accessToken) return <div className="auth-message"><b>Secure session unavailable</b><p>{authError ?? "Sign out and sign in again to refresh your session."}</p></div>;
  if (requiredRole === "admin" && role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
