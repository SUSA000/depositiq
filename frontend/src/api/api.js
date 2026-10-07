import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

export function getStoredToken() {
  return localStorage.getItem("tdi_token") || sessionStorage.getItem("tdi_token");
}

export function storeToken(token, remember = true) {
  localStorage.removeItem("tdi_token");
  sessionStorage.removeItem("tdi_token");
  (remember ? localStorage : sessionStorage).setItem("tdi_token", token);
}

export function clearStoredToken() {
  localStorage.removeItem("tdi_token");
  sessionStorage.removeItem("tdi_token");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      clearStoredToken();
      window.dispatchEvent(new Event("tdi:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(" ");
  return detail || error.message || fallback;
}

export default api;
