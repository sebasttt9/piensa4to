import axios from 'axios';

const TOKEN_KEY = 'datapulse.token';

const resolveBaseURL = () => {
  const candidates: Array<string | undefined> = [];

  try {
    const env = (import.meta as { env?: Record<string, string> }).env;
    candidates.push(env?.VITE_API_URL);
  } catch {
    // import.meta is not defined outside the browser build; fall back to other sources.
  }

  if (typeof process !== 'undefined') {
    candidates.push(process.env?.VITE_API_URL as string | undefined);
  }

  const raw = candidates.find((value): value is string => typeof value === 'string' && value.length > 0);
  if (!raw) {
    return '/api';
  }

  const normalized = raw.trim().replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : '/api';
};

const api = axios.create({
  // Prefer explicit environment base URL and fall back to the Vite proxy path.
  baseURL: resolveBaseURL(),
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
  (response) => response,
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
