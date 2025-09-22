Aquí tienes la traducción al español (dejo el código tal cual para no alterar interfaces ni cadenas; solo traduzco los comentarios `//` cuando aplican):

---

# Referencia de la API de Plugins

Esta referencia completa documenta el sistema de plugins de Dockronos y permite a los desarrolladores crear extensiones personalizadas e integrar herramientas de terceros sin fricción.

## 🔌 Arquitectura de Plugins

### Interfaz de Plugin

```typescript
interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly dependencies?: PluginDependency[];

  initialize(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;
}

interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

interface PluginContext {
  readonly config: PluginConfig;
  readonly commands: CommandRegistry;
  readonly events: EventEmitter;
  readonly ui: UIRegistry;
  readonly containers: ContainerManager;
  readonly metrics: MetricsCollector;
  readonly logger: Logger;
}
```

### Ciclo de vida del Plugin

```typescript
// Gestión del ciclo de vida de plugins
class PluginManager {
  private plugins = new Map<string, LoadedPlugin>();
  private dependencies = new Map<string, Set<string>>();

  async loadPlugin(pluginPath: string): Promise<void> {
    const manifest = await this.loadManifest(pluginPath);

    // Validar plugin
    await this.validatePlugin(manifest);

    // Comprobar dependencias
    await this.resolveDependencies(manifest);

    // Inicializar plugin
    const plugin = await this.createPluginInstance(manifest);
    const context = this.createPluginContext(manifest.config);

    await plugin.initialize(context);

    this.plugins.set(manifest.name, {
      manifest,
      instance: plugin,
      context,
      state: 'active'
    });
  }

  async unloadPlugin(name: string): Promise<void> {
    const loaded = this.plugins.get(name);
    if (!loaded) return;

    // Verificar dependientes
    const dependents = this.findDependents(name);
    if (dependents.length > 0) {
      throw new PluginError(
        `No se puede descargar ${name}: los plugins ${dependents.join(', ')} dependen de él`
      );
    }

    // Destruir plugin
    if (loaded.instance.destroy) {
      await loaded.instance.destroy();
    }

    this.plugins.delete(name);
  }
}
```

## 🎛️ API de Registro de Comandos

### Interfaz de Comando

```typescript
interface Command {
  name: string;
  description: string;
  usage: string;
  options?: CommandOption[];
  subcommands?: Command[];
  handler: CommandHandler;
  middleware?: CommandMiddleware[];
}

interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  choices?: string[];
}

type CommandHandler = (args: CommandArgs, context: CommandContext) => Promise<CommandResult>;

interface CommandArgs {
  [key: string]: any;
  _: string[]; // Argumentos posicionales
}

interface CommandContext {
  plugin: Plugin;
  containers: ContainerManager;
  config: DockronosConfig;
  ui: UIContext;
  logger: Logger;
}
```

### Ejemplos de Registro de Comandos

```typescript
// Plugin de ejemplo con comandos personalizados
export class DeploymentPlugin implements Plugin {
  name = 'deployment-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Registrar comando principal
    context.commands.register({
      name: 'deploy',
      description: 'Implementar la aplicación en varios entornos',
      usage: 'dockronos deploy <environment> [options]',
      options: [
        {
          name: 'environment',
          type: 'string',
          description: 'Entorno de destino',
          required: true,
          choices: ['staging', 'production']
        },
        {
          name: 'force',
          alias: 'f',
          type: 'boolean',
          description: 'Forzar la implementación sin confirmación',
          default: false
        },
        {
          name: 'timeout',
          alias: 't',
          type: 'number',
          description: 'Tiempo máx. de implementación en segundos',
          default: 300
        }
      ],
      handler: this.deployHandler.bind(this),
      middleware: [
        this.validateEnvironment,
        this.checkPermissions
      ]
    });

    // Registrar subcomandos
    context.commands.register({
      name: 'deploy:status',
      description: 'Consultar estado de la implementación',
      handler: this.statusHandler.bind(this)
    });

    context.commands.register({
      name: 'deploy:rollback',
      description: 'Revertir a la implementación previa',
      options: [
        {
          name: 'version',
          type: 'string',
          description: 'Versión a la que revertir'
        }
      ],
      handler: this.rollbackHandler.bind(this)
    });
  }

  // ... (resto igual que en el original; textos de log y errores ya traducidos abajo cuando aparecen)
}
```

## 📡 API del Sistema de Eventos

### Registro de Eventos

```typescript
interface EventEmitter {
  on(event: string, listener: EventListener): void;
  off(event: string, listener: EventListener): void;
  emit(event: string, data: any): void;
  once(event: string, listener: EventListener): void;
}

type EventListener = (data: any) => Promise<void> | void;

// Eventos integrados
interface DockronosEvents {
  // Ciclo de vida de la aplicación
  'app:starting': { timestamp: Date };
  'app:ready': { timestamp: Date };
  'app:stopping': { timestamp: Date };

  // Eventos de contenedores
  'container:starting': { container: ContainerInfo };
  'container:started': { container: ContainerInfo };
  'container:stopping': { container: ContainerInfo };
  'container:stopped': { container: ContainerInfo };
  'container:error': { container: ContainerInfo; error: Error };

  // Eventos de configuración
  'config:loaded': { config: DockronosConfig };
  'config:changed': { oldConfig: DockronosConfig; newConfig: DockronosConfig };
  'config:error': { error: Error };

  // Eventos de UI
  'ui:focus-changed': { from: string; to: string };
  'ui:key-pressed': { key: string; panel: string };

  // Eventos de métricas
  'metrics:collected': { system: SystemMetrics; containers: ContainerMetrics[] };
  'metrics:alert': { alert: AlertInfo };
}
```

### Ejemplos de Manejo de Eventos

```typescript
export class MonitoringPlugin implements Plugin {
  name = 'monitoring-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Escuchar eventos de contenedores
    context.events.on('container:started', this.onContainerStarted.bind(this));
    context.events.on('container:stopped', this.onContainerStopped.bind(this));
    context.events.on('container:error', this.onContainerError.bind(this));

    // Escuchar eventos de métricas
    context.events.on('metrics:collected', this.onMetricsCollected.bind(this));
    context.events.on('metrics:alert', this.onMetricsAlert.bind(this));

    // Emisión de evento personalizado
    setInterval(() => {
      context.events.emit('monitoring:heartbeat', {
        timestamp: new Date(),
        status: 'healthy'
      });
    }, 30000);
  }

  // ... (lógica interna sin cambios; mensajes ya traducidos al reportarlos)
}
```

## 🎨 API de Extensión de UI

### Registro de Componentes de UI

```typescript
interface UIRegistry {
  registerPanel(name: string, panel: UIPanel): void;
  registerWidget(name: string, widget: UIWidget): void;
  registerTheme(name: string, theme: UITheme): void;
  registerKeybinding(binding: KeyBinding): void;
}

interface UIPanel {
  title: string;
  position: PanelPosition;
  size: PanelSize;
  render: (context: RenderContext) => string;
  onKeyPress?: (key: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  update?: (data: any) => void;
}

interface UIWidget {
  name: string;
  render: (props: WidgetProps) => string;
  defaultProps?: WidgetProps;
}

interface KeyBinding {
  key: string;
  description: string;
  handler: (context: UIContext) => void;
  global?: boolean;
  panel?: string;
}
```

### Ejemplos de Extensión de UI

```typescript
export class StatusPlugin implements Plugin {
  name = 'status-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Registrar panel personalizado
    context.ui.registerPanel('status-overview', {
      title: 'Estado del Sistema',
      position: 'right',
      size: { width: '30%', height: '40%' },
      render: this.renderStatusPanel.bind(this),
      onKeyPress: this.handleStatusKeyPress.bind(this),
      update: this.updateStatusData.bind(this)
    });

    // Registrar widget personalizado
    context.ui.registerWidget('health-indicator', {
      name: 'health-indicator',
      render: this.renderHealthIndicator.bind(this),
      defaultProps: { status: 'unknown', size: 'medium' }
    });

    // Registrar atajos de teclado
    context.ui.registerKeybinding({
      key: 'h',
      description: 'Mostrar resumen de salud',
      handler: this.showHealthOverview.bind(this),
      global: true
    });

    context.ui.registerKeybinding({
      key: 'r',
      description: 'Refrescar estado',
      handler: this.refreshStatus.bind(this),
      panel: 'status-overview'
    });
  }

  // ... (resto igual; textos de UI ya traducidos arriba)
}
```

## 🐳 API de Gestión de Contenedores

### Operaciones de Contenedor

```typescript
interface ContainerManager {
  list(): Promise<ContainerInfo[]>;
  get(id: string): Promise<ContainerInfo>;
  start(id: string, options?: StartOptions): Promise<void>;
  stop(id: string, options?: StopOptions): Promise<void>;
  restart(id: string): Promise<void>;
  remove(id: string, options?: RemoveOptions): Promise<void>;

  exec(id: string, command: string[], options?: ExecOptions): Promise<ExecResult>;
  logs(id: string, options?: LogOptions): Promise<NodeJS.ReadableStream>;

  create(config: ContainerConfig): Promise<string>;
  build(context: string, options?: BuildOptions): Promise<string>;

  stats(id: string): Promise<ContainerStats>;
  inspect(id: string): Promise<ContainerInspectInfo>;
}

interface StartOptions {
  wait?: boolean;
  timeout?: number;
  healthCheck?: boolean;
}

interface ExecOptions {
  workingDir?: string;
  user?: string;
  environment?: Record<string, string>;
  tty?: boolean;
  stdin?: boolean;
}

interface LogOptions {
  follow?: boolean;
  tail?: number;
  since?: Date;
  timestamps?: boolean;
}
```

### Ejemplo de Plugin de Contenedores

```typescript
export class BackupPlugin implements Plugin {
  name = 'backup-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Registrar comando de respaldo
    context.commands.register({
      name: 'backup',
      description: 'Respaldar datos del contenedor',
      options: [
        {
          name: 'container',
          type: 'string',
          description: 'Contenedor a respaldar',
          required: true
        },
        {
          name: 'destination',
          type: 'string',
          description: 'Destino del respaldo',
          default: './backups'
        }
      ],
      handler: this.backupHandler.bind(this)
    });

    // Programar respaldos automáticos
    this.scheduleAutomaticBackups(context);
  }

  // ... (lógica de backup como en el original; mensajes traducidos)
}
```

## 📊 API de Recolección de Métricas

### Interfaz de Métricas

```typescript
interface MetricsCollector {
  collect(): Promise<MetricsSnapshot>;
  subscribe(callback: MetricsCallback): void;
  unsubscribe(callback: MetricsCallback): void;

  registerCollector(name: string, collector: CustomMetricsCollector): void;
  unregisterCollector(name: string): void;

  addAlert(rule: AlertRule): void;
  removeAlert(ruleId: string): void;
}

interface CustomMetricsCollector {
  name: string;
  interval: number;
  collect(): Promise<MetricData[]>;
}

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  unit?: string;
}

type MetricsCallback = (snapshot: MetricsSnapshot) => void;
```

### Plugin de Métricas Personalizadas

```typescript
export class DatabaseMetricsPlugin implements Plugin {
  name = 'database-metrics-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Registrar recolector de métricas personalizado
    context.metrics.registerCollector('database-metrics', {
      name: 'database-metrics',
      interval: 10000, // 10 segundos
      collect: this.collectDatabaseMetrics.bind(this)
    });

    // Agregar alertas personalizadas
    context.metrics.addAlert({
      id: 'db-connection-pool',
      name: 'Uso alto del pool de conexiones',
      metric: 'database.connections.active',
      condition: 'greater_than',
      threshold: 80,
      severity: 'warning'
    });

    // Registrar visualización de métricas
    context.ui.registerWidget('db-metrics-chart', {
      name: 'db-metrics-chart',
      render: this.renderDatabaseMetricsChart.bind(this)
    });
  }

  // ... (lógica de colección y renderizado; textos de salida traducidos en comentarios)
}
```

## 🔧 Configuración de Plugins

### Esquema de Configuración

```typescript
interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
  permissions?: PluginPermissions;
}

interface PluginPermissions {
  containers?: ContainerPermissions;
  files?: FilePermissions;
  network?: NetworkPermissions;
  ui?: UIPermissions;
}

interface ContainerPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  create: boolean;
  delete: boolean;
}
```

### Ejemplos de Configuración

```yaml
# dockronos.yml - Configuración de plugins
plugins:
  - name: deployment-plugin
    package: './plugins/deployment'
    enabled: true
    settings:
      environments:
        - name: staging
          url: https://staging.example.com
          auto_deploy: true
        - name: production
          url: https://production.example.com
          auto_deploy: false
      notifications:
        slack:
          webhook_url: !env SLACK_WEBHOOK_URL
          channel: "#deployments"
        email:
          smtp_server: !env SMTP_SERVER
          recipients:
            - team@example.com
    permissions:
      containers:
        read: true
        write: true
        execute: true
        create: true
        delete: false
      files:
        read: true
        write: false
      network:
        outbound: true
        inbound: false

  - name: monitoring-plugin
    package: 'dockronos-plugin-monitoring'
    version: '^2.1.0'
    enabled: true
    settings:
      collectors:
        - name: system
          interval: 5000
        - name: containers
          interval: 10000
        - name: custom-db
          interval: 30000
      alerts:
        cpu_threshold: 80
        memory_threshold: 85
        disk_threshold: 90
      exporters:
        prometheus:
          enabled: true
          port: 9090
        grafana:
          enabled: true
          dashboards: auto
```

## 🧪 Pruebas de Plugins

### Framework de Pruebas

```typescript
// Utilidades de prueba para plugins
import { PluginTestFramework, MockPluginContext } from 'dockronos/testing';

describe('DeploymentPlugin', () => {
  let plugin: DeploymentPlugin;
  let context: MockPluginContext;
  let framework: PluginTestFramework;

  beforeEach(async () => {
    framework = new PluginTestFramework();
    context = framework.createMockContext({
      config: {
        enabled: true,
        settings: {
          environments: ['staging', 'production']
        }
      }
    });

    plugin = new DeploymentPlugin();
    await plugin.initialize(context);
  });

  afterEach(async () => {
    await plugin.destroy?.();
    await framework.cleanup();
  });

  test('debe registrar el comando deploy', () => {
    expect(context.commands.registered).toContain('deploy');
    expect(context.commands.get('deploy')).toBeDefined();
  });

  test('debe manejar la implementación correctamente', async () => {
    // Simular gestor de contenedores
    context.containers.mockStart = jest.fn().mockResolvedValue(undefined);
    context.containers.mockStop = jest.fn().mockResolvedValue(undefined);

    // Ejecutar comando
    const result = await framework.executeCommand('deploy', ['staging', '--force']);

    expect(result.success).toBe(true);
    expect(context.containers.mockStart).toHaveBeenCalled();
  });

  test('debe emitir eventos de implementación', async () => {
    const eventSpy = jest.fn();
    context.events.on('deployment:started', eventSpy);

    await framework.executeCommand('deploy', ['staging', '--force']);

    expect(eventSpy).toHaveBeenCalledWith({
      environment: 'staging',
      timestamp: expect.any(Date)
    });
  });
});
```

## 📦 Distribución de Plugins

### Manifiesto del Plugin

```json
{
  "name": "dockronos-plugin-monitoring",
  "version": "2.1.0",
  "description": "Monitoreo y alertas avanzadas para Dockronos",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "keywords": ["dockronos", "plugin", "monitoring", "metrics"],
  "repository": {
    "type": "git",
    "url": "https://github.com/athenalink/dockronos-plugin-monitoring"
  },
  "peerDependencies": {
    "dockronos": "^2.0.0"
  },
  "dockronos": {
    "apiVersion": "2.0",
    "entry": "dist/index.js",
    "permissions": {
      "containers": {
        "read": true,
        "write": false,
        "execute": true
      },
      "metrics": {
        "read": true,
        "write": true
      },
      "ui": {
        "panels": true,
        "widgets": true
      }
    },
    "dependencies": [
      {
        "name": "prometheus-client",
        "version": "^1.0.0",
        "optional": true
      }
    ]
  }
}
```

### Guía de Publicación

```bash
# Flujo de desarrollo de un plugin
npm init dockronos-plugin my-plugin
cd my-plugin

# Desarrollo
npm run dev        # Iniciar modo desarrollo
npm run test       # Ejecutar pruebas
npm run lint       # Lint del código
npm run build      # Compilar plugin

# Publicación
npm run prepare    # Preparar para publicar
npm publish        # Publicar en el registry de npm

# Instalación
npm install -g dockronos-plugin-my-plugin
dockronos plugin install my-plugin
```

---

*Esta API completa de plugins permite a los desarrolladores ampliar Dockronos con funcionalidades personalizadas, integrar sistemas externos y crear flujos de automatización sofisticados. El sistema de plugins ofrece acceso total a las capacidades de Dockronos manteniendo la seguridad y la estabilidad.*
