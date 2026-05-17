import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { authStorage } from "@/lib/auth-storage";

export const AUTH_EVENTS = {
  LOGOUT: "auth:logout",
  TOKENS_UPDATED: "auth:tokens-updated",
} as const;

export const emitAuthEvent = (
  type: (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS],
  detail?: unknown
): void => {
  window.dispatchEvent(new CustomEvent(type, { detail }));
};

export const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

AxiosInstance.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

const isAuthEndpoint = (url: string | undefined): boolean =>
  !!url && url.startsWith("/api/auth/");

const performRefresh = async (): Promise<string | null> => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await axios.post<{
      accessToken: string;
      refreshToken: string;
    }>(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefresh } = response.data;
    authStorage.setTokens(accessToken, newRefresh);
    emitAuthEvent(AUTH_EVENTS.TOKENS_UPDATED, { accessToken, refreshToken: newRefresh });
    return accessToken;
  } catch {
    return null;
  }
};

AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as RetriableConfig | undefined;

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      isAuthEndpoint(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = performRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      authStorage.clear();
      emitAuthEvent(AUTH_EVENTS.LOGOUT);
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
    return AxiosInstance(original);
  }
);
