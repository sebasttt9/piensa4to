import axios from 'axios';

const TOKEN_KEY = 'datapulse.token';

// Usar VITE_API_URL si está definido, sino usar el proxy de Vite
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
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
