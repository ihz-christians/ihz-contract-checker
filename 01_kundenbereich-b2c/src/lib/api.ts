import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { auth } from "@/lib/firebase";

// API Base Configuration - Assuming it connects to the same Customer AI Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for Firebase Auth token
apiClient.interceptors.request.use(
  async (config) => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.error("Failed to get Firebase token", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, the context should ideally handle this,
      // but a hard redirect is a safe fallback
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Generic API call wrapper
export const apiCall = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
};
