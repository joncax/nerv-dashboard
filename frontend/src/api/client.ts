import axios from "axios";
import { DiskMetrics, FoldersResponse, PodMetricsMap, AppUpdateInfo, ActivityLogEntry } from "../types";
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
export const fetchAllAppsInfo = (): Promise<{ apps: AppUpdateInfo[] }> =>
  api.get("/updates/all/info").then(r => r.data);
export const fetchAppInfo = (app: string): Promise<AppUpdateInfo> =>
  api.get(`/updates/${app}/info`).then(r => r.data);
export const fetchActivityLog = (app?: string, limit = 50): Promise<{ logs: ActivityLogEntry[] }> =>
  api.get("/updates/logs", { params: { app, limit } }).then(r => r.data);
export const verifyApp = (app: string): Promise<{ status: string; version: string }> =>
  api.post(`/updates/${app}/verify`).then(r => r.data);
export const triggerUpdateFetch = async (
  app: string,
  onLine: (line: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) => {
  try {
    const res = await fetch(`${BASE_URL}/updates/${app}/update`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let completed = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(6).trim();
          if (content === "[DONE]") {
            completed = true;
            onDone();
            return;
          }
          if (content) onLine(content);
        }
      }
    }
    if (!completed) onDone();
  } catch (e: any) {
    onError(e.message || "Unknown error");
  }
};

