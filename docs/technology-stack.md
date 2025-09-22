# Technology Stack

Dockronos leverages a carefully selected technology stack designed for high performance, reliability, and excellent developer experience. This document provides comprehensive details about each technology choice, implementation patterns, and architectural decisions.

## 🏗️ Core Technologies

### Node.js Runtime

**Version**: 18.0+
**Purpose**: JavaScript/TypeScript runtime environment
**Key Features Used**:
- ES Modules support for modern JavaScript
- Worker Threads for CPU-intensive operations
- Stream API for efficient data processing
- File System Watchers for configuration monitoring
- Process management for container interactions

```typescript
// Node.js ES Modules configuration
// package.json
{
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**Why Node.js 18+**:
- Native ES Modules support without experimental flags
- Improved performance and memory management
- Built-in test runner (used for development)
- Enhanced security features
- Long-term support (LTS) availability

### TypeScript

**Version**: 5.3+
**Purpose**: Type-safe JavaScript development
**Configuration**: Strict mode with advanced type checking

```typescript
// tsconfig.json highlights
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

**Advanced TypeScript Features**:
- **Template Literal Types**: For dynamic string validation
- **Conditional Types**: For complex type transformations
- **Mapped Types**: For configuration object validation
- **Brand Types**: For type-safe identifiers
- **Utility Types**: Extensive use of built-in and custom utilities

```typescript
// Example: Brand types for container identifiers
type ContainerId = string & { readonly __brand: unique symbol };
type ContainerName = string & { readonly __brand: unique symbol };

// Template literal types for configuration paths
type ConfigPath = `${string}.yml` | `${string}.yaml`;

// Conditional types for engine-specific operations
type EngineCommand<T extends ContainerEngine> =
  T extends 'docker' ? DockerCommand :
  T extends 'podman' ? PodmanCommand :
  never;
```

## 🖥️ Terminal User Interface

### blessed.js

**Version**: 0.1.81+
**Purpose**: Terminal UI framework for interactive console applications
**Key Features**:
- Cross-platform terminal compatibility
- Event-driven UI components
- Mouse and keyboard input handling
- Screen buffer management
- Color and styling support

```typescript
// blessed.js widget creation example
const servicesTable = blessed.listtable({
  parent: screen,
  top: 0,
  left: 0,
  width: '60%',
  height: '70%',
  border: { type: 'line' },
  style: {
    header: { fg: 'blue', bold: true },
    cell: { fg: 'white' },
    selected: { bg: 'blue' }
  },
  keys: true,
  mouse: true,
  tags: true
});
```

**Custom Blessed Extensions**:
- **Progress Bar Enhancements**: Custom progress bars with threshold colors
- **Sparkline Charts**: Mini charts for metrics visualization
- **Modal Dialogs**: Reusable dialog components
- **Auto-sizing Layouts**: Responsive layout management

### blessed-contrib

**Version**: 4.11+
**Purpose**: Additional UI components for data visualization
**Components Used**:
- Line charts for metrics trending
- Gauge widgets for system monitoring
- Log components for streaming text
- Grid layouts for responsive design

```typescript
// blessed-contrib chart implementation
const cpuChart = contrib.line({
  parent: metricsPanel,
  style: { line: 'yellow', text: 'green', baseline: 'black' },
  xLabelPadding: 3,
  xPadding: 5,
  label: 'CPU Usage (%)',
  showLegend: true,
  wholeNumbersOnly: false
});
```

## 📊 System Monitoring

### systeminformation

**Version**: 5.21+
**Purpose**: Cross-platform system and hardware information
**Capabilities**:
- CPU usage and temperature monitoring
- Memory and swap utilization
- Disk space and I/O statistics
- Network interface monitoring
- Process and service information

```typescript
// systeminformation usage patterns
import * as si from 'systeminformation';

async function collectSystemMetrics(): Promise<SystemMetrics> {
  const [cpu, mem, disk, network] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats()
  ]);

  return {
    cpu: {
      usage: cpu.currentLoad,
      cores: cpu.cpus.length,
      temperature: await si.cpuTemperature()
    },
    memory: {
      total: mem.total,
      used: mem.used,
      usage: (mem.used / mem.total) * 100
    },
    disk: disk.map(d => ({
      filesystem: d.fs,
      size: d.size,
      used: d.used,
      usage: (d.used / d.size) * 100
    })),
    network: network.map(n => ({
      interface: n.iface,
      rxBytes: n.rx_bytes,
      txBytes: n.tx_bytes
    }))
  };
}
```

## 🔧 Development Tools

### pnpm

**Version**: 8.0+
**Purpose**: Fast, disk space efficient package manager
**Benefits**:
- Shared dependency storage across projects
- Strict node_modules structure
- Built-in workspace support
- Faster installation compared to npm/yarn

```yaml
# .pnpmfile.cjs for dependency management
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure consistent peer dependencies
      if (pkg.name === 'blessed-contrib') {
        pkg.peerDependencies = {
          ...pkg.peerDependencies,
          'blessed': '^0.1.81'
        };
      }
      return pkg;
    }
  }
};
```

### PKG (Vercel)

**Version**: 5.8+
**Purpose**: Package Node.js applications into executables
**Configuration**: Multi-platform binary generation

```json
{
  "pkg": {
    "scripts": [
      "dist/**/*.js"
    ],
    "assets": [
      "templates/**/*",
      "config/**/*"
    ],
    "targets": [
      "node18-linux-x64",
      "node18-macos-x64",
      "node18-macos-arm64",
      "node18-win-x64"
    ],
    "outputPath": "binaries"
  }
}
```

**PKG Optimization Strategies**:
- **Bundle Optimization**: Minimize bundle size through tree shaking
- **Asset Management**: Proper inclusion of static assets
- **Platform-Specific Builds**: Optimized binaries for each target platform
- **Startup Performance**: Lazy loading of non-critical modules

## 🐳 Container Integration

### Docker Engine Integration

**API Version**: v1.41+
**Communication**: Direct CLI and REST API integration
**Features Used**:
- Container lifecycle management
- Image operations and registry interaction
- Network and volume management
- Statistics and monitoring
- Event streaming

```typescript
// Docker CLI wrapper implementation
class DockerEngine implements ContainerEngine {
  async listContainers(): Promise<ContainerInfo[]> {
    const command = 'docker ps -a --format "table {{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"';
    const output = await this.execCommand(command);
    return this.parseContainerList(output);
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    const command = `docker stats ${containerId} --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\\t{{.BlockIO}}"`;
    const output = await this.execCommand(command);
    return this.parseStatsOutput(output);
  }

  async streamLogs(containerId: string, callback: LogCallback): Promise<void> {
    const process = spawn('docker', ['logs', '-f', '--timestamps', containerId]);

    process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => callback(this.parseLogLine(line)));
    });
  }
}
```

### Podman Integration

**Version**: 4.0+
**Purpose**: Daemonless container engine alternative
**Compatibility**: Drop-in replacement for Docker commands

```typescript
// Podman-specific adaptations
class PodmanEngine implements ContainerEngine {
  private getSocketPath(): string {
    const uid = process.getuid?.() || 1000;
    return `/run/user/${uid}/podman/podman.sock`;
  }

  async initialize(): Promise<void> {
    // Check if Podman socket is available
    const socketPath = this.getSocketPath();
    if (!await this.fileExists(socketPath)) {
      throw new PodmanError('Podman socket not found. Ensure Podman service is running.');
    }
  }

  // Podman-specific command adaptations
  protected adaptCommand(command: string): string {
    return command
      .replace(/^docker/, 'podman')
      .replace(/--format "table/, '--format table'); // Podman format differences
  }
}
```

## 📝 Configuration Management

### js-yaml

**Version**: 4.1+
**Purpose**: YAML parsing and serialization
**Usage**: Configuration file processing

```typescript
import yaml from 'js-yaml';

// Custom YAML schema for Dockronos configuration
const DOCKRONOS_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  // Custom type for environment variables
  new yaml.Type('!env', {
    kind: 'scalar',
    resolve: (data: string) => typeof data === 'string',
    construct: (data: string) => process.env[data] || data
  }),

  // Custom type for file includes
  new yaml.Type('!include', {
    kind: 'scalar',
    resolve: (data: string) => typeof data === 'string',
    construct: (data: string) => {
      const filePath = resolve(dirname(configPath), data);
      return readFileSync(filePath, 'utf8');
    }
  })
]);

function loadConfiguration(filePath: string): Config {
  const content = readFileSync(filePath, 'utf8');
  return yaml.load(content, { schema: DOCKRONOS_SCHEMA }) as Config;
}
```

### chokidar

**Version**: 3.5+
**Purpose**: Efficient file system watching
**Features**:
- Cross-platform file watching
- Debounced change detection
- Recursive directory monitoring
- Symlink handling

```typescript
import chokidar from 'chokidar';

class ConfigurationWatcher {
  private watcher?: chokidar.FSWatcher;

  startWatching(configPath: string, callback: () => void): void {
    this.watcher = chokidar.watch(configPath, {
      persistent: true,
      ignoreInitial: true,
      atomic: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('change', debounce(callback, 500));
    this.watcher.on('error', error => {
      logger.error('Configuration file watcher error:', error);
    });
  }
}
```

## 🚀 Build and Distribution

### TypeScript Compiler

**Configuration**: Optimized for modern Node.js environments

```typescript
// Advanced TypeScript configuration
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "removeComments": true,
    "importHelpers": true
  },
  "ts-node": {
    "esm": true,
    "module": "ESNext",
    "moduleTypes": {
      "**/*.js": "cjs"
    }
  }
}
```

### ESBuild Integration

**Purpose**: Fast TypeScript compilation and bundling

```typescript
// esbuild configuration for development
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  sourcemap: true,
  minify: false,
  splitting: false,
  external: ['blessed', 'blessed-contrib', 'systeminformation']
});
```

## 🔒 Security Considerations

### Input Validation

```typescript
// Zod schemas for runtime validation
import { z } from 'zod';

const ContainerConfigSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-zA-Z0-9-_]+$/),
  image: z.string().min(1),
  ports: z.array(z.string().regex(/^\d+:\d+$/)).optional(),
  environment: z.array(z.string()).optional(),
  volumes: z.array(z.string()).optional()
});

function validateContainerConfig(config: unknown): ContainerConfig {
  return ContainerConfigSchema.parse(config);
}
```

### Command Injection Prevention

```typescript
// Safe command execution with input sanitization
function sanitizeCommandInput(input: string): string {
  // Remove potentially dangerous characters
  return input.replace(/[;&|`$(){}[\]]/g, '');
}

async function executeContainerCommand(
  engine: ContainerEngine,
  action: string,
  containerId: string
): Promise<string> {
  // Validate inputs
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error(`Invalid action: ${action}`);
  }

  if (!/^[a-f0-9]{12,64}$/.test(containerId)) {
    throw new Error(`Invalid container ID format: ${containerId}`);
  }

  const command = engine.buildCommand(action, containerId);
  return execAsync(command, { timeout: 30000 });
}
```

## 🎯 Performance Optimizations

### Memory Management

```typescript
// Weak references for cache management
class MetricsCache {
  private cache = new Map<string, WeakRef<CachedMetrics>>();
  private registry = new FinalizationRegistry((key: string) => {
    this.cache.delete(key);
  });

  set(key: string, value: CachedMetrics): void {
    const ref = new WeakRef(value);
    this.cache.set(key, ref);
    this.registry.register(value, key);
  }

  get(key: string): CachedMetrics | undefined {
    const ref = this.cache.get(key);
    if (!ref) return undefined;

    const value = ref.deref();
    if (!value) {
      this.cache.delete(key);
      return undefined;
    }

    return value;
  }
}
```

### Async Operations Optimization

```typescript
// Concurrent operations with proper error handling
async function refreshAllData(): Promise<void> {
  const operations = [
    () => containerEngine.listContainers(),
    () => metricsCollector.collectSystemMetrics(),
    () => logStreamer.getRecentLogs(),
    () => configManager.checkForUpdates()
  ];

  const results = await Promise.allSettled(operations.map(op => op()));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn(`Operation ${index} failed:`, result.reason);
    }
  });
}
```

## 🧪 Testing Infrastructure

### Node.js Test Runner

**Built-in Testing**: Using Node.js 18+ native test runner

```typescript
// test/container-engine.test.ts
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Container Engine', () => {
  test('should list containers correctly', async () => {
    const engine = new DockerEngine();
    const containers = await engine.listContainers();

    assert(Array.isArray(containers));
    containers.forEach(container => {
      assert(typeof container.id === 'string');
      assert(typeof container.name === 'string');
      assert(['running', 'stopped', 'paused'].includes(container.status));
    });
  });
});
```

### Mock Implementations

```typescript
// Mock container engine for testing
class MockContainerEngine implements ContainerEngine {
  private mockContainers: ContainerInfo[] = [
    {
      id: 'mock-1',
      name: 'test-container',
      image: 'nginx:latest',
      status: 'running',
      ports: ['80:8080']
    }
  ];

  async listContainers(): Promise<ContainerInfo[]> {
    return Promise.resolve([...this.mockContainers]);
  }

  async startContainer(id: string): Promise<void> {
    const container = this.mockContainers.find(c => c.id === id);
    if (container) container.status = 'running';
  }
}
```

## 📈 Monitoring and Observability

### Structured Logging

```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({
      filename: 'logs/dockronos.log',
      format: format.json()
    })
  ]
});
```

### Performance Metrics

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, PerformanceEntry[]>();

  measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();

    return operation().finally(() => {
      const end = performance.now();
      this.recordMetric(name, end - start);
    });
  }

  private recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const entries = this.metrics.get(name)!;
    entries.push({ name, duration, timestamp: Date.now() });

    // Keep only last 100 entries
    if (entries.length > 100) {
      entries.shift();
    }
  }
}
```

---

*This technology stack provides a robust foundation for Dockronos, balancing modern development practices with performance requirements and cross-platform compatibility. Each technology choice supports the application's core goals of reliability, usability, and maintainability.*