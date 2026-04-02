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
