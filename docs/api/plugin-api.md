# Plugin API Reference

This comprehensive API reference documents the plugin system for Dockronos, enabling developers to create custom extensions and integrate third-party tools seamlessly.

## 🔌 Plugin Architecture

### Plugin Interface

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

### Plugin Lifecycle

```typescript
// Plugin lifecycle management
class PluginManager {
  private plugins = new Map<string, LoadedPlugin>();
  private dependencies = new Map<string, Set<string>>();

  async loadPlugin(pluginPath: string): Promise<void> {
    const manifest = await this.loadManifest(pluginPath);

    // Validate plugin
    await this.validatePlugin(manifest);

    // Check dependencies
    await this.resolveDependencies(manifest);

    // Initialize plugin
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

    // Check for dependents
    const dependents = this.findDependents(name);
    if (dependents.length > 0) {
      throw new PluginError(
        `Cannot unload ${name}: plugins ${dependents.join(', ')} depend on it`
      );
    }

    // Destroy plugin
    if (loaded.instance.destroy) {
      await loaded.instance.destroy();
    }

    this.plugins.delete(name);
  }
}
```

## 🎛️ Command Registration API

### Command Interface

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
  _: string[]; // Positional arguments
}

interface CommandContext {
  plugin: Plugin;
  containers: ContainerManager;
  config: DockronosConfig;
  ui: UIContext;
  logger: Logger;
}
```

### Command Registration Examples

```typescript
// Example plugin with custom commands
export class DeploymentPlugin implements Plugin {
  name = 'deployment-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Register main command
    context.commands.register({
      name: 'deploy',
      description: 'Deploy application to various environments',
      usage: 'dockronos deploy <environment> [options]',
      options: [
        {
          name: 'environment',
          type: 'string',
          description: 'Target environment',
          required: true,
          choices: ['staging', 'production']
        },
        {
          name: 'force',
          alias: 'f',
          type: 'boolean',
          description: 'Force deployment without confirmation',
          default: false
        },
        {
          name: 'timeout',
          alias: 't',
          type: 'number',
          description: 'Deployment timeout in seconds',
          default: 300
        }
      ],
      handler: this.deployHandler.bind(this),
      middleware: [
        this.validateEnvironment,
        this.checkPermissions
      ]
    });

    // Register subcommands
    context.commands.register({
      name: 'deploy:status',
      description: 'Check deployment status',
      handler: this.statusHandler.bind(this)
    });

    context.commands.register({
      name: 'deploy:rollback',
      description: 'Rollback to previous deployment',
      options: [
        {
          name: 'version',
          type: 'string',
          description: 'Version to rollback to'
        }
      ],
      handler: this.rollbackHandler.bind(this)
    });
  }

  private async deployHandler(
    args: CommandArgs,
    context: CommandContext
  ): Promise<CommandResult> {
    const { environment, force, timeout } = args;

    context.logger.info(`Starting deployment to ${environment}`);

    try {
      // Pre-deployment checks
      await this.runPreDeploymentChecks(environment, context);

      // Confirmation prompt (unless forced)
      if (!force) {
        const confirmed = await context.ui.confirm(
          `Deploy to ${environment}? This action cannot be undone.`
        );
        if (!confirmed) {
          return { success: false, message: 'Deployment cancelled by user' };
        }
      }

      // Execute deployment
      const result = await this.executeDeployment(environment, timeout, context);

      return {
        success: true,
        message: `Successfully deployed to ${environment}`,
        data: result
      };

    } catch (error) {
      context.logger.error('Deployment failed:', error);
      return {
        success: false,
        message: `Deployment failed: ${error.message}`,
        error
      };
    }
  }

  private validateEnvironment: CommandMiddleware = async (args, context, next) => {
    const validEnvironments = ['staging', 'production'];
    if (!validEnvironments.includes(args.environment)) {
      throw new CommandError(`Invalid environment: ${args.environment}`);
    }
    return next();
  };

  private checkPermissions: CommandMiddleware = async (args, context, next) => {
    const hasPermission = await this.checkDeploymentPermissions(
      args.environment,
      context
    );
    if (!hasPermission) {
      throw new CommandError('Insufficient permissions for deployment');
    }
    return next();
  };
}
```

## 📡 Event System API

### Event Registration

```typescript
interface EventEmitter {
  on(event: string, listener: EventListener): void;
  off(event: string, listener: EventListener): void;
  emit(event: string, data: any): void;
  once(event: string, listener: EventListener): void;
}

type EventListener = (data: any) => Promise<void> | void;

// Built-in events
interface DockronosEvents {
  // Application lifecycle
  'app:starting': { timestamp: Date };
  'app:ready': { timestamp: Date };
  'app:stopping': { timestamp: Date };

  // Container events
  'container:starting': { container: ContainerInfo };
  'container:started': { container: ContainerInfo };
  'container:stopping': { container: ContainerInfo };
  'container:stopped': { container: ContainerInfo };
  'container:error': { container: ContainerInfo; error: Error };

  // Configuration events
  'config:loaded': { config: DockronosConfig };
  'config:changed': { oldConfig: DockronosConfig; newConfig: DockronosConfig };
  'config:error': { error: Error };

  // UI events
  'ui:focus-changed': { from: string; to: string };
  'ui:key-pressed': { key: string; panel: string };

  // Metrics events
  'metrics:collected': { system: SystemMetrics; containers: ContainerMetrics[] };
  'metrics:alert': { alert: AlertInfo };
}
```

### Event Handling Examples

```typescript
export class MonitoringPlugin implements Plugin {
  name = 'monitoring-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Listen to container events
    context.events.on('container:started', this.onContainerStarted.bind(this));
    context.events.on('container:stopped', this.onContainerStopped.bind(this));
    context.events.on('container:error', this.onContainerError.bind(this));

    // Listen to metrics events
    context.events.on('metrics:collected', this.onMetricsCollected.bind(this));
    context.events.on('metrics:alert', this.onMetricsAlert.bind(this));

    // Custom event emission
    setInterval(() => {
      context.events.emit('monitoring:heartbeat', {
        timestamp: new Date(),
        status: 'healthy'
      });
    }, 30000);
  }

  private async onContainerStarted(data: { container: ContainerInfo }): Promise<void> {
    const { container } = data;

    // Register container with monitoring system
    await this.registerContainerMonitoring(container);

    // Send notification
    await this.sendNotification({
      type: 'container_started',
      message: `Container ${container.name} started successfully`,
      level: 'info'
    });
  }

  private async onMetricsAlert(data: { alert: AlertInfo }): Promise<void> {
    const { alert } = data;

    // Send alert to external systems
    await this.sendToSlack(alert);
    await this.sendToPagerDuty(alert);

    // Log alert
    context.logger.warn('Metrics alert triggered', { alert });
  }
}
```

## 🎨 UI Extension API

### UI Component Registration

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

### UI Extension Examples

```typescript
export class StatusPlugin implements Plugin {
  name = 'status-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Register custom panel
    context.ui.registerPanel('status-overview', {
      title: 'System Status',
      position: 'right',
      size: { width: '30%', height: '40%' },
      render: this.renderStatusPanel.bind(this),
      onKeyPress: this.handleStatusKeyPress.bind(this),
      update: this.updateStatusData.bind(this)
    });

    // Register custom widget
    context.ui.registerWidget('health-indicator', {
      name: 'health-indicator',
      render: this.renderHealthIndicator.bind(this),
      defaultProps: { status: 'unknown', size: 'medium' }
    });

    // Register keybindings
    context.ui.registerKeybinding({
      key: 'h',
      description: 'Show health overview',
      handler: this.showHealthOverview.bind(this),
      global: true
    });

    context.ui.registerKeybinding({
      key: 'r',
      description: 'Refresh status',
      handler: this.refreshStatus.bind(this),
      panel: 'status-overview'
    });
  }

  private renderStatusPanel(context: RenderContext): string {
    const { width, height } = context.size;
    const data = this.getStatusData();

    return blessed.box({
      width,
      height,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
      content: this.formatStatusContent(data)
    });
  }

  private renderHealthIndicator(props: WidgetProps): string {
    const { status, size } = props;
    const color = this.getStatusColor(status);
    const symbol = this.getStatusSymbol(status);

    return `{${color}-fg}${symbol}{/${color}-fg}`;
  }

  private formatStatusContent(data: StatusData): string {
    return `
{bold}System Health Overview{/bold}

CPU Usage: ${this.renderProgressBar(data.cpu.usage, 100)}
Memory: ${this.renderProgressBar(data.memory.usage, 100)}
Disk: ${this.renderProgressBar(data.disk.usage, 100)}

{bold}Services Status{/bold}
${data.services.map(service =>
  `${this.renderHealthIndicator({ status: service.status })} ${service.name}`
).join('\n')}

{bold}Recent Alerts{/bold}
${data.alerts.slice(0, 5).map(alert =>
  `{${alert.level}-fg}${alert.timestamp} - ${alert.message}{/${alert.level}-fg}`
).join('\n')}
    `.trim();
  }
}
```

## 🐳 Container Management API

### Container Operations

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

### Container Plugin Example

```typescript
export class BackupPlugin implements Plugin {
  name = 'backup-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Register backup command
    context.commands.register({
      name: 'backup',
      description: 'Backup container data',
      options: [
        {
          name: 'container',
          type: 'string',
          description: 'Container to backup',
          required: true
        },
        {
          name: 'destination',
          type: 'string',
          description: 'Backup destination',
          default: './backups'
        }
      ],
      handler: this.backupHandler.bind(this)
    });

    // Schedule automatic backups
    this.scheduleAutomaticBackups(context);
  }

  private async backupHandler(
    args: CommandArgs,
    context: CommandContext
  ): Promise<CommandResult> {
    const { container: containerId, destination } = args;

    try {
      // Get container info
      const container = await context.containers.get(containerId);

      // Create backup directory
      const backupPath = path.join(
        destination,
        `${container.name}-${new Date().toISOString()}`
      );
      await fs.mkdir(backupPath, { recursive: true });

      // Stop container temporarily
      const wasRunning = container.status === 'running';
      if (wasRunning) {
        await context.containers.stop(containerId);
      }

      // Backup volumes
      await this.backupVolumes(container, backupPath, context);

      // Backup container configuration
      await this.backupConfiguration(container, backupPath);

      // Restart container if it was running
      if (wasRunning) {
        await context.containers.start(containerId);
      }

      return {
        success: true,
        message: `Backup completed successfully to ${backupPath}`,
        data: { backupPath, size: await this.getBackupSize(backupPath) }
      };

    } catch (error) {
      return {
        success: false,
        message: `Backup failed: ${error.message}`,
        error
      };
    }
  }

  private async backupVolumes(
    container: ContainerInfo,
    backupPath: string,
    context: CommandContext
  ): Promise<void> {
    for (const mount of container.mounts || []) {
      if (mount.type === 'volume') {
        const volumeBackupPath = path.join(backupPath, 'volumes', mount.name);
        await fs.mkdir(volumeBackupPath, { recursive: true });

        // Create temporary container to access volume
        const tempContainerId = await context.containers.create({
          image: 'alpine:latest',
          volumes: [`${mount.name}:/backup-source:ro`],
          command: ['tar', 'czf', '/backup.tar.gz', '-C', '/backup-source', '.']
        });

        try {
          await context.containers.start(tempContainerId, { wait: true });

          // Copy backup file from container
          await this.copyFromContainer(
            tempContainerId,
            '/backup.tar.gz',
            path.join(volumeBackupPath, 'data.tar.gz'),
            context
          );

        } finally {
          await context.containers.remove(tempContainerId, { force: true });
        }
      }
    }
  }
}
```

## 📊 Metrics Collection API

### Metrics Interface

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

### Custom Metrics Plugin

```typescript
export class DatabaseMetricsPlugin implements Plugin {
  name = 'database-metrics-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Register custom metrics collector
    context.metrics.registerCollector('database-metrics', {
      name: 'database-metrics',
      interval: 10000, // 10 seconds
      collect: this.collectDatabaseMetrics.bind(this)
    });

    // Add custom alerts
    context.metrics.addAlert({
      id: 'db-connection-pool',
      name: 'Database Connection Pool High',
      metric: 'database.connections.active',
      condition: 'greater_than',
      threshold: 80,
      severity: 'warning'
    });

    // Register metrics visualization
    context.ui.registerWidget('db-metrics-chart', {
      name: 'db-metrics-chart',
      render: this.renderDatabaseMetricsChart.bind(this)
    });
  }

  private async collectDatabaseMetrics(): Promise<MetricData[]> {
    const metrics: MetricData[] = [];
    const timestamp = new Date();

    // Collect metrics from all database containers
    const containers = await this.getDatabaseContainers();

    for (const container of containers) {
      try {
        // Execute metrics collection commands
        const connectionStats = await this.getConnectionStats(container);
        const queryStats = await this.getQueryStats(container);
        const indexStats = await this.getIndexStats(container);

        metrics.push(
          {
            name: 'database.connections.active',
            value: connectionStats.active,
            timestamp,
            labels: { container: container.name, type: 'postgresql' }
          },
          {
            name: 'database.connections.total',
            value: connectionStats.total,
            timestamp,
            labels: { container: container.name, type: 'postgresql' }
          },
          {
            name: 'database.queries.per_second',
            value: queryStats.queriesPerSecond,
            timestamp,
            labels: { container: container.name, type: 'postgresql' }
          },
          {
            name: 'database.slow_queries',
            value: queryStats.slowQueries,
            timestamp,
            labels: { container: container.name, type: 'postgresql' }
          },
          {
            name: 'database.index.cache_hit_ratio',
            value: indexStats.cacheHitRatio,
            timestamp,
            labels: { container: container.name, type: 'postgresql' },
            unit: 'percentage'
          }
        );

      } catch (error) {
        context.logger.warn(`Failed to collect metrics for ${container.name}:`, error);
      }
    }

    return metrics;
  }

  private async getConnectionStats(container: ContainerInfo): Promise<ConnectionStats> {
    const query = `
      SELECT
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections
      FROM pg_stat_activity;
    `;

    const result = await this.executeQuery(container, query);
    return {
      total: result.rows[0].total_connections,
      active: result.rows[0].active_connections
    };
  }

  private renderDatabaseMetricsChart(props: WidgetProps): string {
    const { metrics, width, height } = props;

    // Create simple ASCII chart
    const connectionHistory = metrics
      .filter(m => m.name === 'database.connections.active')
      .slice(-20); // Last 20 data points

    const chart = this.createAsciiChart(connectionHistory, width, height);

    return `
{bold}Database Connections{/bold}
${chart}

Active: ${connectionHistory[connectionHistory.length - 1]?.value || 0}
Max: ${Math.max(...connectionHistory.map(m => m.value))}
Avg: ${Math.round(connectionHistory.reduce((a, m) => a + m.value, 0) / connectionHistory.length)}
    `.trim();
  }
}
```

## 🔧 Plugin Configuration

### Configuration Schema

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

### Configuration Examples

```yaml
# dockronos.yml - Plugin configuration
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

## 🧪 Plugin Testing

### Test Framework

```typescript
// Plugin testing utilities
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

  test('should register deploy command', () => {
    expect(context.commands.registered).toContain('deploy');
    expect(context.commands.get('deploy')).toBeDefined();
  });

  test('should handle deployment correctly', async () => {
    // Mock container manager
    context.containers.mockStart = jest.fn().mockResolvedValue(undefined);
    context.containers.mockStop = jest.fn().mockResolvedValue(undefined);

    // Execute command
    const result = await framework.executeCommand('deploy', ['staging', '--force']);

    expect(result.success).toBe(true);
    expect(context.containers.mockStart).toHaveBeenCalled();
  });

  test('should emit deployment events', async () => {
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

## 📦 Plugin Distribution

### Plugin Manifest

```json
{
  "name": "dockronos-plugin-monitoring",
  "version": "2.1.0",
  "description": "Advanced monitoring and alerting for Dockronos",
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

### Publishing Guidelines

```bash
# Plugin development workflow
npm init dockronos-plugin my-plugin
cd my-plugin

# Development
npm run dev        # Start development mode
npm run test       # Run tests
npm run lint       # Lint code
npm run build      # Build plugin

# Publishing
npm run prepare    # Prepare for publishing
npm publish        # Publish to npm registry

# Installation
npm install -g dockronos-plugin-my-plugin
dockronos plugin install my-plugin
```

---

*This comprehensive Plugin API enables developers to extend Dockronos with custom functionality, integrate with external systems, and create sophisticated automation workflows. The plugin system provides full access to Dockronos's capabilities while maintaining security and stability.*