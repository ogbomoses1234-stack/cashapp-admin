import { getStoredToken, setStoredToken } from '@/utils/authStorage';



// 1. Attach stored token to every outgoing request
// 2. Auto-save any accessToken returned by the API
import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiErrorBody } from '@/types';

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ═══════════════════════════════════════════════════════════
// JWT handling for cross-domain deployments
// (sslip.io testing; will use httpOnly cookies when we move
// to vickkyaku.com in production.)
// ═══════════════════════════════════════════════════════════

// 1. Attach stored token to every outgoing request
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Auto-save any accessToken the API returns
api.interceptors.response.use((response) => {
  const payload: any = response?.data;
  const token =
    payload?.data?.accessToken ??
    payload?.accessToken ??
    payload?.data?.data?.accessToken;
  if (typeof token === 'string' && token.length > 30) {
    setStoredToken(token);
  }
  return response;
});


/* ─── 401 handler ──────────────────────────────────────────── */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

/* ─── Response interceptor ─────────────────────────────────── */
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) onUnauthorized?.();

      const code = data?.error?.code ?? 'UNKNOWN_ERROR';
      const message = data?.error?.message ?? defaultMessage(status);
      throw new ApiClientError(code, message, status, data?.error?.details);
    }

    if (error.code === 'ECONNABORTED') {
      throw new ApiClientError('TIMEOUT', 'Request timed out', 0);
    }
    throw new ApiClientError('NETWORK_ERROR', 'Cannot reach the server', 0);
  }
);

function defaultMessage(status: number): string {
  if (status === 400) return 'Invalid request';
  if (status === 401) return 'Session expired — please log in again';
  if (status === 403) return 'You do not have permission';
  if (status === 404) return 'Not found';
  if (status === 409) return 'Conflict';
  if (status === 429) return 'Too many requests — slow down';
  if (status >= 500) return 'Server error — please try again';
  return 'Something went wrong';
}

/* ─── Helpers ──────────────────────────────────────────────── */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get(url, { params });
  return res.data?.data as T;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post(url, body);
  return res.data?.data as T;
}
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch(url, body);
  return res.data?.data as T;
}
export async function del<T>(url: string): Promise<T> {
  const res = await api.delete(url);
  return res.data?.data as T;
}


