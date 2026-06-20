import axios from "axios";

// important: a SINGLE axios instance / interceptor handles "blocked or deleted
// user" responses for the WHOLE app, so no page has to special-case it itself.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    if (status === 401 && (code === "USER_BLOCKED" || code === "USER_DELETED" || code === "INVALID_TOKEN" || code === "NOT_AUTHENTICATED")) {
      // note: explain WHY the user is being redirected, per task requirements
      localStorage.removeItem("token");
      const message = error.response?.data?.message || "Please log in again.";
      const params = new URLSearchParams({ notice: message });
      window.location.href = `/login?${params.toString()}`;
    }
    return Promise.reject(error);
  }
);

export default api;
