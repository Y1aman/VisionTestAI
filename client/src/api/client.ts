import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// In production builds VITE_API_URL is set via .env.production
// In local dev it falls back to '/api' which Vite proxies to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { email: string; password: string; fullName: string; tenantName: string; preferredLanguage: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Tests API
export const testsApi = {
  create: (data: { prompt: string; targetUrl: string }) => api.post('/tests', data),
  getAll: (page = 1, pageSize = 20, status?: string) =>
    api.get('/tests', { params: { page, pageSize, status } }),
  getById: (id: string) => api.get(`/tests/${id}`),
};

export default api;
