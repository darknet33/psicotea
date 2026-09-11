import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  removeTokens,
} from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = false;
let queue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthRequest =
      original?.url?.includes("/auth/login") ||
      original?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRequest
    ) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeTokens();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (token) {
              original._retry = true;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      refreshing = true;

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        setTokens(data.access_token, data.refresh_token);
        flushQueue(data.access_token);
        original._retry = true;
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        flushQueue(null);
        removeTokens();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function isAxiosError(error: unknown): error is AxiosError<{ message?: string | string[] }> {
  return axios.isAxiosError(error);
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK") return "No se pudo conectar con el servidor";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Ha ocurrido un error inesperado";
}

export type { AxiosRequestConfig };