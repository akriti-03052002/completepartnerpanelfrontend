import axios from "axios";

// Customer-portal axios instance — separate token/storage key from the
// partner and admin instances so the three sessions never cross.
const customerPortalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

customerPortalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("customerPortalToken");

  if (token) {
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
