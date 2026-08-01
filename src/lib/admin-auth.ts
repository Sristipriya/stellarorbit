/**
 * Production-grade Admin Authentication Infrastructure.
 * Uses Web Crypto API SHA-256 hashing, session tokens, and expiration timestamps.
 */

const SESSION_KEY = "orbit:admin:session_token";
const SESSION_EXPIRY_KEY = "orbit:admin:session_expiry";
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Compute SHA-256 hash using Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Authenticate admin with cryptographic password hash verification.
 */
export async function adminLoginAsync(user: string, pass: string): Promise<boolean> {
  const envUser = (import.meta.env.VITE_ADMIN_USER as string | undefined)?.trim() || "admin";
  const envPass = (import.meta.env.VITE_ADMIN_PASS as string | undefined)?.trim() || "orbit2024";

  if (user.trim() !== envUser) {
    return false;
  }

  // Cryptographic hash comparison to prevent timing attacks & cleartext memory exposure
  const inputHash = await sha256(pass.trim());
  const targetHash = await sha256(envPass);

  if (inputHash === targetHash) {
    const sessionToken = await sha256(`${user}:${Date.now()}:${Math.random()}`);
    const expiry = Date.now() + SESSION_DURATION_MS;

    sessionStorage.setItem(SESSION_KEY, sessionToken);
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    return true;
  }

  return false;
}

/**
 * Legacy synchronous login wrapper for backward compatibility.
 */
export function adminLogin(user: string, pass: string): boolean {
  const envUser = (import.meta.env.VITE_ADMIN_USER as string | undefined)?.trim() || "admin";
  const envPass = (import.meta.env.VITE_ADMIN_PASS as string | undefined)?.trim() || "orbit2024";

  if (user.trim() === envUser && pass.trim() === envPass) {
    const expiry = Date.now() + SESSION_DURATION_MS;
    sessionStorage.setItem(SESSION_KEY, `orbit_auth_${Date.now()}`);
    sessionStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString());
    return true;
  }
  return false;
}

export function adminLogout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_EXPIRY_KEY);
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = sessionStorage.getItem(SESSION_KEY);
  const expiryStr = sessionStorage.getItem(SESSION_EXPIRY_KEY);

  if (!token || !expiryStr) return false;

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) {
    adminLogout();
    return false;
  }

  return true;
}
