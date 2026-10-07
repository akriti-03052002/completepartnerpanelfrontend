import { API_BASE } from "./session";
import axios from "axios";

// Customer-portal axios instance — separate token/storage key from the
// partner and admin instances so the three sessions never cross.
const customerPortalApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Session-Mode": "cookie"
  }
});

customerPortalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("customerPortalToken");

  if (token && token !== "cookie") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

customerPortalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("customerPortalToken")) {
      localStorage.removeItem("customerPortalToken");

      if (!window.location.pathname.startsWith("/reseller/customer/login")) {
        window.location.href = "/reseller/customer/login";
      }
    }

    return Promise.reject(error);
  }
);

export default customerPortalApi;
