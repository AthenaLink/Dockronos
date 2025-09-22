import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import type { ContainerEngine, ContainerInfo, EngineCommands } from '../types/index.js';

const execAsync = promisify(exec);

export class ContainerEngineManager {
  private engine: ContainerEngine | null = null;
  private commands: EngineCommands | null = null;

  constructor() {
    this.detectEngine();
  }

  private async detectEngine(): Promise<void> {
    try {
      await execAsync('docker --version');
      this.engine = 'docker';
      this.commands = {
        ps: 'docker ps',
        up: 'docker compose up',
        down: 'docker compose down',
        restart: 'docker compose restart',
        logs: 'docker compose logs',
        stats: 'docker stats',
        inspect: 'docker inspect',
      };
    } catch {
      try {
        await execAsync('podman --version');
        this.engine = 'podman';
        this.commands = {
          ps: 'podman ps',
          up: 'podman-compose up',
          down: 'podman-compose down',
          restart: 'podman-compose restart',
          logs: 'podman-compose logs',
          stats: 'podman stats',
          inspect: 'podman inspect',
        };
      } catch {
        // Set demo mode with mock commands for development
        console.warn('Neither Docker nor Podman found - running in demo mode');
        this.engine = 'docker'; // Default to docker for UI purposes
        this.commands = {
          ps: 'echo "CONTAINER ID\tNAMES\tIMAGE\tSTATUS\tPORTS\tCREATED AT"',
          up: 'echo "Starting services..."',
          down: 'echo "Stopping services..."',
          restart: 'echo "Restarting services..."',
          logs: 'echo "No logs available in demo mode"',
          stats: 'echo "CONTAINER\tCPU %\tMEM USAGE / LIMIT\tMEM %\tNET I/O"',
          inspect: 'echo "[]"',
        };
      }
    }
  }

  getEngine(): ContainerEngine {
    if (!this.engine) {
      throw new Error('Container engine not detected');
    }
    return this.engine;
  }

  getCommands(): EngineCommands {
    if (!this.commands) {
      throw new Error('Container engine commands not initialized');
    }
    return this.commands;
  }

  async listContainers(): Promise<ContainerInfo[]> {
    const { stdout } = await execAsync(`${this.commands?.ps} --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"`);

    const lines = stdout.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const [id, name, image, status, ports, created] = line.split('\t');
      return {
        id: id?.trim() || '',
        name: name?.trim() || '',
        image: image?.trim() || '',
        status: this.parseStatus(status?.trim() || ''),
        ports: ports?.trim().split(',').map(p => p.trim()).filter(Boolean) || [],
        created: new Date(created?.trim() || ''),
      };
    });
  }

  private parseStatus(status: string): ContainerInfo['status'] {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('up')) return 'running';
    if (lowerStatus.includes('exited') || lowerStatus.includes('exit')) return 'stopped';
    if (lowerStatus.includes('paused')) return 'paused';
    if (lowerStatus.includes('restarting')) return 'restarting';
    if (lowerStatus.includes('dead')) return 'dead';
    return 'stopped';
  }

  async startServices(services: string[], cwd?: string): Promise<void> {
    const command = services.length > 0
      ? `${this.commands?.up} ${services.join(' ')}`
      : this.commands?.up;

    await this.executeCommand(command || '', cwd);
  }

  async stopServices(services: string[], cwd?: string): Promise<void> {
    const command = services.length > 0
      ? `${this.commands?.down} ${services.join(' ')}`
      : this.commands?.down;

    await this.executeCommand(command || '', cwd);
  }

  async restartServices(services: string[], cwd?: string): Promise<void> {
    const command = services.length > 0
      ? `${this.commands?.restart} ${services.join(' ')}`
      : this.commands?.restart;

    await this.executeCommand(command || '', cwd);
  }

  async getLogs(service?: string, follow = false, cwd?: string): Promise<NodeJS.ReadableStream> {
    const command = service
      ? `${this.commands?.logs} ${follow ? '-f' : ''} ${service}`
      : `${this.commands?.logs} ${follow ? '-f' : ''}`;

    const child = spawn('sh', ['-c', command || ''], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return child.stdout;
  }

  async getStats(): Promise<string[]> {
    const { stdout } = await execAsync(`${this.commands?.stats} --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"`);
    return stdout.trim().split('\n').slice(1); // Skip header
  }

  private async executeCommand(command: string, cwd?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], { cwd });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }
}

export const containerEngine = new ContainerEngineManager();