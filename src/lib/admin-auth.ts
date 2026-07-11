/**
 * Admin authentication — simple credential check against env vars.
 * Session persisted in sessionStorage (cleared on tab close).
 * Suitable for a Testnet demo. For Mainnet, use a proper auth backend.
 */

const SESSION_KEY = "orbit:admin:session";

export function adminLogin(user: string, pass: string): boolean {
  const envUser = (import.meta.env.VITE_ADMIN_USER as string | undefined) ?? "admin";
  const envPass = (import.meta.env.VITE_ADMIN_PASS as string | undefined) ?? "orbit2024";
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
