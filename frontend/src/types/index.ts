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
