import axios from "axios";
import { Platform } from "react-native";





const DEFAULT_API_URL = Platform.select({
  android: "http://192.168.1.20:8000",
  ios: "http://192.168.1.20:8000",
  default: "http://localhost:8000",
});

const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


let currentToken = null;

export const setToken = (token) => {
  currentToken = token;
};

export const setBaseURL = (ip) => {
  if (ip) {
    const newURL = ip.includes("http") ? ip : `http://${ip}:8000`;
    api.defaults.baseURL = newURL;
    console.log("[API] Base URL updated to:", newURL);
  }
};

api.interceptors.request.use(
  (config) => {
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API REQUEST ERROR]", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.warn(
      `[API RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default api;
export { DEFAULT_API_URL };
