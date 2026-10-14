import { get, post } from './api';
import { getStoredRefreshToken } from '@/utils/authStorage';
import type { AdminProfile, LoginChallenge } from '@/types';

export interface AdminSessionResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

export function login(input: { email: string; password: string }) {
  return post<LoginChallenge>('/api/admin/auth/login', input);
}

export function verifyOtp(input: { challengeId: string; code: string }) {
  return post<AdminSessionResponse>('/api/admin/auth/verify-otp', input);
}

/** Manually refresh the session — normally the axios interceptor does this on 401. */
export function refresh() {
  const refreshToken = getStoredRefreshToken();
  return post<AdminSessionResponse>('/api/admin/auth/refresh', { refreshToken });
}

export function logout() {
  const refreshToken = getStoredRefreshToken();
  return post<null>('/api/admin/auth/logout', { refreshToken });
}

export function getMe() {
  return get<AdminProfile>('/api/admin/auth/me');
}