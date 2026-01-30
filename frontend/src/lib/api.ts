import axios from 'axios';

const TOKEN_KEY = 'datapulse.token';

const api = axios.create({
  // Usar el proxy de Vite para desarrollo
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('API Request:', config.method?.toUpperCase(), config.url, 'Token present:', !!token);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.message);
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
