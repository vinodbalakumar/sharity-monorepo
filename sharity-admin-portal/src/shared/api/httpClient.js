import axios from 'axios';
import { tokenStore } from './tokenStore.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshRequest = null;

httpClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status !== 401 || original?._retry || original?.url?.includes('/authorization-server/api/v1/auth/refresh-token')) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(error);
    }

    refreshRequest ??= axios
      .post(`${API_BASE_URL}/authorization-server/api/v1/auth/refresh-token`, {
        refreshToken,
        deviceName: navigator.userAgent.slice(0, 140),
      })
      .then((res) => {
        tokenStore.setTokens(res.data);
        return res.data.accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });

    const accessToken = await refreshRequest;
    original.headers.Authorization = `Bearer ${accessToken}`;
    return httpClient(original);
  },
);
