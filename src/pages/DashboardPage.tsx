import { Link } from "react-router";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/components/auth-provider";

function UserWorkspace() {
  const { user, role, signOutUser } = useAuth();
  return <main className="workspace-page"><header className="workspace-nav"><Link className="brand" to="/"><span className="brand-mark">M</span> morrow<span className="brand-suffix">/studio</span></Link><button className="quiet-button" onClick={() => signOutUser()}>Sign out</button></header><section className="workspace-content"><div className="auth-kicker">YOUR WORKSPACE · {role?.toUpperCase()}</div><h1>Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : " back"}.</h1><p>You’re signed in to Morrow Studio. Project tools and updates will live here.</p><div className="workspace-panel"><span className="workspace-icon">✳</span><div><b>Your project space is ready</b><p>We’ll keep your briefs, project updates, and conversations together here.</p></div></div></section></main>;
}

export default function DashboardPage() {
  return <AuthGuard><UserWorkspace /></AuthGuard>;
}
