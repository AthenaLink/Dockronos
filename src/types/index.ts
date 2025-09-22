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

export interface ProjectConfig {
  name: string;
  engine: 'docker' | 'podman' | 'auto';
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