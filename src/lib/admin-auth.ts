/**
 * Admin authentication — credential check against env vars ONLY.
 * Session persisted in sessionStorage (cleared on tab close).
 *
 * Set VITE_ADMIN_USER and VITE_ADMIN_PASS in your .env file.
 * Never commit those values to source control.
 */

const SESSION_KEY = "orbit:admin:session";

export function adminLogin(user: string, pass: string): boolean {
  const envUser = (import.meta.env.VITE_ADMIN_USER as string | undefined)?.trim();
  const envPass = (import.meta.env.VITE_ADMIN_PASS as string | undefined)?.trim();

  // If env vars are not configured, deny access entirely in production.
  if (!envUser || !envPass) {
    console.error(
      "[Orbit Admin] VITE_ADMIN_USER or VITE_ADMIN_PASS is not set. " +
        "Set them in your .env file and redeploy.",
    );
    return false;
  }

  if (user === envUser && pass === envPass) {
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function adminLogout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
