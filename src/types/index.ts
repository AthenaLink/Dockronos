export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'dead';
  ports: string[];
  created: Date;
  cpu?: number;
  memory?: number;
}

export interface SystemMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  loadAvg: number[];
}

export interface ContainerMetrics {
  id: string;
  name: string;
  cpu: number;
  memory: {
    used: number;
    limit: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
}

export interface ServiceConfig {
  name: string;
  compose_file?: string | undefined;
  env_file?: string | undefined;
  directory: string;
}

export interface ContainerConfig {
  name: string;
  image: string;
  ports?: string[] | undefined;
  env?: Record<string, string>;
  volumes?: string[] | undefined;
  template?: string | undefined;
  auto_start?: boolean;
}

export interface GitRepository {
  name: string;
  url: string;
  branch?: string;
  directory: string;
  auto_update?: boolean;
}

export interface ProjectConfig {
  name: string;
  engine: 'docker' | 'podman' | 'auto';
  projects_directory?: string;
  repositories?: GitRepository[];
  containers?: ContainerConfig[];
  services: ServiceConfig[];
  global_env?: string;
}

export type ContainerEngine = 'docker' | 'podman';

export interface EngineCommands {
  ps: string;
  up: string;
  down: string;
  restart: string;
  logs: string;
  stats: string;
  inspect: string;
}

export interface LogEntry {
  timestamp: Date;
  service: string;
  message: string;
  level?: 'error' | 'warn' | 'info' | 'debug';
}

export interface KeyBinding {
  key: string;
  description: string;
  action: () => void;
}