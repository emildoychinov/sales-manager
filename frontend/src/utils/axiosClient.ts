import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from "axios";
import { config } from "../config";

const axiosClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.requestTimeout,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(config.authToken);
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

axiosClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(config.authToken);
    }
    return Promise.reject(err);
  }
);

export default axiosClient;
export { axiosClient };
