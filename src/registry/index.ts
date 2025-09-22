import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { containerEngine } from '../engine/index.js';
import type { ContainerTemplate, PullOptions, ContainerRunOptions, RegistryConfig } from '../types/registry.js';
import type { ContainerConfig } from '../types/index.js';

const execAsync = promisify(exec);

export class ContainerRegistry {
  private registries: Map<string, RegistryConfig> = new Map();

  constructor() {
    this.setupDefaultRegistries();
  }

  private setupDefaultRegistries(): void {
    this.registries.set('docker.io', {
      url: 'docker.io',
      namespace: 'library',
    });

    this.registries.set('ghcr.io', {
      url: 'ghcr.io',
    });

    this.registries.set('quay.io', {
      url: 'quay.io',
    });
  }

  async pullImage(image: string, options: PullOptions = {}): Promise<void> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    let fullImage = image;
    if (options.tag && !image.includes(':')) {
      fullImage = `${image}:${options.tag}`;
    }

    if (options.registry && !image.includes('/')) {
      fullImage = `${options.registry}/${fullImage}`;
    }

    const command = `${engine} pull ${fullImage}`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('Pull complete')) {
      throw new Error(`Failed to pull image: ${stderr}`);
    }

    console.log(`Successfully pulled: ${fullImage}`);
  }

  async runContainer(options: ContainerRunOptions): Promise<string> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    const args: string[] = [];

    if (options.detach !== false) {
      args.push('-d');
    }

    args.push('--name', options.name);

    if (options.ports) {
      for (const port of options.ports) {
        args.push('-p', port);
      }
    }

    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push('-e', `${key}=${value}`);
      }
    }

    if (options.volumes) {
      for (const volume of options.volumes) {
        args.push('-v', volume);
      }
    }

    if (options.network) {
      args.push('--network', options.network);
    }

    if (options.restart) {
      args.push('--restart', options.restart);
    }

    args.push(options.image);

    const command = `${engine} run ${args.join(' ')}`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      throw new Error(`Failed to run container: ${stderr}`);
    }

    return stdout.trim(); // Container ID
  }

  async stopContainer(nameOrId: string): Promise<void> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    const command = `${engine} stop ${nameOrId}`;
    await execAsync(command);
  }

  async removeContainer(nameOrId: string, force = false): Promise<void> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    const forceFlag = force ? ' -f' : '';
    const command = `${engine} rm${forceFlag} ${nameOrId}`;
    await execAsync(command);
  }

  async searchImages(query: string, limit = 10): Promise<Array<{ name: string; description: string; stars: number; official: boolean }>> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    const command = `${engine} search --limit ${limit} --format "table {{.Name}}\t{{.Description}}\t{{.StarCount}}\t{{.IsOfficial}}" ${query}`;
    const { stdout } = await execAsync(command);

    const lines = stdout.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const [name, description, stars, official] = line.split('\t');
      return {
        name: name?.trim() || '',
        description: description?.trim() || '',
        stars: parseInt(stars?.trim() || '0'),
        official: official?.trim() === '[OK]',
      };
    });
  }

  async getImageInfo(image: string): Promise<any> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    const command = `${engine} inspect ${image}`;
    const { stdout } = await execAsync(command);

    return JSON.parse(stdout)[0];
  }

  async listLocalImages(): Promise<Array<{ repository: string; tag: string; id: string; size: string; created: Date }>> {
    await containerEngine.initialize();
    const engine = containerEngine.getEngine();

    const command = `${engine} images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}\t{{.CreatedAt}}"`;
    const { stdout } = await execAsync(command);

    const lines = stdout.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const [repository, tag, id, size, created] = line.split('\t');
      return {
        repository: repository?.trim() || '',
        tag: tag?.trim() || '',
        id: id?.trim() || '',
        size: size?.trim() || '',
        created: new Date(created?.trim() || ''),
      };
    });
  }

  async containerFromTemplate(template: ContainerTemplate, name: string, customEnv?: Record<string, string>): Promise<ContainerConfig> {
    const env = { ...template.optionalEnv, ...customEnv };

    // Validate required environment variables
    if (template.requiredEnv) {
      for (const requiredVar of template.requiredEnv) {
        if (!env[requiredVar]) {
          throw new Error(`Required environment variable '${requiredVar}' not provided for template '${template.name}'`);
        }
      }
    }

    return {
      name,
      image: template.image,
      ports: template.defaultPorts,
      env,
      volumes: template.volumes,
      template: template.name,
      auto_start: true,
    };
  }

  addRegistry(name: string, config: RegistryConfig): void {
    this.registries.set(name, config);
  }

  getRegistry(name: string): RegistryConfig | undefined {
    return this.registries.get(name);
  }

  listRegistries(): Map<string, RegistryConfig> {
    return new Map(this.registries);
  }
}

export const containerRegistry = new ContainerRegistry();