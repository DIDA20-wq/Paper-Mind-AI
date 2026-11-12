import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/authService';
import api from '../services/api';

describe('Frontend Authentication & Security Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('authService Local Storage & Token Management', () => {
    it('returns false for isAuthenticated when no token is present', () => {
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getStoredUser()).toBeNull();
    });

    it('returns true for isAuthenticated and returns user when token exists', () => {
      const mockUser = { id: 'u-123', email: 'researcher@papermind.ai', full_name: 'Dr. Vance' };
      localStorage.setItem('papermind_token', 'valid-jwt-token-xyz');
      localStorage.setItem('papermind_user', JSON.stringify(mockUser));

      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getStoredUser()).toEqual(mockUser);
    });

    it('logout() safely purges all credentials from localStorage', () => {
      localStorage.setItem('papermind_token', 'test-token');
      localStorage.setItem('papermind_user', JSON.stringify({ email: 'test@univ.edu' }));

      authService.logout();

      expect(localStorage.getItem('papermind_token')).toBeNull();
      expect(localStorage.getItem('papermind_user')).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('getStoredUser() gracefully handles corrupted JSON in localStorage', () => {
      localStorage.setItem('papermind_user', 'invalid-corrupt-json{');
      expect(authService.getStoredUser()).toBeNull();
    });
  });

  describe('Axios Security Interceptors', () => {
    it('automatically attaches Authorization Bearer header when token is stored', async () => {
      localStorage.setItem('papermind_token', 'secure-bearer-token-123');
      
      const config = { headers: {} };
      // Invoke request interceptor handlers
      const requestInterceptor = api.interceptors.request.handlers[0];
      const updatedConfig = await requestInterceptor.fulfilled(config);

      expect(updatedConfig.headers.Authorization).toBe('Bearer secure-bearer-token-123');
    });

    it('does not attach Authorization header when no token is stored', async () => {
      const config = { headers: {} };
      const requestInterceptor = api.interceptors.request.handlers[0];
      const updatedConfig = await requestInterceptor.fulfilled(config);

      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('clears localStorage upon 401 Unauthorized responses from protected routes', async () => {
      localStorage.setItem('papermind_token', 'expired-token');
      localStorage.setItem('papermind_user', JSON.stringify({ id: '1' }));

      const responseInterceptor = api.interceptors.response.handlers[0];
      const mockError = {
        config: { url: '/documents' },
        response: { status: 401 }
      };

      try {
        await responseInterceptor.rejected(mockError);
      } catch (err) {
        expect(err).toBe(mockError);
      }

      expect(localStorage.getItem('papermind_token')).toBeNull();
      expect(localStorage.getItem('papermind_user')).toBeNull();
    });
  });
});
