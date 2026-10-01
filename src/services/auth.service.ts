import { get, post } from './api';
import type { AdminProfile, LoginChallenge } from '@/types';

export function login(input: { email: string; password: string }) {
  return post<LoginChallenge>('/api/admin/auth/login', input);
}

export function verifyOtp(input: { challengeId: string; code: string }) {
  return post<{ admin: AdminProfile }>('/api/admin/auth/verify-otp', input);
}

export function logout() {
  return post<null>('/api/admin/auth/logout');
}

export function getMe() {
  return get<AdminProfile>('/api/admin/auth/me');
}
