Aquí tienes la traducción al español:

---

# Referencia de Puntos de Extensión

Este documento detalla todos los puntos de extensión disponibles en Dockronos y ofrece una guía completa para desarrolladores que deseen ampliar, personalizar o integrar la aplicación en varios niveles.

## 🎯 Visión general de los puntos de extensión

Dockronos ofrece múltiples mecanismos de extensión para adaptarse a distintos casos de uso:

1. **Sistema de plugins**: plugins con todas las funciones y gestión de ciclo de vida
2. **Sistema de hooks**: extensiones ligeras basadas en eventos
3. **Comandos personalizados**: extensiones de la CLI
4. **Componentes de UI**: personalizaciones de la interfaz de terminal
5. **Extensiones de configuración**: procesamiento de configuración personalizado
6. **Extensiones del motor de contenedores**: soporte para runtimes de contenedores adicionales
7. **Recolectores de métricas**: monitoreo y métricas personalizadas
8. **Sistema de plantillas**: extensiones para andamiaje (scaffolding) de proyectos

## 🔌 Puntos de extensión de plugins

### Interfaces principales de plugins

```typescript
// Base plugin interface - entry point for all plugins
interface Plugin {
  readonly metadata: PluginMetadata;
  initialize(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;
}

interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  keywords?: string[];
  category: PluginCategory;
}

type PluginCategory =
  | 'container-management'
  | 'monitoring'
  | 'deployment'
  | 'development-tools'
  | 'security'
  | 'ui-enhancement'
  | 'integration'
  | 'utilities';
```

### Extensiones de Contexto de Plugins


```typescript
// Extended plugin context with specialized interfaces
interface PluginContext {
  // Core systems
  readonly app: ApplicationContext;
  readonly config: ConfigurationContext;
  readonly containers: ContainerContext;
  readonly ui: UIContext;
  readonly events: EventContext;

  // Specialized extensions
  readonly commands: CommandExtensions;
  readonly metrics: MetricsExtensions;
  readonly templates: TemplateExtensions;
  readonly hooks: HookExtensions;
  readonly networking: NetworkingExtensions;
  readonly storage: StorageExtensions;
  readonly security: SecurityExtensions;
}

interface ApplicationContext {
  readonly version: string;
  readonly environment: 'development' | 'production' | 'test';
  readonly workingDirectory: string;
  readonly configPath: string;

  getSystemInfo(): SystemInfo;
  requestShutdown(reason?: string): void;
  scheduleTask(task: ScheduledTask): void;
}
```

## 🎣 Hook System Extension Points

### Lifecycle Hooks

```typescript
// Application lifecycle hooks
interface LifecycleHooks {
  'app:before-start': (context: AppStartContext) => Promise<void | boolean>;
  'app:after-start': (context: AppStartContext) => Promise<void>;
  'app:before-stop': (context: AppStopContext) => Promise<void | boolean>;
  'app:after-stop': (context: AppStopContext) => Promise<void>;
  'app:error': (error: Error, context: ErrorContext) => Promise<void>;
}

// Configuration hooks
interface ConfigurationHooks {
  'config:before-load': (path: string) => Promise<string | void>;
  'config:after-load': (config: DockronosConfig) => Promise<DockronosConfig | void>;
  'config:validate': (config: DockronosConfig) => Promise<ValidationResult>;
  'config:before-save': (config: DockronosConfig) => Promise<DockronosConfig | void>;
  'config:changed': (oldConfig: DockronosConfig, newConfig: DockronosConfig) => Promise<void>;
}

// Container lifecycle hooks
interface ContainerHooks {
  'container:before-create': (config: ContainerConfig) => Promise<ContainerConfig | void>;
  'container:after-create': (container: ContainerInfo) => Promise<void>;
  'container:before-start': (container: ContainerInfo) => Promise<boolean | void>;
  'container:after-start': (container: ContainerInfo) => Promise<void>;
  'container:before-stop': (container: ContainerInfo) => Promise<boolean | void>;
  'container:after-stop': (container: ContainerInfo) => Promise<void>;
  'container:error': (container: ContainerInfo, error: Error) => Promise<void>;
}
```

### Hook Registration Examples

```typescript
// Plugin with comprehensive hook usage
export class ComprehensiveHooksPlugin implements Plugin {
  metadata = {
    name: 'comprehensive-hooks',
    version: '1.0.0',
    description: 'Demonstrates all available hooks',
    author: 'Dockronos Team',
    category: 'utilities' as const
  };

  async initialize(context: PluginContext): Promise<void> {
    // Application lifecycle hooks
    context.hooks.register('app:before-start', this.beforeAppStart.bind(this));
    context.hooks.register('app:after-start', this.afterAppStart.bind(this));

    // Configuration hooks
    context.hooks.register('config:validate', this.validateConfig.bind(this));
    context.hooks.register('config:changed', this.onConfigChanged.bind(this));

    // Container hooks
    context.hooks.register('container:before-start', this.beforeContainerStart.bind(this));
    context.hooks.register('container:after-start', this.afterContainerStart.bind(this));

    // UI hooks
    context.hooks.register('ui:before-render', this.beforeUIRender.bind(this));
    context.hooks.register('ui:key-pressed', this.onKeyPressed.bind(this));

    // Command hooks
    context.hooks.register('command:before-execute', this.beforeCommandExecute.bind(this));
    context.hooks.register('command:after-execute', this.afterCommandExecute.bind(this));
  }

  private async beforeAppStart(context: AppStartContext): Promise<boolean> {
    // Perform pre-startup validation
    const systemCheck = await this.performSystemCheck();
    if (!systemCheck.passed) {
      context.logger.error('System check failed:', systemCheck.errors);
      return false; // Prevent startup
    }
    return true;
  }

  private async validateConfig(config: DockronosConfig): Promise<ValidationResult> {
    const errors: string[] = [];

    // Custom validation rules
    if (config.containers?.length === 0) {
      errors.push('At least one container must be defined');
    }

    // Check for environment variables
    for (const container of config.containers || []) {
      if (container.environment) {
        for (const env of container.environment) {
          if (env.includes('REQUIRED_') && !process.env[env.split('=')[0]]) {
            errors.push(`Required environment variable ${env.split('=')[0]} is not set`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async beforeContainerStart(container: ContainerInfo): Promise<boolean> {
    // Pre-flight checks before starting containers
    const healthCheck = await this.performContainerHealthCheck(container);
    if (!healthCheck.healthy) {
      context.logger.warn(`Container ${container.name} failed health check`, healthCheck);
      return false; // Prevent container start
    }
    return true;
  }
}
```

## 🎨 UI Extension Points

### Panel System Extensions

```typescript
interface UIExtensions {
  registerPanel(panel: CustomPanel): void;
  registerWidget(widget: CustomWidget): void;
  registerTheme(theme: CustomTheme): void;
  registerKeymap(keymap: CustomKeymap): void;
  registerStatusProvider(provider: StatusProvider): void;
}

interface CustomPanel {
  id: string;
  title: string;
  position: PanelPosition;
  size: PanelSize;
  priority: number;

  render(context: RenderContext): blessed.Widgets.Node;
  onFocus?(): void;
  onBlur?(): void;
  onResize?(size: { width: number; height: number }): void;
  onKeyPress?(key: string, context: KeyPressContext): boolean;
  onUpdate?(data: any): void;
}

type PanelPosition = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'floating';

interface PanelSize {
  width: number | string;
  height: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}
```

### Widget System Extensions

```typescript
interface CustomWidget {
  id: string;
  name: string;
  description: string;

  render(props: WidgetProps): blessed.Widgets.Node;
  getDefaultProps?(): WidgetProps;
  validateProps?(props: WidgetProps): ValidationResult;
}

interface WidgetProps {
  [key: string]: any;
  width?: number | string;
  height?: number | string;
  data?: any;
  config?: any;
}

// Example: Progress chart widget
export class ProgressChartWidget implements CustomWidget {
  id = 'progress-chart';
  name = 'Progress Chart';
  description = 'Displays progress with customizable charts';

  render(props: WidgetProps): blessed.Widgets.Node {
    const { width = '100%', height = 10, data = [], title = 'Progress' } = props;

    return blessed.box({
      width,
      height,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
      label: title,
      content: this.renderChart(data),
      tags: true
    });
  }

  private renderChart(data: any[]): string {
    // Custom chart rendering logic
    const bars = data.map(item => {
      const percentage = Math.round((item.value / item.max) * 100);
      const barLength = Math.floor(percentage / 5); // 20 characters max
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

      return `${item.label.padEnd(15)} [${bar}] ${percentage}%`;
    });

    return bars.join('\n');
  }

  getDefaultProps(): WidgetProps {
    return {
      width: '100%',
      height: 10,
      title: 'Progress',
      data: []
    };
  }
}
```

### Theme System Extensions

```typescript
interface CustomTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  styles: ThemeStyles;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  foreground: string;
  border: string;
  highlight: string;
}

interface ThemeStyles {
  panels: {
    border: BorderStyle;
    focus: FocusStyle;
  };
  containers: {
    running: StyleConfig;
    stopped: StyleConfig;
    error: StyleConfig;
  };
  metrics: {
    normal: StyleConfig;
    warning: StyleConfig;
    critical: StyleConfig;
  };
}

// Example: Dark theme
export const DarkTheme: CustomTheme = {
  id: 'dark-theme',
  name: 'Dark Theme',
  description: 'High contrast dark theme for better visibility',
  colors: {
    primary: '#007acc',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    border: '#3c3c3c',
    highlight: '#264f78'
  },
  styles: {
    panels: {
      border: { type: 'line', fg: '#3c3c3c' },
      focus: { border: { fg: '#007acc' } }
    },
    containers: {
      running: { fg: '#28a745', bold: true },
      stopped: { fg: '#6c757d' },
      error: { fg: '#dc3545', bold: true }
    },
    metrics: {
      normal: { fg: '#d4d4d4' },
      warning: { fg: '#ffc107', bold: true },
      critical: { fg: '#dc3545', bold: true, blink: true }
    }
  }
};
```

## ⚙️ Command Extension Points

### Command System Extensions

```typescript
interface CommandExtensions {
  register(command: CommandDefinition): void;
  unregister(name: string): void;
  extend(name: string, extension: CommandExtension): void;
  middleware(middleware: CommandMiddleware): void;
}

interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  category?: CommandCategory;
  aliases?: string[];
  options?: CommandOption[];
  subcommands?: CommandDefinition[];
  examples?: CommandExample[];

  handler: CommandHandler;
  middleware?: CommandMiddleware[];
  validation?: CommandValidation;
}

type CommandCategory =
  | 'container'
  | 'development'
  | 'deployment'
  | 'monitoring'
  | 'configuration'
  | 'utility';

interface CommandOption {
  name: string;
  alias?: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  choices?: string[];
  validate?: (value: any) => boolean | string;
}
```

### Advanced Command Extensions

```typescript
// Plugin with advanced command features
export class AdvancedCommandPlugin implements Plugin {
  metadata = {
    name: 'advanced-commands',
    version: '1.0.0',
    description: 'Advanced command features and utilities',
    author: 'Dockronos Team',
    category: 'utilities' as const
  };

  async initialize(context: PluginContext): Promise<void> {
    // Register command with full feature set
    context.commands.register({
      name: 'deploy',
      description: 'Deploy applications with advanced features',
      usage: 'dockronos deploy [environment] [options]',
      category: 'deployment',
      aliases: ['dep'],
      examples: [
        {
          command: 'dockronos deploy staging',
          description: 'Deploy to staging environment'
        },
        {
          command: 'dockronos deploy production --dry-run --verbose',
          description: 'Dry run deployment to production with verbose output'
        }
      ],
      options: [
        {
          name: 'environment',
          type: 'string',
          description: 'Target environment',
          required: true,
          choices: ['development', 'staging', 'production'],
          validate: (value) => this.validateEnvironment(value)
        },
        {
          name: 'dry-run',
          alias: 'n',
          type: 'boolean',
          description: 'Perform dry run without actual deployment',
          default: false
        },
        {
          name: 'timeout',
          alias: 't',
          type: 'number',
          description: 'Deployment timeout in seconds',
          default: 300,
          validate: (value) => value > 0 || 'Timeout must be positive'
        },
        {
          name: 'services',
          alias: 's',
          type: 'array',
          description: 'Specific services to deploy',
          choices: this.getAvailableServices.bind(this)
        }
      ],
      subcommands: [
        {
          name: 'status',
          description: 'Check deployment status',
          handler: this.deployStatusHandler.bind(this)
        },
        {
          name: 'rollback',
          description: 'Rollback deployment',
          options: [
            {
              name: 'version',
              type: 'string',
              description: 'Version to rollback to'
            }
          ],
          handler: this.rollbackHandler.bind(this)
        }
      ],
      handler: this.deployHandler.bind(this),
      middleware: [
        this.validatePermissions.bind(this),
        this.checkPrerequisites.bind(this),
        this.logCommand.bind(this)
      ],
      validation: {
        requiresContainers: true,
        requiresNetwork: true,
        customValidation: this.customDeployValidation.bind(this)
      }
    });

    // Register global command middleware
    context.commands.middleware(this.globalAuditMiddleware.bind(this));
  }

  private async deployHandler(
    args: CommandArgs,
    context: CommandContext
  ): Promise<CommandResult> {
    const { environment, dryRun, timeout, services } = args;

    try {
      // Initialize deployment
      const deployment = new DeploymentManager({
        environment,
        dryRun,
        timeout,
        services: services || this.getAllServices()
      });

      // Execute deployment with progress tracking
      const result = await deployment.execute({
        onProgress: (progress) => {
          context.ui.updateProgress(`Deploying... ${progress.percentage}%`, progress.percentage);
        },
        onStageComplete: (stage) => {
          context.logger.info(`Deployment stage completed: ${stage.name}`);
        }
      });

      return {
        success: true,
        message: `Deployment to ${environment} completed successfully`,
        data: {
          deploymentId: result.id,
          deployedServices: result.services,
          duration: result.duration,
          url: result.url
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Deployment failed: ${error.message}`,
        error
      };
    }
  }

  private validatePermissions: CommandMiddleware = async (args, context, next) => {
    const { environment } = args;

    if (environment === 'production') {
      const hasPermission = await this.checkProductionPermissions(context.user);
      if (!hasPermission) {
        throw new CommandError('Insufficient permissions for production deployment');
      }
    }

    return next();
  };

  private globalAuditMiddleware: CommandMiddleware = async (args, context, next) => {
    const auditLog = {
      command: context.command.name,
      user: context.user,
      timestamp: new Date(),
      args: this.sanitizeArgs(args)
    };

    // Log command execution
    await this.auditLogger.log(auditLog);

    try {
      const result = await next();
      auditLog.success = result.success;
      return result;
    } catch (error) {
      auditLog.error = error.message;
      throw error;
    } finally {
      await this.auditLogger.complete(auditLog);
    }
  };
}
```

## 📊 Metrics Extension Points

### Custom Metrics Collectors

```typescript
interface MetricsExtensions {
  registerCollector(collector: MetricsCollector): void;
  registerProcessor(processor: MetricsProcessor): void;
  registerExporter(exporter: MetricsExporter): void;
  registerAlert(alert: AlertDefinition): void;
}

interface MetricsCollector {
  id: string;
  name: string;
  description: string;
  interval: number;

  collect(context: CollectionContext): Promise<MetricData[]>;
  validate?(config: any): ValidationResult;
  initialize?(config: any): Promise<void>;
  destroy?(): Promise<void>;
}

interface MetricsProcessor {
  id: string;
  name: string;

  process(metrics: MetricData[]): Promise<MetricData[]>;
  aggregate?(metrics: MetricData[], timeWindow: number): Promise<MetricData[]>;
  filter?(metrics: MetricData[], criteria: FilterCriteria): MetricData[];
}

// Example: Custom application metrics collector
export class ApplicationMetricsCollector implements MetricsCollector {
  id = 'application-metrics';
  name = 'Application Metrics';
  description = 'Collects application-specific performance metrics';
  interval = 15000; // 15 seconds

  async collect(context: CollectionContext): Promise<MetricData[]> {
    const metrics: MetricData[] = [];
    const timestamp = new Date();

    // Collect metrics from all running containers
    const containers = await context.containers.list();
    const runningContainers = containers.filter(c => c.status === 'running');

    for (const container of runningContainers) {
      // Application-specific metrics
      const appMetrics = await this.collectApplicationMetrics(container);
      const healthMetrics = await this.collectHealthMetrics(container);
      const businessMetrics = await this.collectBusinessMetrics(container);

      metrics.push(
        ...appMetrics.map(m => ({ ...m, timestamp, containerId: container.id })),
        ...healthMetrics.map(m => ({ ...m, timestamp, containerId: container.id })),
        ...businessMetrics.map(m => ({ ...m, timestamp, containerId: container.id }))
      );
    }

    return metrics;
  }

  private async collectApplicationMetrics(container: ContainerInfo): Promise<MetricData[]> {
    const metrics: MetricData[] = [];

    try {
      // Collect from application health endpoint
      const healthResponse = await this.httpRequest(`http://localhost:${container.port}/health`);

      if (healthResponse.metrics) {
        metrics.push(
          {
            name: 'app.response_time',
            value: healthResponse.metrics.responseTime,
            unit: 'milliseconds',
            labels: { service: container.name }
          },
          {
            name: 'app.active_connections',
            value: healthResponse.metrics.activeConnections,
            labels: { service: container.name }
          },
          {
            name: 'app.request_rate',
            value: healthResponse.metrics.requestsPerSecond,
            unit: 'requests/second',
            labels: { service: container.name }
          }
        );
      }

    } catch (error) {
      // Health endpoint not available
      metrics.push({
        name: 'app.health_check_failed',
        value: 1,
        labels: { service: container.name, error: error.message }
      });
    }

    return metrics;
  }

  private async collectBusinessMetrics(container: ContainerInfo): Promise<MetricData[]> {
    const metrics: MetricData[] = [];

    // Application-specific business metrics
    if (container.labels?.['app.type'] === 'api') {
      const apiMetrics = await this.collectAPIMetrics(container);
      metrics.push(...apiMetrics);
    }

    if (container.labels?.['app.type'] === 'worker') {
      const workerMetrics = await this.collectWorkerMetrics(container);
      metrics.push(...workerMetrics);
    }

    return metrics;
  }
}
```

## 🔗 Container Engine Extensions

### Custom Container Engine Support

```typescript
interface ContainerEngineExtensions {
  registerEngine(engine: ContainerEngine): void;
  registerAdapter(adapter: EngineAdapter): void;
  registerCommand(command: EngineCommand): void;
}

interface ContainerEngine {
  name: string;
  version: string;
  executable: string;

  isAvailable(): Promise<boolean>;
  initialize(): Promise<void>;

  // Core operations
  list(): Promise<ContainerInfo[]>;
  inspect(id: string): Promise<ContainerDetails>;
  start(id: string, options?: StartOptions): Promise<void>;
  stop(id: string, options?: StopOptions): Promise<void>;
  remove(id: string, options?: RemoveOptions): Promise<void>;

  // Extended operations
  build(context: string, options?: BuildOptions): Promise<BuildResult>;
  exec(id: string, command: string[], options?: ExecOptions): Promise<ExecResult>;
  logs(id: string, options?: LogOptions): Promise<NodeJS.ReadableStream>;
  stats(id: string): Promise<ContainerStats>;
}

// Example: Podman engine implementation
export class PodmanEngine implements ContainerEngine {
  name = 'podman';
  version = '4.0+';
  executable = 'podman';

  async isAvailable(): Promise<boolean> {
    try {
      const result = await this.execCommand(['version']);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    // Check if Podman is installed and configured
    const version = await this.execCommand(['version', '--format', 'json']);
    const versionInfo = JSON.parse(version.stdout);

    if (!this.isVersionSupported(versionInfo.Client.Version)) {
      throw new EngineError(`Podman version ${versionInfo.Client.Version} is not supported`);
    }

    // Check if machine is running (macOS/Windows)
    if (process.platform !== 'linux') {
      await this.ensureMachineRunning();
    }
  }

  async list(): Promise<ContainerInfo[]> {
    const result = await this.execCommand([
      'ps', '-a',
      '--format', 'json'
    ]);

    const containers = JSON.parse(result.stdout);
    return containers.map(this.mapPodmanContainer.bind(this));
  }

  private mapPodmanContainer(podmanContainer: any): ContainerInfo {
    return {
      id: podmanContainer.Id,
      name: podmanContainer.Names[0],
      image: podmanContainer.Image,
      status: this.mapStatus(podmanContainer.State),
      ports: this.mapPorts(podmanContainer.Ports),
      created: new Date(podmanContainer.Created * 1000),
      labels: podmanContainer.Labels || {}
    };
  }

  private async ensureMachineRunning(): Promise<void> {
    const machines = await this.execCommand(['machine', 'list', '--format', 'json']);
    const machineList = JSON.parse(machines.stdout);

    const defaultMachine = machineList.find((m: any) => m.Default);
    if (!defaultMachine || defaultMachine.Running !== true) {
      await this.execCommand(['machine', 'start']);
    }
  }
}
```

## 📋 Template System Extensions

### Custom Project Templates

```typescript
interface TemplateExtensions {
  registerTemplate(template: ProjectTemplate): void;
  registerGenerator(generator: TemplateGenerator): void;
  registerTransform(transform: TemplateTransform): void;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];

  files: TemplateFile[];
  prompts?: TemplatePrompt[];
  postInstall?: PostInstallHook[];

  generate(context: GenerationContext): Promise<GenerationResult>;
}

type TemplateCategory =
  | 'web-application'
  | 'api-service'
  | 'microservice'
  | 'database'
  | 'monitoring'
  | 'ci-cd';

interface TemplateFile {
  source: string;
  destination: string;
  template?: boolean;
  executable?: boolean;
  condition?: (context: GenerationContext) => boolean;
}

// Example: Advanced web application template
export class ReactMicroserviceTemplate implements ProjectTemplate {
  id = 'react-microservice';
  name = 'React Microservice';
  description = 'Modern React application with microservice architecture';
  category = 'web-application';
  tags = ['react', 'typescript', 'microservice', 'docker'];

  files = [
    { source: 'package.json.hbs', destination: 'package.json', template: true },
    { source: 'Dockerfile.hbs', destination: 'Dockerfile', template: true },
    { source: 'dockronos.yml.hbs', destination: 'dockronos.yml', template: true },
    { source: 'src/**/*', destination: 'src/', template: true },
    { source: 'public/**/*', destination: 'public/' },
    { source: 'scripts/dev.sh', destination: 'scripts/dev.sh', executable: true }
  ];

  prompts = [
    {
      name: 'projectName',
      type: 'input',
      message: 'Project name:',
      validate: (input) => input.length > 0 || 'Project name is required'
    },
    {
      name: 'description',
      type: 'input',
      message: 'Project description:'
    },
    {
      name: 'author',
      type: 'input',
      message: 'Author name:'
    },
    {
      name: 'features',
      type: 'checkbox',
      message: 'Select features to include:',
      choices: [
        { name: 'Redux Toolkit', value: 'redux' },
        { name: 'React Router', value: 'router' },
        { name: 'Material-UI', value: 'mui' },
        { name: 'Testing Library', value: 'testing' },
        { name: 'Storybook', value: 'storybook' }
      ]
    },
    {
      name: 'database',
      type: 'list',
      message: 'Choose database:',
      choices: ['PostgreSQL', 'MySQL', 'MongoDB', 'None'],
      default: 'PostgreSQL'
    },
    {
      name: 'api',
      type: 'confirm',
      message: 'Include API service?',
      default: true
    }
  ];

  postInstall = [
    {
      name: 'install-dependencies',
      command: 'npm install',
      description: 'Installing dependencies...'
    },
    {
      name: 'setup-database',
      command: 'npm run db:setup',
      condition: (context) => context.answers.database !== 'None'
    },
    {
      name: 'initial-build',
      command: 'npm run build',
      description: 'Building application...'
    }
  ];

  async generate(context: GenerationContext): Promise<GenerationResult> {
    const { answers, outputPath } = context;

    // Create template context
    const templateContext = {
      ...answers,
      hasRedux: answers.features.includes('redux'),
      hasRouter: answers.features.includes('router'),
      hasMUI: answers.features.includes('mui'),
      hasTesting: answers.features.includes('testing'),
      hasStorybook: answers.features.includes('storybook'),
      hasDatabase: answers.database !== 'None',
      databaseType: answers.database.toLowerCase(),
      timestamp: new Date().toISOString()
    };

    // Generate files
    const generatedFiles: string[] = [];

    for (const file of this.files) {
      const shouldGenerate = !file.condition || file.condition(context);
      if (!shouldGenerate) continue;

      const sourcePath = path.join(this.templatePath, file.source);
      const destPath = path.join(outputPath, file.destination);

      if (file.template) {
        // Process template
        const template = await fs.readFile(sourcePath, 'utf-8');
        const rendered = handlebars.compile(template)(templateContext);
        await fs.writeFile(destPath, rendered);
      } else {
        // Copy file as-is
        await fs.copyFile(sourcePath, destPath);
      }

      if (file.executable) {
        await fs.chmod(destPath, 0o755);
      }

      generatedFiles.push(destPath);
    }

    return {
      success: true,
      generatedFiles,
      templateContext,
      nextSteps: [
        'Run `dockronos start` to start the development environment',
        'Open http://localhost:3000 to view your application',
        'Edit src/App.tsx to start developing'
      ]
    };
  }
}
```

## 🔐 Security Extension Points

### Security Plugins and Policies

```typescript
interface SecurityExtensions {
  registerPolicy(policy: SecurityPolicy): void;
  registerScanner(scanner: SecurityScanner): void;
  registerValidator(validator: SecurityValidator): void;
  registerProvider(provider: SecurityProvider): void;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error';

  validate(context: SecurityContext): Promise<PolicyResult>;
  enforce?(context: SecurityContext): Promise<void>;
  remediate?(context: SecurityContext): Promise<RemediationResult>;
}

interface SecurityScanner {
  id: string;
  name: string;

  scan(target: ScanTarget): Promise<ScanResult>;
  getSupportedTargets(): ScanTargetType[];
}

// Example: Container security policy
export class ContainerSecurityPolicy implements SecurityPolicy {
  id = 'container-security';
  name = 'Container Security Policy';
  description = 'Ensures containers follow security best practices';
  severity = 'warning' as const;

  async validate(context: SecurityContext): Promise<PolicyResult> {
    const violations: PolicyViolation[] = [];
    const { containers } = context;

    for (const container of containers) {
      // Check for privileged mode
      if (container.privileged) {
        violations.push({
          rule: 'no-privileged-containers',
          message: `Container ${container.name} is running in privileged mode`,
          severity: 'error',
          remediation: 'Remove privileged flag and use specific capabilities instead'
        });
      }

      // Check for root user
      if (container.user === 'root' || container.user === '0') {
        violations.push({
          rule: 'no-root-user',
          message: `Container ${container.name} is running as root`,
          severity: 'warning',
          remediation: 'Create and use a non-root user in the container'
        });
      }

      // Check for exposed sensitive ports
      const sensitivePorts = ['22', '3389', '5432', '3306'];
      for (const port of container.ports) {
        const hostPort = port.split(':')[0];
        if (sensitivePorts.includes(hostPort)) {
          violations.push({
            rule: 'no-sensitive-ports',
            message: `Container ${container.name} exposes sensitive port ${hostPort}`,
            severity: 'warning',
            remediation: `Avoid exposing port ${hostPort} or use a different host port`
          });
        }
      }

      // Check for missing health checks
      if (!container.healthCheck) {
        violations.push({
          rule: 'require-health-check',
          message: `Container ${container.name} missing health check`,
          severity: 'info',
          remediation: 'Add a health check to monitor container health'
        });
      }
    }

    return {
      passed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      score: this.calculateSecurityScore(violations),
      recommendations: this.generateRecommendations(violations)
    };
  }

  async remediate(context: SecurityContext): Promise<RemediationResult> {
    const remediations: RemediationAction[] = [];

    // Auto-fix certain issues
    for (const container of context.containers) {
      if (container.user === 'root') {
        // Suggest user configuration
        remediations.push({
          type: 'suggest',
          description: `Add non-root user to ${container.name}`,
          command: 'USER 1000:1000',
          file: 'Dockerfile'
        });
      }

      if (!container.healthCheck) {
        // Add basic health check
        remediations.push({
          type: 'add',
          description: `Add health check to ${container.name}`,
          config: {
            healthcheck: {
              test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
              interval: '30s',
              timeout: '10s',
              retries: 3
            }
          }
        });
      }
    }

    return {
      applied: remediations.length,
      actions: remediations,
      success: true
    };
  }
}
```

---

*Esta referencia completa de puntos de extensión permite a los desarrolladores crear integraciones y personalizaciones avanzadas para Dockronos. El sistema de extensiones proporciona acceso total a las capacidades de la aplicación mientras mantiene la seguridad, el rendimiento y la estabilidad.*
