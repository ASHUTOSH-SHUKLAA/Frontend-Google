import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { createUserWithEmailAndPassword, getRedirectResult, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, type Auth } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";

type RedirectState = { from?: { pathname?: string } };
type EmailMode = "signin" | "signup";

function describeSignInError(cause: unknown) {
  const code = (cause as { code?: string })?.code;
  switch (code) {
    case "auth/unauthorized-domain":
      return "This website address is not authorized in Firebase. In Firebase Console, open Authentication → Settings → Authorized domains and add localhost (or the deployed domain).";
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled for this Firebase project. In Firebase Console, open Authentication → Sign-in method and enable it.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Sign in instead, or use password reset if needed.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect. Check your details or reset your password.";
    case "auth/user-disabled":
      return "This account is disabled. Contact your workspace administrator.";
    case "auth/too-many-requests":
      return "Too many attempts were made. Wait a while, then try again.";
    case "auth/invalid-api-key":
      return "The Firebase API key in Frontend/.env.local is invalid. Copy the Web app config from the same Firebase project and restart the frontend.";
    case "auth/network-request-failed":
      return "Firebase could not be reached. Check your internet connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The Google sign-in window was closed before sign-in finished. Try again and complete the Google prompt.";
    default:
      return cause instanceof Error ? cause.message : "Google sign-in failed. Please try again.";
  }
}

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { configError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = (location.state as RedirectState | null)?.from?.pathname
    ?? new URLSearchParams(location.search).get("next");
  const returnPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard";

  useEffect(() => {
    if (configError) return;
    let auth: Auth;
    try { auth = getFirebaseAuth(); } catch { return; }
    getRedirectResult(auth).then((result) => {
      if (!result) return;
      const storedPath = sessionStorage.getItem("morrow-post-auth-path");
      sessionStorage.removeItem("morrow-post-auth-path");
      navigate(storedPath?.startsWith("/") && !storedPath.startsWith("//") ? storedPath : returnPath, { replace: true });
    }).catch((cause: unknown) => setError(describeSignInError(cause)));
  }, [configError, navigate, returnPath]);

  async function login() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      navigate(returnPath, { replace: true });
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      if (code === "auth/popup-blocked") {
        try {
          sessionStorage.setItem("morrow-post-auth-path", returnPath);
          await signInWithRedirect(getFirebaseAuth(), new GoogleAuthProvider());
          return;
        } catch { /* Show the redirect error below. */ }
      }
      setError(describeSignInError(cause));
      setBusy(false);
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const auth = getFirebaseAuth();
      if (emailMode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      navigate(returnPath, { replace: true });
    } catch (cause) {
      setError(describeSignInError(cause));
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Enter your email address above, then choose Forgot password.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setNotice("If an account uses that email, Firebase will send a password reset link shortly.");
      setBusy(false);
    } catch (cause) {
      setError(describeSignInError(cause));
      setBusy(false);
    }
  }

  function switchEmailMode(mode: EmailMode) {
    setEmailMode(mode);
    setError("");
    setNotice("");
  }

  return (
    <main className="auth-page">
      <Link className="brand" to="/"><span className="brand-mark">M</span> morrow<span className="brand-suffix">/studio</span></Link>
      <section className="auth-card">
        <div className="auth-kicker">YOUR NEXT CHAPTER STARTS HERE</div>
        <h1>Good work starts<br /><em>with a hello.</em></h1>
        <p>Sign in to your Morrow workspace to manage projects and stay close to the work.</p>
        <button className="google-button" type="button" onClick={login} disabled={busy || Boolean(configError)}><span className="google-g">G</span>{busy ? "Connecting…" : "Continue with Google"}<span aria-hidden="true">→</span></button>
        <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>
        <form className="auth-form" onSubmit={submitEmail}>
          <label className="auth-field"><span>Email address</span><input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required disabled={busy || Boolean(configError)} /></label>
          <label className="auth-field"><span>Password</span><input type="password" name="password" autoComplete={emailMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={emailMode === "signup" ? "At least 6 characters" : "Enter your password"} minLength={6} required disabled={busy || Boolean(configError)} /></label>
          {emailMode === "signin" && <button className="auth-text-button auth-forgot" type="button" onClick={resetPassword} disabled={busy || Boolean(configError)}>Forgot password?</button>}
          <button className="auth-submit" type="submit" disabled={busy || Boolean(configError)}>{busy ? "Please wait…" : emailMode === "signup" ? "Create account" : "Sign in with email"}<span aria-hidden="true">→</span></button>
        </form>
        <div className="auth-switch">{emailMode === "signup" ? "Already have an account?" : "New to Morrow?"}<button className="auth-text-button" type="button" onClick={() => switchEmailMode(emailMode === "signup" ? "signin" : "signup")} disabled={busy}>{emailMode === "signup" ? "Sign in" : "Create an account"}</button></div>
        {configError && <div className="auth-error">{configError}</div>}
        {error && <div className="auth-error">{error}</div>}
        {notice && <div className="auth-success" role="status">{notice}</div>}
        <div className="auth-note">Access is managed by your workspace administrator.</div>
      </section>
      <Link className="auth-back" to="/">← Back to home</Link>
    </main>
  );
}
