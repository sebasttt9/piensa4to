import axios from 'axios';

const TOKEN_KEY = 'datapulse.token';

const resolveBaseURL = () => {
  const candidates: Array<string | undefined> = [];

  try {
    const env = (import.meta as { env?: Record<string, string> }).env;
    candidates.push(env?.VITE_API_URL);
  } catch {

  }

  const globalProcess = typeof globalThis === 'object' && 'process' in globalThis
    ? (globalThis as { process?: { env?: Record<string, string> } }).process
    : undefined;

  if (globalProcess?.env) {
    candidates.push(globalProcess.env.VITE_API_URL);
  }

  const raw = candidates.find((value): value is string => typeof value === 'string' && value.length > 0);
  if (!raw) {
    return '/api';
  }

  const normalized = raw.trim().replace(/\/+$/, '');
  if (normalized.length === 0) {
    return '/api';
  }

  return normalized.toLowerCase().endsWith('/api') ? normalized : `${normalized}/api`;
};

const api = axios.create({
  // Prefer explicit environment base URL and fall back to the Vite proxy path.
  baseURL: resolveBaseURL(),
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
