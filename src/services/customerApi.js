import { mutationFeedback } from "./mutationFeedback";
import axios from "axios";

// Customer-side axios instance. Attaches the customer JWT to every
// request and clears session + redirects to login on a 401.
const customerApi = axios.create({
  // Same API address as the partner and admin clients — a hardcoded
  // ":5000" here only ever worked on a developer's own machine.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("customerToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

customerApi.interceptors.response.use(
  mutationFeedback,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.startsWith("/public/")) {
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customer");

      if (!window.location.pathname.startsWith("/customer/login")) {
        window.location.href = "/customer/login";
      }
    }

    return Promise.reject(error);
  }
);

export default customerApi;
