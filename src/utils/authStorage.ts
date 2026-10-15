const ACCESS_KEY = 'qrcb_access_token';
const REFRESH_KEY = 'qrcb_refresh_token';

export function getStoredToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
}
export function setStoredToken(token: string): void {
  try { localStorage.setItem(ACCESS_KEY, token); } catch {}
}
export function clearStoredToken(): void {
  try { localStorage.removeItem(ACCESS_KEY); } catch {}
}

export function getStoredRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setStoredRefreshToken(token: string): void {
  try { localStorage.setItem(REFRESH_KEY, token); } catch {}
}
export function clearStoredRefreshToken(): void {
  try { localStorage.removeItem(REFRESH_KEY); } catch {}
}

export function clearAllStoredTokens(): void {
  clearStoredToken();
  clearStoredRefreshToken();
}
