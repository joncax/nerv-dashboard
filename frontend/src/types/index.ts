export interface App {
  name: string;
  icon: string;
  node_port: number;
  ip: string;
  hostname: string;
  category: string;
  url_ip: string;
  url_hostname: string;
  healthy: boolean;
  last_update?: string;
  initials?: string;
  namespace?: string;
}
export interface Pod {
  name: string;
  namespace: string;
  status: string;
  ready: boolean;
  restarts: number;
  node: string;
  uptime?: string;
}
export interface SystemMetrics {
  ram: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    percent: number;
  };
}
export interface InodeMetrics {
  total: number;
  used: number;
  free: number;
  percent: number;
}
export interface DiskMetrics {
  name: string;
  mount: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  percent: number;
  status: 'healthy' | 'warning' | 'critical';
  inodes: InodeMetrics | null;
  error?: string;
}
export interface PodMetrics {
  cpu_m: number;
  mem_mi: number;
}
export interface PodMetricsMap {
  [key: string]: PodMetrics;
}
export interface FolderEntry {
  path: string;
  size_human: string;
  size_bytes: number;
}
export interface FoldersResponse {
  disk: string;
  mount: string;
  folders: FolderEntry[];
}
