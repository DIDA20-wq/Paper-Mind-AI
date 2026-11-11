import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login/json', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('papermind_token', response.data.access_token);
      localStorage.setItem('papermind_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(email, password, fullName) {
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('papermind_token');
    localStorage.removeItem('papermind_user');
  },

  getStoredUser() {
    const userStr = localStorage.getItem('papermind_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('papermind_token');
  }
};
