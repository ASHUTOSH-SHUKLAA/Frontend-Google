const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type AppRole = "admin" | "user";
export type AppSession = {
  accessToken: string;
  expiresIn: number;
  user: { uid: string; email: string | null; name: string | null; role: AppRole };
};

export async function exchangeFirebaseToken(firebaseToken: string): Promise<AppSession> {
  const response = await fetch(`${API_URL}/api/auth/token`, {
    method: "POST",
    headers: { Authorization: `Bearer ${firebaseToken}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "Could not create an app session.");
  return result as AppSession;
}

export async function fetchAdminOverview(accessToken: string) {
  const response = await fetch(`${API_URL}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "Could not load admin data.");
  return result as { message: string; access: string };
}
