export interface ContainerTemplate {
  name: string;
  description: string;
  image: string;
  defaultPorts?: string[];
  requiredEnv?: string[];
  optionalEnv?: Record<string, string>;
  volumes?: string[];
  healthCheck?: string;
  documentation?: string;
}

export interface RegistryConfig {
  url: string;
  username?: string;
  password?: string;
  namespace?: string;
}

export interface PullOptions {
  tag?: string;
  platform?: string;
  registry?: string;
  force?: boolean;
}

export interface ContainerRunOptions {
  name: string;
  image: string;
  ports?: string[];
  env?: Record<string, string>;
  volumes?: string[];
  network?: string;
  restart?: string;
  detach?: boolean;
}