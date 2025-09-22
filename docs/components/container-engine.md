# Container Engine Component

The Container Engine provides a unified abstraction layer for Docker and Podman, enabling seamless container management across different container runtimes. This component handles engine detection, command execution, and service lifecycle management.

## 🏗️ Architecture Overview

### Core Abstraction Layer

```typescript
export class ContainerEngineManager {
  private engine: ContainerEngine | null = null;
  private commands: EngineCommands | null = null;
  private initialized = false;

  // Engine detection and initialization
  async initialize(): Promise<void>
  private async detectEngine(): Promise<void>

  // Container operations
  async listContainers(): Promise<ContainerInfo[]>
  async startServices(services: string[], cwd?: string): Promise<void>
  async stopServices(services: string[], cwd?: string): Promise<void>
  async restartServices(services: string[], cwd?: string): Promise<void>

  // Monitoring and logging
  async getLogs(service?: string, follow?: boolean, cwd?: string): Promise<NodeJS.ReadableStream>
  async getStats(): Promise<string[]>
}
```

### Engine Types and Commands

```typescript
type ContainerEngine = 'docker' | 'podman';

interface EngineCommands {
  ps: string;        // List containers
  up: string;        // Start services
  down: string;      // Stop services
  restart: string;   // Restart services
  logs: string;      // View logs
  stats: string;     // Resource statistics
  inspect: string;   // Container inspection
}
```

## 🔍 Engine Detection System

### Automatic Engine Discovery

```typescript
private async detectEngine(): Promise<void> {
  try {
    // Try Docker first (most common)
    await execAsync('docker --version');
    this.engine = 'docker';
    this.commands = {
      ps: 'docker ps',
      up: 'docker compose up',
      down: 'docker compose down',
      restart: 'docker compose restart',
      logs: 'docker compose logs',
      stats: 'docker stats',
      inspect: 'docker inspect'
    };
    console.log('✅ Docker detected and configured');
    return;
  } catch {
    // Docker not available, try Podman
  }

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
      inspect: 'podman inspect'
    };
    console.log('✅ Podman detected and configured');
    return;
  } catch {
    // Neither engine available
  }

  // Fallback to demo mode
  this.setupDemoMode();
}
```

### Demo Mode Implementation

```typescript
private setupDemoMode(): void {
  console.warn('⚠️  Neither Docker nor Podman found - running in demo mode');

  this.engine = 'docker'; // Default to docker for UI purposes
  this.commands = {
    ps: 'echo "CONTAINER ID\tNAMES\tIMAGE\tSTATUS\tPORTS\tCREATED AT"',
    up: 'echo "Starting services..."',
    down: 'echo "Stopping services..."',
    restart: 'echo "Restarting services..."',
    logs: 'echo "No logs available in demo mode"',
    stats: 'echo "CONTAINER\tCPU %\tMEM USAGE / LIMIT\tMEM %\tNET I/O"',
    inspect: 'echo "[]"'
  };
}
```

### Engine Validation

```typescript
private async validateEngine(): Promise<boolean> {
  if (!this.engine || !this.commands) {
    return false;
  }

  try {
    // Test basic functionality
    await execAsync(`${this.commands.ps} --help`);
    return true;
  } catch (error) {
    console.error(`Engine validation failed for ${this.engine}:`, error);
    return false;
  }
}
```

## 📦 Container Operations

### Container Listing

```typescript
async listContainers(): Promise<ContainerInfo[]> {
  await this.initialize();

  const formatString = "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}";
  const { stdout } = await execAsync(`${this.commands!.ps} --format "${formatString}"`);

  const lines = stdout.trim().split('\n').slice(1); // Skip header

  return lines
    .filter(line => line.trim()) // Remove empty lines
    .map(line => this.parseContainerLine(line));
}

private parseContainerLine(line: string): ContainerInfo {
  const [id, name, image, status, ports, created] = line.split('\t');

  return {
    id: id?.trim() || '',
    name: name?.trim() || '',
    image: image?.trim() || '',
    status: this.parseStatus(status?.trim() || ''),
    ports: this.parsePorts(ports?.trim() || ''),
    created: this.parseCreatedDate(created?.trim() || '')
  };
}
```

### Status Parsing

```typescript
private parseStatus(status: string): ContainerInfo['status'] {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('up')) return 'running';
  if (lowerStatus.includes('exited') || lowerStatus.includes('exit')) return 'stopped';
  if (lowerStatus.includes('paused')) return 'paused';
  if (lowerStatus.includes('restarting')) return 'restarting';
  if (lowerStatus.includes('dead')) return 'dead';

  return 'stopped'; // Default fallback
}

private parsePorts(portsString: string): string[] {
  if (!portsString || portsString === '-') return [];

  // Handle various port formats
  // "0.0.0.0:3000->3000/tcp, 0.0.0.0:3001->3001/tcp"
  // "3000/tcp, 3001/tcp"
  return portsString
    .split(',')
    .map(port => port.trim())
    .filter(port => port.length > 0);
}

private parseCreatedDate(createdString: string): Date {
  try {
    // Handle different date formats from Docker/Podman
    return new Date(createdString);
  } catch {
    return new Date(); // Fallback to current date
  }
}
```

## 🔄 Service Lifecycle Management

### Service Starting

```typescript
async startServices(services: string[], cwd?: string): Promise<void> {
  await this.initialize();

  const command = this.buildServiceCommand('up', services);
  await this.executeCommand(command, cwd);

  // Verify services started successfully
  await this.waitForServices(services, 'running', 30000); // 30 second timeout
}

private buildServiceCommand(action: string, services: string[]): string {
  const baseCommand = this.commands![action as keyof EngineCommands];

  if (services.length > 0) {
    return `${baseCommand} ${services.join(' ')}`;
  }

  return baseCommand;
}

private async waitForServices(
  services: string[],
  expectedStatus: ContainerInfo['status'],
  timeout: number
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const containers = await this.listContainers();
    const serviceContainers = containers.filter(c =>
      services.some(service => c.name.includes(service))
    );

    const allReady = serviceContainers.every(c => c.status === expectedStatus);
    if (allReady) {
      return;
    }

    await this.delay(1000); // Wait 1 second before retry
  }

  throw new Error(`Timeout waiting for services to reach ${expectedStatus} status`);
}
```

### Service Stopping

```typescript
async stopServices(services: string[], cwd?: string): Promise<void> {
  await this.initialize();

  const command = this.buildServiceCommand('down', services);
  await this.executeCommand(command, cwd);

  // Verify services stopped
  await this.waitForServicesNotRunning(services, 30000);
}

private async waitForServicesNotRunning(services: string[], timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const containers = await this.listContainers();
    const runningServices = containers.filter(c =>
      c.status === 'running' &&
      services.some(service => c.name.includes(service))
    );

    if (runningServices.length === 0) {
      return;
    }

    await this.delay(1000);
  }

  throw new Error('Timeout waiting for services to stop');
}
```

### Service Restarting

```typescript
async restartServices(services: string[], cwd?: string): Promise<void> {
  await this.initialize();

  if (this.engine === 'docker') {
    // Docker supports direct restart
    const command = this.buildServiceCommand('restart', services);
    await this.executeCommand(command, cwd);
  } else {
    // Podman may need stop + start
    await this.stopServices(services, cwd);
    await this.delay(2000); // Brief pause
    await this.startServices(services, cwd);
  }
}
```

## 📊 Monitoring and Statistics

### Log Streaming

```typescript
async getLogs(service?: string, follow = false, cwd?: string): Promise<NodeJS.ReadableStream> {
  await this.initialize();

  let command = this.commands!.logs;

  if (follow) {
    command += ' -f';
  }

  if (service) {
    command += ` ${service}`;
  }

  const child = spawn('sh', ['-c', command], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Handle errors
  child.on('error', (error) => {
    console.error('Log stream error:', error);
  });

  return child.stdout;
}
```

### Resource Statistics

```typescript
async getStats(): Promise<string[]> {
  await this.initialize();

  const formatString = "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}";
  const { stdout } = await execAsync(`${this.commands!.stats} --no-stream --format "${formatString}"`);

  return stdout
    .trim()
    .split('\n')
    .slice(1) // Skip header
    .filter(line => line.trim());
}

async getDetailedStats(containerId: string): Promise<ContainerStats> {
  const { stdout } = await execAsync(`${this.commands!.inspect} ${containerId}`);
  const inspection = JSON.parse(stdout);

  return this.parseInspectionData(inspection[0]);
}

private parseInspectionData(data: any): ContainerStats {
  return {
    id: data.Id,
    name: data.Name.replace('/', ''),
    state: data.State.Status,
    created: new Date(data.Created),
    startedAt: data.State.StartedAt ? new Date(data.State.StartedAt) : undefined,
    config: {
      image: data.Config.Image,
      env: data.Config.Env,
      labels: data.Config.Labels
    },
    networkSettings: data.NetworkSettings,
    mounts: data.Mounts
  };
}
```

## 🔧 Command Execution System

### Safe Command Execution

```typescript
private async executeCommand(command: string, cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], {
      cwd,
      stdio: 'inherit' // Show output in terminal
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Command execution error: ${error.message}`));
    });
  });
}

private async executeCommandWithOutput(command: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed: ${stderr || 'Unknown error'}`));
      }
    });

    child.on('error', reject);
  });
}
```

### Command Security

```typescript
private sanitizeCommand(command: string): string {
  // Remove dangerous characters
  return command.replace(/[;&|`$(){}[\]]/g, '');
}

private validateServiceName(serviceName: string): boolean {
  // Only allow alphanumeric characters, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(serviceName);
}

private async executeSecureCommand(command: string, args: string[], cwd?: string): Promise<void> {
  // Validate all arguments
  const sanitizedArgs = args.map(arg => this.sanitizeCommand(arg));

  return new Promise((resolve, reject) => {
    const child = spawn(command, sanitizedArgs, { cwd });

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
```

## 🚨 Error Handling and Recovery

### Connection Error Handling

```typescript
private async handleConnectionError(error: Error): Promise<void> {
  console.error('Container engine connection error:', error);

  // Try to reconnect
  try {
    await this.initialize();
    console.log('✅ Reconnected to container engine');
  } catch (reconnectError) {
    console.error('❌ Failed to reconnect:', reconnectError);
    this.setupDemoMode();
  }
}

private async isEngineRunning(): Promise<boolean> {
  try {
    await execAsync(`${this.commands!.ps} --quiet --limit 1`);
    return true;
  } catch {
    return false;
  }
}
```

### Graceful Degradation

```typescript
async listContainersWithFallback(): Promise<ContainerInfo[]> {
  try {
    return await this.listContainers();
  } catch (error) {
    console.warn('Failed to list containers, using cached data:', error);
    return this.getCachedContainers();
  }
}

private getCachedContainers(): ContainerInfo[] {
  // Return last known container state
  return this.lastKnownContainers || [];
}

async executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying...`);
      await this.delay(delay * attempt); // Exponential backoff
    }
  }

  throw new Error('Max retries exceeded');
}
```

## 🔄 Engine-Specific Adaptations

### Docker-Specific Features

```typescript
class DockerAdapter {
  async getDockerInfo(): Promise<DockerInfo> {
    const { stdout } = await execAsync('docker info --format json');
    return JSON.parse(stdout);
  }

  async getDockerVersion(): Promise<DockerVersion> {
    const { stdout } = await execAsync('docker version --format json');
    return JSON.parse(stdout);
  }

  async getBuildxInfo(): Promise<BuildxInfo> {
    try {
      const { stdout } = await execAsync('docker buildx version');
      return this.parseBuildxVersion(stdout);
    } catch {
      return { available: false };
    }
  }

  async getSwarmInfo(): Promise<SwarmInfo> {
    try {
      const { stdout } = await execAsync('docker node ls --format json');
      return { enabled: true, nodes: JSON.parse(stdout) };
    } catch {
      return { enabled: false };
    }
  }
}
```

### Podman-Specific Features

```typescript
class PodmanAdapter {
  async getPodmanInfo(): Promise<PodmanInfo> {
    const { stdout } = await execAsync('podman info --format json');
    return JSON.parse(stdout);
  }

  async listPods(): Promise<PodInfo[]> {
    try {
      const { stdout } = await execAsync('podman pod ls --format json');
      return JSON.parse(stdout);
    } catch {
      return [];
    }
  }

  async getRootlessInfo(): Promise<RootlessInfo> {
    const info = await this.getPodmanInfo();
    return {
      rootless: !info.host.security.rootless,
      userNS: info.host.security.userNS,
      cgroupVersion: info.host.cgroupVersion
    };
  }
}
```

## 🎯 Advanced Features

### Health Checks

```typescript
async checkServiceHealth(serviceName: string): Promise<HealthStatus> {
  try {
    const containers = await this.listContainers();
    const container = containers.find(c => c.name.includes(serviceName));

    if (!container) {
      return { status: 'not_found', message: 'Service not found' };
    }

    if (container.status !== 'running') {
      return { status: 'unhealthy', message: `Service is ${container.status}` };
    }

    // Check if container has health check
    const inspection = await this.getDetailedStats(container.id);
    const healthCheck = inspection.config.healthcheck;

    if (healthCheck) {
      return this.evaluateHealthCheck(container.id);
    }

    return { status: 'healthy', message: 'Service is running (no health check)' };
  } catch (error) {
    return {
      status: 'error',
      message: `Health check failed: ${(error as Error).message}`
    };
  }
}

private async evaluateHealthCheck(containerId: string): Promise<HealthStatus> {
  const { stdout } = await execAsync(`${this.commands!.inspect} ${containerId}`);
  const data = JSON.parse(stdout)[0];

  const health = data.State.Health;
  if (!health) {
    return { status: 'healthy', message: 'No health check defined' };
  }

  return {
    status: health.Status.toLowerCase(),
    message: health.Log[health.Log.length - 1]?.Output || 'No health log'
  };
}
```

### Resource Limits

```typescript
async setResourceLimits(
  serviceName: string,
  limits: ResourceLimits
): Promise<void> {
  const containers = await this.listContainers();
  const container = containers.find(c => c.name.includes(serviceName));

  if (!container) {
    throw new Error(`Service ${serviceName} not found`);
  }

  const updateCommand = this.buildResourceUpdateCommand(container.id, limits);
  await this.executeCommand(updateCommand);
}

private buildResourceUpdateCommand(containerId: string, limits: ResourceLimits): string {
  const args: string[] = ['update'];

  if (limits.memory) {
    args.push('--memory', limits.memory);
  }

  if (limits.cpus) {
    args.push('--cpus', limits.cpus.toString());
  }

  if (limits.cpuShares) {
    args.push('--cpu-shares', limits.cpuShares.toString());
  }

  args.push(containerId);

  return `${this.engine} ${args.join(' ')}`;
}
```

## 🔧 Component Lifecycle

### Initialization Flow

```typescript
async initialize(): Promise<void> {
  if (this.initialized) {
    return;
  }

  try {
    await this.detectEngine();
    await this.validateEngine();
    await this.setupEngineSpecificFeatures();

    this.initialized = true;
    console.log(`✅ Container engine initialized: ${this.engine}`);
  } catch (error) {
    console.error('❌ Failed to initialize container engine:', error);
    this.setupDemoMode();
    this.initialized = true;
  }
}

private async setupEngineSpecificFeatures(): Promise<void> {
  if (this.engine === 'docker') {
    this.dockerAdapter = new DockerAdapter();
  } else if (this.engine === 'podman') {
    this.podmanAdapter = new PodmanAdapter();
  }
}
```

### Cleanup

```typescript
async cleanup(): Promise<void> {
  // Cancel any pending operations
  this.cancelPendingOperations();

  // Clear caches
  this.lastKnownContainers = [];

  // Reset state
  this.initialized = false;
  this.engine = null;
  this.commands = null;
}

private cancelPendingOperations(): void {
  // Implementation would track and cancel active operations
  for (const operation of this.activeOperations) {
    operation.cancel();
  }
  this.activeOperations.clear();
}
```

### State Management

```typescript
getEngineState(): EngineState {
  return {
    engine: this.engine,
    initialized: this.initialized,
    available: this.engine !== null,
    version: this.engineVersion,
    capabilities: this.getEngineCapabilities()
  };
}

private getEngineCapabilities(): EngineCapabilities {
  return {
    compose: this.supportsCompose(),
    swarm: this.supportsSwarm(),
    buildx: this.supportsBuildx(),
    rootless: this.supportsRootless()
  };
}
```

---

*The Container Engine component provides robust, cross-platform container management with intelligent engine detection, comprehensive error handling, and advanced features. Its abstraction layer ensures consistent behavior across Docker and Podman while maintaining engine-specific optimizations.*