/**
 * Access-token storage for cross-domain deployments.
 *
 * On same-domain deployments (production with vickkyaku.com), the backend
 * sets an httpOnly cookie and this file is unused.
 *
 * On cross-domain deployments (sslip.io testing), we store the JWT in
 * localStorage and send it via Authorization: Bearer <token>.
 *
 * The backend accepts BOTH — cookie OR Authorization header.
 */

const TOKEN_KEY = 'qrcb_access_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
