import axios from "axios";
import { DiskMetrics, FoldersResponse, PodMetricsMap } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const fetchApps = () => api.get("/apps/").then(r => r.data);
export const fetchPods = () => api.get("/pods/").then(r => r.data);
export const restartPod = (namespace: string, name: string) =>
  api.post(`/pods/${namespace}/${name}/restart`);
export const fetchSystem = () => api.get("/system/").then(r => r.data);
export const fetchDisks = (): Promise<DiskMetrics[]> =>
  api.get("/disks/").then(r => r.data);
export const fetchPodMetrics = (): Promise<PodMetricsMap> =>
  api.get("/pods/metrics").then(r => r.data);
export const fetchFolders = (disk: string): Promise<FoldersResponse> =>
  api.get(`/disks/folders/${disk}`).then(r => r.data);
