import { API_BASE } from "./session";
import { mutationFeedback } from "./mutationFeedback";
import axios from "axios";

// Admin-side axios instance. Fully separate token/storage keys from
// the partner instance so the two sessions never cross.
const adminApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Session-Mode": "cookie"
  }
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");

  if (token && token !== "cookie") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

adminApi.interceptors.response.use(
  mutationFeedback,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");

      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;
