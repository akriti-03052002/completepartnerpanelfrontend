import { API_BASE } from "./session";
import { mutationFeedback } from "./mutationFeedback";
import axios from "axios";

// Partner-side axios instance. Attaches the partner JWT to every
// request and clears session + redirects to login on a 401.
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Session-Mode": "cookie"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("partnerToken");

  if (token && token !== "cookie") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  mutationFeedback,
  (error) => {
    // A role or verification may change while a page is already open.
    // Refresh the shared account check after an authoritative access denial.
    if (error.response?.status === 403 && error.config?.url !== "/partner/profile"
        && (error.response.data?.locked || error.response.data?.message === "You don't have permission to do that.")) {
      window.dispatchEvent(new Event("spotx:data-changed"));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem("partnerToken");
      localStorage.removeItem("partner");
      localStorage.removeItem("partnerUser");

      if (!window.location.pathname.startsWith("/partner/login")) {
        window.location.href = "/partner/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
