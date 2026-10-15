import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'epms_access_token';

let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

export const getAuthToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY);
  }
  return accessToken;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

let rawBaseUrl: string = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
if ((rawBaseUrl.startsWith('http://') || rawBaseUrl.startsWith('https://')) && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}
export const API_BASE_URL = rawBaseUrl;

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout accommodates Render Free Tier cold starts (30-50s)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For httpOnly refresh cookie
});


// Request interceptor: attach bearer token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 refresh once -> logout
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Safely check url
    const requestUrl = originalRequest?.url || '';

    // Don't intercept auth endpoints to avoid infinite retry loops
    if (
      !originalRequest ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password')
    ) {
      return Promise.reject(error.response?.data || error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{ data: { accessToken: string } }>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 20000 },
        );

        const newAccessToken = response.data?.data?.accessToken;
        if (newAccessToken) {
          setAuthToken(newAccessToken);
          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh endpoint');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAuthToken(null);
        // Dispatch logout event or trigger auth store logout
        window.dispatchEvent(new CustomEvent('epms:auth-unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

export default axiosClient;
