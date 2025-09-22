# Stack Tecnológico

Dockronos aprovecha un stack tecnológico cuidadosamente seleccionado diseñado para alto rendimiento, confiabilidad y excelente experiencia de desarrollador. Este documento proporciona detalles completos sobre cada elección tecnológica, patrones de implementación y decisiones arquitectónicas.

## 🏗️ Tecnologías Principales

### Runtime Node.js

**Versión**: 18.0+
**Propósito**: Entorno de ejecución JavaScript/TypeScript
**Características Clave Utilizadas**:
- Soporte de ES Modules para JavaScript moderno
- Worker Threads para operaciones intensivas de CPU
- Stream API para procesamiento eficiente de datos
- File System Watchers para monitoreo de configuración
- Gestión de procesos para interacciones con contenedores

```typescript
// Configuración de Node.js ES Modules
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

**Por qué Node.js 18+**:
- Soporte nativo de ES Modules sin flags experimentales
- Rendimiento y gestión de memoria mejorados
- Test runner integrado (usado para desarrollo)
- Características de seguridad mejoradas
- Disponibilidad de soporte a largo plazo (LTS)

### TypeScript

**Versión**: 5.3+
**Propósito**: Desarrollo JavaScript con type-safety
**Configuración**: Modo strict con verificación de tipos avanzada

```typescript
// Aspectos destacados de tsconfig.json
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

**Características Avanzadas de TypeScript**:
- **Template Literal Types**: Para validación dinámica de strings
- **Conditional Types**: Para transformaciones complejas de tipos
- **Mapped Types**: Para validación de objetos de configuración
- **Brand Types**: Para identificadores type-safe
- **Utility Types**: Uso extensivo de utilidades integradas y personalizadas

```typescript
// Ejemplo: Brand types para identificadores de contenedores
type ContainerId = string & { readonly __brand: unique symbol };
type ContainerName = string & { readonly __brand: unique symbol };

// Template literal types para rutas de configuración
type ConfigPath = `${string}.yml` | `${string}.yaml`;

// Conditional types para operaciones específicas del motor
type EngineCommand<T extends ContainerEngine> =
  T extends 'docker' ? DockerCommand :
  T extends 'podman' ? PodmanCommand :
  never;
```

## 🖥️ Interfaz de Usuario de Terminal

### blessed.js

**Versión**: 0.1.81+
**Propósito**: Framework TUI para aplicaciones de consola interactivas
**Características Clave**:
- Compatibilidad multiplataforma de terminal
- Componentes UI dirigidos por eventos
- Manejo de entrada de mouse y teclado
- Gestión de buffer de pantalla
- Soporte de colores y estilos

```typescript
// Ejemplo de creación de widget blessed.js
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

**Extensiones Personalizadas de Blessed**:
- **Mejoras de Progress Bar**: Barras de progreso personalizadas con colores de umbral
- **Sparkline Charts**: Mini gráficos para visualización de métricas
- **Modal Dialogs**: Componentes de diálogo reutilizables
- **Auto-sizing Layouts**: Gestión de layout responsivo

### blessed-contrib

**Versión**: 4.11+
**Propósito**: Componentes UI adicionales para visualización de datos
**Componentes Utilizados**:
- Line charts para tendencias de métricas
- Gauge widgets para monitoreo del sistema
- Log components para texto streaming
- Grid layouts para diseño responsivo

```typescript
// Implementación de gráfico blessed-contrib
const cpuChart = contrib.line({
  parent: metricsPanel,
  style: { line: 'yellow', text: 'green', baseline: 'black' },
  xLabelPadding: 3,
  xPadding: 5,
  label: 'Uso de CPU (%)',
  showLegend: true,
  wholeNumbersOnly: false
});
```

## 📊 Monitoreo del Sistema

### systeminformation

**Versión**: 5.21+
**Propósito**: Información multiplataforma de sistema y hardware
**Capacidades**:
- Monitoreo de uso y temperatura de CPU
- Utilización de memoria y swap
- Estadísticas de espacio en disco y E/S
- Monitoreo de interfaces de red
- Información de procesos y servicios

```typescript
// Patrones de uso de systeminformation
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

## 🔧 Herramientas de Desarrollo

### pnpm

**Versión**: 8.0+
**Propósito**: Gestor de paquetes rápido y eficiente en espacio de disco
**Beneficios**:
- Almacenamiento compartido de dependencias entre proyectos
- Estructura estricta de node_modules
- Soporte integrado para workspaces
- Instalación más rápida comparado con npm/yarn

```yaml
# .pnpmfile.cjs para gestión de dependencias
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Asegurar peer dependencies consistentes
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

**Versión**: 5.8+
**Propósito**: Empaquetar aplicaciones Node.js en ejecutables
**Configuración**: Generación de binarios multiplataforma

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

**Estrategias de Optimización PKG**:
- **Optimización de Bundle**: Minimizar tamaño de bundle a través de tree shaking
- **Gestión de Assets**: Inclusión apropiada de assets estáticos
- **Builds Específicos de Plataforma**: Binarios optimizados para cada plataforma objetivo
- **Rendimiento de Inicio**: Carga lazy de módulos no críticos

## 🐳 Integración de Contenedores

### Integración con Docker Engine

**Versión API**: v1.41+
**Comunicación**: Integración directa CLI y REST API
**Características Utilizadas**:
- Gestión del ciclo de vida de contenedores
- Operaciones de imágenes e interacción con registry
- Gestión de redes y volúmenes
- Estadísticas y monitoreo
- Streaming de eventos

```typescript
// Implementación de wrapper Docker CLI
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

### Integración con Podman

**Versión**: 4.0+
**Propósito**: Alternativa de motor de contenedores sin demonio
**Compatibilidad**: Reemplazo drop-in para comandos Docker

```typescript
// Adaptaciones específicas de Podman
class PodmanEngine implements ContainerEngine {
  private getSocketPath(): string {
    const uid = process.getuid?.() || 1000;
    return `/run/user/${uid}/podman/podman.sock`;
  }

  async initialize(): Promise<void> {
    // Verificar si el socket de Podman está disponible
    const socketPath = this.getSocketPath();
    if (!await this.fileExists(socketPath)) {
      throw new PodmanError('Socket de Podman no encontrado. Asegurate de que el servicio Podman esté ejecutándose.');
    }
  }

  // Adaptaciones de comandos específicas de Podman
  protected adaptCommand(command: string): string {
    return command
      .replace(/^docker/, 'podman')
      .replace(/--format "table/, '--format table'); // Diferencias de formato de Podman
  }
}
```

## 📝 Gestión de Configuración

### js-yaml

**Versión**: 4.1+
**Propósito**: Parsing y serialización YAML
**Uso**: Procesamiento de archivos de configuración

```typescript
import yaml from 'js-yaml';

// Schema YAML personalizado para configuración de Dockronos
const DOCKRONOS_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  // Tipo personalizado para variables de entorno
  new yaml.Type('!env', {
    kind: 'scalar',
    resolve: (data: string) => typeof data === 'string',
    construct: (data: string) => process.env[data] || data
  }),

  // Tipo personalizado para includes de archivos
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

**Versión**: 3.5+
**Propósito**: Observación eficiente del sistema de archivos
**Características**:
- Observación de archivos multiplataforma
- Detección de cambios con debounce
- Monitoreo recursivo de directorios
- Manejo de symlinks

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
      logger.error('Error en el observador de archivo de configuración:', error);
    });
  }
}
```

## 🚀 Build y Distribución

### Compilador TypeScript

**Configuración**: Optimizado para entornos Node.js modernos

```typescript
// Configuración avanzada de TypeScript
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

### Integración ESBuild

**Propósito**: Compilación y bundling rápido de TypeScript

```typescript
// configuración de esbuild para desarrollo
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

## 🔒 Consideraciones de Seguridad

### Validación de Entrada

```typescript
// Schemas Zod para validación en runtime
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

### Prevención de Inyección de Comandos

```typescript
// Ejecución segura de comandos con sanitización de entrada
function sanitizeCommandInput(input: string): string {
  // Remover caracteres potencialmente peligrosos
  return input.replace(/[;&|`$(){}[\]]/g, '');
}

async function executeContainerCommand(
  engine: ContainerEngine,
  action: string,
  containerId: string
): Promise<string> {
  // Validar entradas
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error(`Acción inválida: ${action}`);
  }

  if (!/^[a-f0-9]{12,64}$/.test(containerId)) {
    throw new Error(`Formato de ID de contenedor inválido: ${containerId}`);
  }

  const command = engine.buildCommand(action, containerId);
  return execAsync(command, { timeout: 30000 });
}
```

## 🎯 Optimizaciones de Rendimiento

### Gestión de Memoria

```typescript
// Referencias débiles para gestión de caché
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

### Optimización de Operaciones Async

```typescript
// Operaciones concurrentes con manejo apropiado de errores
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
      logger.warn(`Operación ${index} falló:`, result.reason);
    }
  });
}
```

## 🧪 Infraestructura de Testing

### Test Runner de Node.js

**Testing Integrado**: Usando el test runner nativo de Node.js 18+

```typescript
// test/container-engine.test.ts
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Motor de Contenedores', () => {
  test('debería listar contenedores correctamente', async () => {
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

### Implementaciones Mock

```typescript
// Mock del motor de contenedores para testing
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

## 📈 Monitoreo y Observabilidad

### Logging Estructurado

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

### Métricas de Rendimiento

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

    // Mantener solo las últimas 100 entradas
    if (entries.length > 100) {
      entries.shift();
    }
  }
}
```

---

*Este stack tecnológico proporciona una base robusta para Dockronos, balanceando prácticas de desarrollo modernas con requisitos de rendimiento y compatibilidad multiplataforma. Cada elección tecnológica apoya los objetivos centrales de la aplicación de confiabilidad, usabilidad y mantenibilidad.*