import axios from "axios";

export function useApi() {
  const api = axios.create({
    baseURL: "/api",
    timeout: 10000,
  });

  const apiGet = async (url) => api.get(url);
  const apiPost = async (url, data) => api.post(url, data);
  const apiDelete = async (url) => api.delete(url);
  const apiPut = async (url, data) => api.put(url, data);

  return { apiGet, apiPost, apiDelete, apiPut };
}
