/**
 * authApi.js — Axios API calls for auth endpoints
 *
 * WHY axios (not fetch):
 *   - Automatic JSON parsing
 *   - Request/response interceptors (we use a response interceptor to handle
 *     401s globally — redirect to login without each component handling it)
 *   - Consistent error shape regardless of response format
 *
 * The axios instance is shared: base URL is relative (proxied by Vite in dev,
 * served from same origin in production via NGINX).
 */

import axios from 'axios';
import { useAuthStore } from './authStore';

// ── Axios instance ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,    // Include httpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Response interceptor: handle 401 globally ────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local auth state and let ProtectedRoute redirect to login
      useAuthStore.getState().clearUser();
    }
    return Promise.reject(error);
  },
);

// ── Auth API functions ───────────────────────────────────────────────────────

export const authApi = {
  /**
   * Register a candidate account (public)
   */
  registerCandidate: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  /**
   * Login — sets httpOnly cookie server-side
   */
  login: async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  /**
   * Logout — clears httpOnly cookie server-side
   */
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  /**
   * Get current authenticated user — used on app startup to restore session
   */
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
