import axios from 'axios';

const TOKEN_KEY = 'datapulse.token';

const api = axios.create({
  // Usar el proxy de Vite para desarrollo
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('datapulse:unauthorized'));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
