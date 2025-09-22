import { promises as fs } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import type { ProjectConfig, ServiceConfig } from '../types/index.js';

export class ConfigManager {
  private config: ProjectConfig | null = null;
  private configPath: string | null = null;

  async loadConfig(configPath?: string): Promise<ProjectConfig> {
    this.configPath = configPath || await this.findConfigFile();

    if (!this.configPath) {
      // Create default config
      this.config = this.createDefaultConfig();
      return this.config;
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const parsed = yaml.parse(content) as ProjectConfig;
      this.config = this.validateAndNormalizeConfig(parsed);
      return this.config;
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = this.createDefaultConfig();
      return this.config;
    }
  }

  async saveConfig(config?: ProjectConfig): Promise<void> {
    const configToSave = config || this.config;
    if (!configToSave) {
      throw new Error('No config to save');
    }

    const configPath = this.configPath || join(process.cwd(), 'cronos.yml');
    const yamlContent = yaml.stringify(configToSave, {
      indent: 2,
      lineWidth: 120,
    });

    await fs.writeFile(configPath, yamlContent, 'utf-8');
    this.configPath = configPath;
    this.config = configToSave;
  }

  getConfig(): ProjectConfig | null {
    return this.config;
  }

  private async findConfigFile(): Promise<string | null> {
    const possibleFiles = [
      'cronos.yml',
      'cronos.yaml',
      '.cronos.yml',
      '.cronos.yaml',
      'cronos.config.yml',
      'cronos.config.yaml',
    ];

    for (const filename of possibleFiles) {
      const filepath = join(process.cwd(), filename);
      try {
        await fs.access(filepath);
        return filepath;
      } catch {
        // File doesn't exist, continue
      }
    }

    return null;
  }

  private createDefaultConfig(): ProjectConfig {
    return {
      name: 'cronos-project',
      engine: 'auto',
      services: [],
    };
  }

  private validateAndNormalizeConfig(config: any): ProjectConfig {
    const normalized: ProjectConfig = {
      name: config.name || 'cronos-project',
      engine: config.engine || 'auto',
      services: [],
      global_env: config.global_env,
    };

    if (Array.isArray(config.services)) {
      normalized.services = config.services.map((service: any) => this.normalizeService(service));
    }

    return normalized;
  }

  private normalizeService(service: any): ServiceConfig {
    return {
      name: service.name || 'unnamed-service',
      compose_file: service.compose_file || service.composeFile || undefined,
      env_file: service.env_file || service.envFile || undefined,
      directory: service.directory || '.',
    };
  }

  async addService(service: ServiceConfig): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    this.config!.services.push(service);
    await this.saveConfig();
  }

  async removeService(serviceName: string): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    this.config!.services = this.config!.services.filter(s => s.name !== serviceName);
    await this.saveConfig();
  }

  async updateService(serviceName: string, updates: Partial<ServiceConfig>): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    const serviceIndex = this.config!.services.findIndex(s => s.name === serviceName);
    if (serviceIndex >= 0) {
      const currentService = this.config!.services[serviceIndex];
      if (currentService) {
        this.config!.services[serviceIndex] = {
          name: updates.name ?? currentService.name,
          directory: updates.directory ?? currentService.directory,
          compose_file: updates.compose_file ?? currentService.compose_file,
          env_file: updates.env_file ?? currentService.env_file,
        };
        await this.saveConfig();
      }
    }
  }

  getService(serviceName: string): ServiceConfig | undefined {
    return this.config?.services.find(s => s.name === serviceName);
  }

  getServices(): ServiceConfig[] {
    return this.config?.services || [];
  }

  async autoDiscoverServices(rootDirectory: string = process.cwd()): Promise<ServiceConfig[]> {
    const discoveredServices: ServiceConfig[] = [];

    try {
      const entries = await fs.readdir(rootDirectory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const serviceDir = join(rootDirectory, entry.name);
          const service = await this.discoverServiceInDirectory(serviceDir, entry.name);
          if (service) {
            discoveredServices.push(service);
          }
        }
      }

      // Also check root directory
      const rootService = await this.discoverServiceInDirectory(rootDirectory, 'root');
      if (rootService) {
        discoveredServices.push(rootService);
      }

    } catch (error) {
      console.error('Error auto-discovering services:', error);
    }

    return discoveredServices;
  }

  private async discoverServiceInDirectory(directory: string, defaultName: string): Promise<ServiceConfig | null> {
    try {
      const files = await fs.readdir(directory);

      // Look for compose files
      const composeFiles = files.filter(file =>
        file === 'docker-compose.yml' ||
        file === 'docker-compose.yaml' ||
        file === 'compose.yml' ||
        file === 'compose.yaml' ||
        file === 'podman-compose.yml' ||
        file === 'podman-compose.yaml'
      );

      // Look for env files
      const envFiles = files.filter(file =>
        file === '.env' ||
        file.startsWith('.env.')
      );

      // If we found compose files or env files, this looks like a service
      if (composeFiles.length > 0 || envFiles.length > 0) {
        return {
          name: defaultName,
          directory,
          compose_file: composeFiles[0] || undefined,
          env_file: envFiles.find(f => f === '.env') || envFiles[0] || undefined,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const configManager = new ConfigManager();