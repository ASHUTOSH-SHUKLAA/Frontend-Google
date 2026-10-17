import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";
import { fetchAdminOverview } from "@/lib/auth-api";

function AdminWorkspace() {
  const { accessToken, signOutUser } = useAuth();
  const [status, setStatus] = useState("Verifying your administrator access…");
  useEffect(() => { if (accessToken) fetchAdminOverview(accessToken).then((data) => setStatus(data.message)).catch((error: Error) => setStatus(error.message)); }, [accessToken]);
  return <main className="workspace-page"><header className="workspace-nav"><Link className="brand" to="/"><span className="brand-mark">M</span> morrow<span className="brand-suffix">/studio</span></Link><button className="quiet-button" onClick={() => signOutUser()}>Sign out</button></header><section className="workspace-content"><div className="auth-kicker">MORROW STUDIO · ADMIN CONSOLE</div><h1>Studio overview.</h1><p>Administrator tools are restricted to accounts with the server-assigned admin role.</p><div className="workspace-panel"><span className="workspace-icon">✓</span><div><b>Access check</b><p>{status}</p></div></div><div className="workspace-footnote">This page is protected in the UI and the API. The API verifies your Firebase ID token and admin custom claim.</div></section></main>;
}

export default function AdminPage() {
  return <AuthGuard requiredRole="admin"><AdminWorkspace /></AuthGuard>;
}
