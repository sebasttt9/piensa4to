import axios from 'axios';

const api = axios.create({
  // Use VITE_API_URL when provided; otherwise default to '/api' so Vite dev proxy works.
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('datapulse.token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
