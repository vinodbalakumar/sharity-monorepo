import { httpClient } from './httpClient.js';
import { tokenStore } from './tokenStore.js';

export const authService = {
  register: async (payload) => (await httpClient.post('/authorization-server/api/v1/auth/register', payload)).data,
  async login(credentials) {
    const { data } = await httpClient.post('/authorization-server/api/v1/auth/login', {
      ...credentials,
      deviceName: credentials.deviceName || navigator.userAgent.slice(0, 140),
    });
    tokenStore.setTokens(data);
    return data;
  },
  async logout() {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await httpClient.post('/authorization-server/api/v1/auth/logout', { refreshToken });
      }
    } finally {
      tokenStore.clear();
    }
  },
  me: async () => (await httpClient.get('/authorization-server/api/v1/users/me')).data,
  updateProfile: async (payload) => (await httpClient.put('/authorization-server/api/v1/users/me/profile', payload)).data,
  changePassword: async (payload) => (await httpClient.put('/authorization-server/api/v1/users/me/password', payload)).data,
  sessions: async () => (await httpClient.get('/authorization-server/api/v1/users/me/sessions')).data,
  revokeSession: async (id) => (await httpClient.delete(`/authorization-server/api/v1/users/me/sessions/${id}`)).data,
  revokeAllSessions: async () => (await httpClient.delete('/authorization-server/api/v1/users/me/sessions')).data,
};
