Aquí va la traducción al español:

---

# Componente del Motor de Contenedores

El **Motor de Contenedores** proporciona una capa de abstracción unificada para Docker y Podman, permitiendo una gestión fluida de contenedores a través de distintos runtimes. Este componente maneja la detección del motor, la ejecución de comandos y la gestión del ciclo de vida de los servicios.

## 🏗️ Visión general de la arquitectura

### Capa de abstracción principal

```typescript
export class ContainerEngineManager {
  private engine: ContainerEngine | null = null;
  private commands: EngineCommands | null = null;
  private initialized = false;

  // Detección e inicialización del motor
  async initialize(): Promise<void>
  private async detectEngine(): Promise<void>

  // Operaciones sobre contenedores
  async listContainers(): Promise<ContainerInfo[]>
  async startServices(services: string[], cwd?: string): Promise<void>
  async stopServices(services: string[], cwd?: string): Promise<void>
  async restartServices(services: string[], cwd?: string): Promise<void>

  // Monitoreo y registros
  async getLogs(service?: string, follow?: boolean, cwd?: string): Promise<NodeJS.ReadableStream>
  async getStats(): Promise<string[]>
}
```

### Tipos de motor y comandos

```typescript
type ContainerEngine = 'docker' | 'podman';

interface EngineCommands {
  ps: string;        // Listar contenedores
  up: string;        // Iniciar servicios
  down: string;      // Detener servicios
  restart: string;   // Reiniciar servicios
  logs: string;      // Ver registros
  stats: string;     // Estadísticas de recursos
  inspect: string;   // Inspección de contenedores
}
```

## 🔍 Sistema de detección del motor

### Descubrimiento automático del motor

```typescript
private async detectEngine(): Promise<void> {
  try {
    // Probar primero con Docker (el más común)
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
    console.log('✅ Docker detectado y configurado');
    return;
  } catch {
    // Docker no disponible, intentar con Podman
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
    console.log('✅ Podman detectado y configurado');
    return;
  } catch {
    // Ningún motor disponible
  }

  // Modo demostración como alternativa
  this.setupDemoMode();
}
```

### Implementación del modo demo

```typescript
private setupDemoMode(): void {
  console.warn('⚠️  Ni Docker ni Podman encontrados: ejecutando en modo demo');

  this.engine = 'docker'; // Valor por defecto para propósitos de UI
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

### Validación del motor

```typescript
private async validateEngine(): Promise<boolean> {
  if (!this.engine || !this.commands) {
    return false;
  }

  try {
    // Probar funcionalidad básica
    await execAsync(`${this.commands.ps} --help`);
    return true;
  } catch (error) {
    console.error(`La validación falló para ${this.engine}:`, error);
    return false;
  }
}
```

## 📦 Operaciones sobre contenedores

### Listado de contenedores

```typescript
async listContainers(): Promise<ContainerInfo[]> {
  await this.initialize();

  const formatString = "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}";
  const { stdout } = await execAsync(`${this.commands!.ps} --format "${formatString}"`);

  const lines = stdout.trim().split('\n').slice(1); // Omitir cabecera

  return lines
    .filter(line => line.trim()) // Quitar líneas vacías
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

### Análisis del estado

```typescript
private parseStatus(status: string): ContainerInfo['status'] {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('up')) return 'running';
  if (lowerStatus.includes('exited') || lowerStatus.includes('exit')) return 'stopped';
  if (lowerStatus.includes('paused')) return 'paused';
  if (lowerStatus.includes('restarting')) return 'restarting';
  if (lowerStatus.includes('dead')) return 'dead';

  return 'stopped'; // Valor por defecto
}

private parsePorts(portsString: string): string[] {
  if (!portsString || portsString === '-') return [];

  // Manejar varios formatos de puertos
  // "0.0.0.0:3000->3000/tcp, 0.0.0.0:3001->3001/tcp"
  // "3000/tcp, 3001/tcp"
  return portsString
    .split(',')
    .map(port => port.trim())
    .filter(port => port.length > 0);
}

private parseCreatedDate(createdString: string): Date {
  try {
    // Manejar distintos formatos de fecha de Docker/Podman
    return new Date(createdString);
  } catch {
    return new Date(); // Alternativa: fecha actual
  }
}
```

## 🔄 Gestión del ciclo de vida de servicios

### Inicio de servicios

```typescript
async startServices(services: string[], cwd?: string): Promise<void> {
  await this.initialize();

  const command = this.buildServiceCommand('up', services);
  await this.executeCommand(command, cwd);

  // Verificar que los servicios iniciaron correctamente
  await this.waitForServices(services, 'running', 30000); // 30 s de timeout
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

    await this.delay(1000); // Esperar 1 s antes de reintentar
  }

  throw new Error(`Tiempo de espera excedido esperando estado ${expectedStatus}`);
}
```

### Detención de servicios

```typescript
async stopServices(services: string[], cwd?: string): Promise<void> {
  await this.initialize();

  const command = this.buildServiceCommand('down', services);
  await this.executeCommand(command, cwd);

  // Verificar que los servicios se detuvieron
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

  throw new Error('Tiempo de espera excedido esperando la detención de servicios');
}
```

### Reinicio de servicios

```typescript
async restartServices(services: string[], cwd?: string): Promise<void> {
  await this.initialize();

  if (this.engine === 'docker') {
    // Docker soporta reinicio directo
    const command = this.buildServiceCommand('restart', services);
    await this.executeCommand(command, cwd);
  } else {
    // Podman puede requerir stop + start
    await this.stopServices(services, cwd);
    await this.delay(2000); // Pausa breve
    await this.startServices(services, cwd);
  }
}
```

## 📊 Monitoreo y estadísticas

### Flujo de logs

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

  // Manejo de errores
  child.on('error', (error) => {
    console.error('Error en el stream de logs:', error);
  });

  return child.stdout;
}
```

### Estadísticas de recursos

```typescript
async getStats(): Promise<string[]> {
  await this.initialize();

  const formatString = "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}";
  const { stdout } = await execAsync(`${this.commands!.stats} --no-stream --format "${formatString}"`);

  return stdout
    .trim()
    .split('\n')
    .slice(1) // Omitir cabecera
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

## 🔧 Sistema de ejecución de comandos

### Ejecución segura de comandos

```typescript
private async executeCommand(command: string, cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], {
      cwd,
      stdio: 'inherit' // Mostrar salida en la terminal
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El comando falló con código ${code}: ${command}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Error ejecutando el comando: ${error.message}`));
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
        reject(new Error(`Comando fallido: ${stderr || 'Error desconocido'}`));
      }
    });

    child.on('error', reject);
  });
}
```

### Seguridad de comandos

```typescript
private sanitizeCommand(command: string): string {
  // Quitar caracteres peligrosos
  return command.replace(/[;&|`$(){}[\]]/g, '');
}

private validateServiceName(serviceName: string): boolean {
  // Permitir solo alfanuméricos, guiones y guiones bajos
  return /^[a-zA-Z0-9_-]+$/.test(serviceName);
}

private async executeSecureCommand(command: string, args: string[], cwd?: string): Promise<void> {
  // Validar todos los argumentos
  const sanitizedArgs = args.map(arg => this.sanitizeCommand(arg));

  return new Promise((resolve, reject) => {
    const child = spawn(command, sanitizedArgs, { cwd });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`El comando falló con código ${code}`));
      }
    });

    child.on('error', reject);
  });
}
```

## 🚨 Manejo de errores y recuperación

### Manejo de errores de conexión

```typescript
private async handleConnectionError(error: Error): Promise<void> {
  console.error('Error de conexión con el motor de contenedores:', error);

  // Intentar reconectar
  try {
    await this.initialize();
    console.log('✅ Reconectado al motor de contenedores');
  } catch (reconnectError) {
    console.error('❌ Falló la reconexión:', reconnectError);
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

### Degradación elegante

```typescript
async listContainersWithFallback(): Promise<ContainerInfo[]> {
  try {
    return await this.listContainers();
  } catch (error) {
    console.warn('Fallo al listar contenedores, usando datos en caché:', error);
    return this.getCachedContainers();
  }
}

private getCachedContainers(): ContainerInfo[] {
  // Devolver el último estado conocido
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

      console.warn(`Operación fallida (intento ${attempt}/${maxRetries}), reintentando...`);
      await this.delay(delay * attempt); // Backoff exponencial
    }
  }

  throw new Error('Número máximo de reintentos excedido');
}
```

## 🔄 Adaptaciones específicas del motor

### Funciones específicas de Docker

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

### Funciones específicas de Podman

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

## 🎯 Funcionalidades avanzadas

### Comprobaciones de salud

```typescript
async checkServiceHealth(serviceName: string): Promise<HealthStatus> {
  try {
    const containers = await this.listContainers();
    const container = containers.find(c => c.name.includes(serviceName));

    if (!container) {
      return { status: 'not_found', message: 'Servicio no encontrado' };
    }

    if (container.status !== 'running') {
      return { status: 'unhealthy', message: `El servicio está ${container.status}` };
    }

    // Verificar si el contenedor tiene health check
    const inspection = await this.getDetailedStats(container.id);
    const healthCheck = inspection.config.healthcheck;

    if (healthCheck) {
      return this.evaluateHealthCheck(container.id);
    }

    return { status: 'healthy', message: 'Servicio en ejecución (sin health check)' };
  } catch (error) {
    return {
      status: 'error',
      message: `Fallo en health check: ${(error as Error).message}`
    };
  }
}

private async evaluateHealthCheck(containerId: string): Promise<HealthStatus> {
  const { stdout } = await execAsync(`${this.commands!.inspect} ${containerId}`);
  const data = JSON.parse(stdout)[0];

  const health = data.State.Health;
  if (!health) {
    return { status: 'healthy', message: 'Sin health check definido' };
  }

  return {
    status: health.Status.toLowerCase(),
    message: health.Log[health.Log.length - 1]?.Output || 'Sin registro de salud'
  };
}
```

### Límites de recursos

```typescript
async setResourceLimits(
  serviceName: string,
  limits: ResourceLimits
): Promise<void> {
  const containers = await this.listContainers();
  const container = containers.find(c => c.name.includes(serviceName));

  if (!container) {
    throw new Error(`Servicio ${serviceName} no encontrado`);
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

## 🔧 Ciclo de vida del componente

### Flujo de inicialización

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
    console.log(`✅ Motor de contenedores inicializado: ${this.engine}`);
  } catch (error) {
    console.error('❌ Error al inicializar el motor de contenedores:', error);
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

### Limpieza

```typescript
async cleanup(): Promise<void> {
  // Cancelar operaciones pendientes
  this.cancelPendingOperations();

  // Limpiar cachés
  this.lastKnownContainers = [];

  // Restablecer estado
  this.initialized = false;
  this.engine = null;
  this.commands = null;
}

private cancelPendingOperations(): void {
  // La implementación rastrearía y cancelaría operaciones activas
  for (const operation of this.activeOperations) {
    operation.cancel();
  }
  this.activeOperations.clear();
}
```

### Gestión de estado

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

*El componente del Motor de Contenedores ofrece una gestión robusta y multiplataforma con detección inteligente del motor, manejo integral de errores y funciones avanzadas. Su capa de abstracción garantiza un comportamiento consistente entre Docker y Podman, manteniendo optimizaciones específicas para cada motor.*
