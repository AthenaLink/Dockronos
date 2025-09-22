# Functionality and Application Logic

This document provides comprehensive coverage of Dockronos's core functionality, business logic, and operational workflows. It explains how the application works internally, the decision-making processes, and the intricate details of feature implementation.

## 🧠 Core Application Logic

### Application Lifecycle

```typescript
// Main application bootstrap sequence
class DockronosApplication {
  private state: ApplicationState = 'initializing';
  private modules: ModuleRegistry = new ModuleRegistry();

  async start(): Promise<void> {
    try {
      this.state = 'initializing';

      // Phase 1: Environment Setup
      await this.initializeEnvironment();

      // Phase 2: Configuration Loading
      await this.loadConfiguration();

      // Phase 3: Container Engine Discovery
      await this.initializeContainerEngine();

      // Phase 4: UI System Initialization
      await this.startUISystem();

      // Phase 5: Background Services
      await this.startBackgroundServices();

      this.state = 'running';
      logger.info('Dockronos application started successfully');

    } catch (error) {
      this.state = 'error';
      await this.handleStartupError(error);
    }
  }

  private async initializeEnvironment(): Promise<void> {
    // Validate Node.js version
    const nodeVersion = process.version;
    if (!semver.gte(nodeVersion, '18.0.0')) {
      throw new StartupError(`Node.js 18+ required, found ${nodeVersion}`);
    }

    // Setup signal handlers
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => this.handleUncaughtException(error));
    process.on('unhandledRejection', (reason) => this.handleUnhandledRejection(reason));

    // Initialize logging system
    await this.initializeLogger();
  }
}
```

### State Management Architecture

```typescript
// Application state machine
type ApplicationState =
  | 'initializing'
  | 'loading_config'
  | 'discovering_engine'
  | 'starting_ui'
  | 'running'
  | 'error'
  | 'shutting_down'
  | 'stopped';

interface StateTransition {
  from: ApplicationState;
  to: ApplicationState;
  condition?: () => boolean;
  action?: () => Promise<void>;
}

class ApplicationStateMachine {
  private currentState: ApplicationState = 'initializing';
  private transitions: StateTransition[] = [
    {
      from: 'initializing',
      to: 'loading_config',
      action: () => this.loadConfiguration()
    },
    {
      from: 'loading_config',
      to: 'discovering_engine',
      condition: () => this.configManager.isLoaded(),
      action: () => this.discoverContainerEngine()
    },
    {
      from: 'discovering_engine',
      to: 'starting_ui',
      condition: () => this.containerEngine.isReady(),
      action: () => this.initializeUI()
    },
    {
      from: 'starting_ui',
      to: 'running',
      condition: () => this.ui.isReady(),
      action: () => this.startBackgroundServices()
    }
  ];

  async transition(targetState: ApplicationState): Promise<boolean> {
    const transition = this.transitions.find(t =>
      t.from === this.currentState && t.to === targetState
    );

    if (!transition) {
      logger.warn(`Invalid transition from ${this.currentState} to ${targetState}`);
      return false;
    }

    if (transition.condition && !transition.condition()) {
      logger.debug(`Transition condition not met for ${this.currentState} -> ${targetState}`);
      return false;
    }

    try {
      if (transition.action) {
        await transition.action();
      }

      this.currentState = targetState;
      this.emit('stateChange', { from: transition.from, to: targetState });
      return true;
    } catch (error) {
      logger.error(`Transition failed from ${this.currentState} to ${targetState}:`, error);
      this.currentState = 'error';
      return false;
    }
  }
}
```

## 🐳 Container Management Logic

### Container Lifecycle Management

```typescript
// Comprehensive container lifecycle handling
class ContainerLifecycleManager {
  private readonly stateTransitions = new Map<ContainerStatus, ContainerStatus[]>([
    ['created', ['running', 'removed']],
    ['running', ['stopped', 'paused', 'restarting']],
    ['stopped', ['running', 'removed']],
    ['paused', ['running', 'stopped']],
    ['restarting', ['running', 'stopped']],
    ['dead', ['removed']],
    ['exited', ['running', 'removed']]
  ]);

  async executeAction(
    container: ContainerInfo,
    action: ContainerAction
  ): Promise<ActionResult> {
    const startTime = performance.now();

    try {
      // Validate action is allowed for current state
      await this.validateAction(container, action);

      // Pre-action hooks
      await this.executePreActionHooks(container, action);

      // Execute the actual action
      const result = await this.performAction(container, action);

      // Post-action hooks
      await this.executePostActionHooks(container, action, result);

      // Update internal state
      await this.updateContainerState(container.id);

      const duration = performance.now() - startTime;
      logger.info(`Container action completed`, {
        container: container.name,
        action,
        duration: `${duration.toFixed(2)}ms`,
        success: true
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Container action failed`, {
        container: container.name,
        action,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });

      throw new ContainerActionError(
        `Failed to ${action} container ${container.name}: ${error.message}`,
        { container, action, originalError: error }
      );
    }
  }

  private async validateAction(
    container: ContainerInfo,
    action: ContainerAction
  ): Promise<void> {
    // Check if action is valid for current container state
    const validActions = this.getValidActionsForState(container.status);
    if (!validActions.includes(action)) {
      throw new InvalidActionError(
        `Cannot ${action} container in ${container.status} state. Valid actions: ${validActions.join(', ')}`
      );
    }

    // Check dependencies
    if (action === 'stop' || action === 'remove') {
      const dependents = await this.findDependentContainers(container.id);
      if (dependents.length > 0) {
        const warning = `Container ${container.name} has dependents: ${dependents.map(c => c.name).join(', ')}`;
        logger.warn(warning);

        // Allow with warning but notify user
        this.ui.showWarning(warning);
      }
    }

    // Check for resource conflicts
    if (action === 'start') {
      await this.checkPortConflicts(container);
      await this.checkVolumeConflicts(container);
    }
  }

  private async performAction(
    container: ContainerInfo,
    action: ContainerAction
  ): Promise<ActionResult> {
    switch (action) {
      case 'start':
        return this.startContainer(container);
      case 'stop':
        return this.stopContainer(container);
      case 'restart':
        return this.restartContainer(container);
      case 'pause':
        return this.pauseContainer(container);
      case 'unpause':
        return this.unpauseContainer(container);
      case 'remove':
        return this.removeContainer(container);
      case 'logs':
        return this.viewLogs(container);
      case 'exec':
        return this.executeCommand(container);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}
```

### Smart Container Dependencies

```typescript
// Intelligent dependency resolution
class ContainerDependencyResolver {
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();

  buildDependencyGraph(containers: ContainerInfo[]): void {
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();

    for (const container of containers) {
      const dependencies = this.extractDependencies(container);
      this.dependencyGraph.set(container.id, new Set(dependencies));

      // Build reverse graph for finding dependents
      for (const dep of dependencies) {
        if (!this.reverseDependencyGraph.has(dep)) {
          this.reverseDependencyGraph.set(dep, new Set());
        }
        this.reverseDependencyGraph.get(dep)!.add(container.id);
      }
    }
  }

  private extractDependencies(container: ContainerInfo): string[] {
    const dependencies: string[] = [];

    // Extract from depends_on in configuration
    if (container.config?.depends_on) {
      dependencies.push(...container.config.depends_on);
    }

    // Extract from network links
    if (container.config?.links) {
      dependencies.push(...container.config.links.map(link =>
        link.split(':')[0] // Extract container name from link
      ));
    }

    // Extract from volume dependencies
    if (container.config?.volumes_from) {
      dependencies.push(...container.config.volumes_from);
    }

    return dependencies;
  }

  async startWithDependencies(containerId: string): Promise<StartResult> {
    const startOrder = this.calculateStartOrder(containerId);
    const results: StartResult[] = [];

    for (const id of startOrder) {
      try {
        const container = await containerEngine.getContainer(id);
        if (container.status !== 'running') {
          const result = await containerEngine.startContainer(id);
          results.push(result);

          // Wait for container to be healthy before starting dependents
          await this.waitForContainerHealth(id);
        }
      } catch (error) {
        logger.error(`Failed to start dependency ${id}:`, error);
        throw new DependencyStartError(
          `Failed to start dependency chain for ${containerId}`,
          { failedContainer: id, error }
        );
      }
    }

    return {
      success: true,
      startedContainers: results.length,
      details: results
    };
  }

  private calculateStartOrder(containerId: string): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (id: string) => {
      if (visiting.has(id)) {
        throw new CircularDependencyError(`Circular dependency detected involving ${id}`);
      }

      if (visited.has(id)) {
        return;
      }

      visiting.add(id);

      const dependencies = this.dependencyGraph.get(id) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    visit(containerId);
    return order;
  }

  private async waitForContainerHealth(
    containerId: string,
    timeout: number = 30000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const container = await containerEngine.getContainer(containerId);

        if (container.health?.status === 'healthy') {
          return;
        }

        if (container.status === 'running' && !container.health) {
          // No health check defined, assume healthy after brief delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          return;
        }

      } catch (error) {
        logger.debug(`Health check failed for ${containerId}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new HealthCheckTimeoutError(
      `Container ${containerId} did not become healthy within ${timeout}ms`
    );
  }
}
```

## 📊 Real-Time Data Processing

### Event-Driven Architecture

```typescript
// Central event hub for real-time updates
class EventHub extends EventEmitter {
  private eventBuffer: Map<string, EventBuffer> = new Map();
  private subscribers: Map<string, Set<EventSubscriber>> = new Map();
  private processingQueue: PriorityQueue<Event> = new PriorityQueue();

  emit(eventType: string, data: any, priority: number = 0): boolean {
    const event: Event = {
      id: this.generateEventId(),
      type: eventType,
      data,
      timestamp: new Date(),
      priority
    };

    // Add to processing queue
    this.processingQueue.enqueue(event, priority);

    // Buffer events for replay
    this.bufferEvent(event);

    // Process immediately if high priority
    if (priority > 5) {
      setImmediate(() => this.processEvent(event));
    }

    return super.emit(eventType, data);
  }

  private async processEvent(event: Event): Promise<void> {
    const subscribers = this.subscribers.get(event.type) || new Set();

    const promises = Array.from(subscribers).map(async (subscriber) => {
      try {
        await subscriber.handleEvent(event);
      } catch (error) {
        logger.error(`Subscriber error for event ${event.type}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  subscribe(eventType: string, subscriber: EventSubscriber): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(subscriber);
  }

  // Event replay for late subscribers
  replayEvents(eventType: string, subscriber: EventSubscriber, since?: Date): void {
    const buffer = this.eventBuffer.get(eventType);
    if (!buffer) return;

    const relevantEvents = since
      ? buffer.events.filter(event => event.timestamp > since)
      : buffer.events;

    for (const event of relevantEvents) {
      setImmediate(() => subscriber.handleEvent(event));
    }
  }
}
```

### Data Stream Processing

```typescript
// Real-time data processing pipeline
class DataStreamProcessor {
  private streams: Map<string, NodeJS.ReadableStream> = new Map();
  private processors: Map<string, StreamProcessor> = new Map();
  private transforms: Map<string, Transform[]> = new Map();

  createStream(
    streamId: string,
    source: StreamSource,
    processors: StreamProcessor[]
  ): void {
    const stream = this.createSourceStream(source);

    // Apply transforms in sequence
    let currentStream = stream;
    for (const processor of processors) {
      currentStream = currentStream.pipe(processor.transform);
    }

    // Handle processed data
    currentStream.on('data', (chunk) => {
      this.handleProcessedData(streamId, chunk);
    });

    currentStream.on('error', (error) => {
      logger.error(`Stream ${streamId} error:`, error);
      this.restartStream(streamId, source, processors);
    });

    this.streams.set(streamId, stream);
  }

  private createSourceStream(source: StreamSource): NodeJS.ReadableStream {
    switch (source.type) {
      case 'container_logs':
        return this.createLogStream(source.containerId);
      case 'metrics':
        return this.createMetricsStream(source.interval);
      case 'events':
        return this.createEventStream(source.filters);
      default:
        throw new Error(`Unknown stream source type: ${source.type}`);
    }
  }

  private createLogStream(containerId: string): NodeJS.ReadableStream {
    const logStream = new PassThrough();

    // Start container log following
    const logProcess = spawn('docker', ['logs', '-f', '--timestamps', containerId]);

    logProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        const logEntry = this.parseLogLine(line);
        if (logEntry) {
          logStream.write(JSON.stringify(logEntry) + '\n');
        }
      }
    });

    logProcess.on('error', (error) => {
      logStream.emit('error', error);
    });

    return logStream;
  }

  private parseLogLine(line: string): LogEntry | null {
    // Parse Docker log format: timestamp + message
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);
    if (!match) return null;

    const [, timestamp, message] = match;

    return {
      timestamp: new Date(timestamp),
      message: message.trim(),
      level: this.inferLogLevel(message),
      source: 'container'
    };
  }

  private inferLogLevel(message: string): LogLevel {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('error') || lowerMessage.includes('err')) {
      return 'error';
    } else if (lowerMessage.includes('warn') || lowerMessage.includes('warning')) {
      return 'warn';
    } else if (lowerMessage.includes('info')) {
      return 'info';
    } else if (lowerMessage.includes('debug')) {
      return 'debug';
    }

    return 'info'; // Default level
  }
}
```

## 🔄 Auto-Discovery and Intelligence

### Project Structure Intelligence

```typescript
// Intelligent project analysis and setup
class ProjectIntelligence {
  private analysisCache: Map<string, ProjectAnalysis> = new Map();
  private patterns: Map<string, ProjectPattern> = new Map();

  constructor() {
    this.initializePatterns();
  }

  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    const cacheKey = `${projectPath}:${await this.getDirectoryHash(projectPath)}`;

    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis = await this.performAnalysis(projectPath);
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  private async performAnalysis(projectPath: string): Promise<ProjectAnalysis> {
    const files = await this.scanDirectory(projectPath);
    const patterns = this.matchPatterns(files);

    return {
      projectType: this.determineProjectType(patterns),
      framework: this.detectFramework(files, patterns),
      buildTool: this.detectBuildTool(files),
      packageManager: this.detectPackageManager(files),
      containerization: this.analyzeContainerization(files),
      dependencies: await this.analyzeDependencies(projectPath, files),
      recommendations: this.generateRecommendations(patterns, files)
    };
  }

  private determineProjectType(patterns: MatchedPattern[]): ProjectType {
    const scores = new Map<ProjectType, number>();

    for (const pattern of patterns) {
      const type = pattern.projectType;
      scores.set(type, (scores.get(type) || 0) + pattern.confidence);
    }

    // Return highest scoring project type
    let maxScore = 0;
    let bestType: ProjectType = 'unknown';

    for (const [type, score] of scores) {
      if (score > maxScore) {
        maxScore = score;
        bestType = type;
      }
    }

    return bestType;
  }

  private detectFramework(files: FileInfo[], patterns: MatchedPattern[]): Framework[] {
    const frameworks: Framework[] = [];

    // Node.js framework detection
    if (files.some(f => f.name === 'package.json')) {
      const packageJson = this.readPackageJson(files);

      if (packageJson.dependencies) {
        if (packageJson.dependencies.express) frameworks.push('express');
        if (packageJson.dependencies.fastify) frameworks.push('fastify');
        if (packageJson.dependencies.next) frameworks.push('nextjs');
        if (packageJson.dependencies.nuxt) frameworks.push('nuxtjs');
        if (packageJson.dependencies.react) frameworks.push('react');
        if (packageJson.dependencies.vue) frameworks.push('vue');
        if (packageJson.dependencies['@nestjs/core']) frameworks.push('nestjs');
      }
    }

    // Python framework detection
    if (files.some(f => f.name === 'requirements.txt' || f.name === 'pyproject.toml')) {
      const requirements = this.readRequirements(files);

      if (requirements.includes('django')) frameworks.push('django');
      if (requirements.includes('flask')) frameworks.push('flask');
      if (requirements.includes('fastapi')) frameworks.push('fastapi');
    }

    return frameworks;
  }

  generateContainerConfiguration(analysis: ProjectAnalysis): ContainerConfig {
    const config: ContainerConfig = {
      name: path.basename(analysis.projectPath),
      build: '.',
      ports: [],
      environment: [],
      volumes: []
    };

    // Configure based on project type
    switch (analysis.projectType) {
      case 'nodejs':
        config.ports = ['3000:3000'];
        config.environment = ['NODE_ENV=development'];
        if (analysis.packageManager === 'pnpm') {
          config.build = {
            context: '.',
            dockerfile: this.generateDockerfile(analysis)
          };
        }
        break;

      case 'python':
        config.ports = ['8000:8000'];
        config.environment = ['PYTHONUNBUFFERED=1'];
        if (analysis.framework.includes('django')) {
          config.environment.push('DJANGO_SETTINGS_MODULE=settings.development');
        }
        break;

      case 'java':
        config.ports = ['8080:8080'];
        config.environment = ['JAVA_OPTS=-Xmx512m'];
        break;
    }

    // Add framework-specific configurations
    for (const framework of analysis.framework) {
      this.applyFrameworkConfig(config, framework, analysis);
    }

    return config;
  }

  private generateDockerfile(analysis: ProjectAnalysis): string {
    const dockerfile = new DockerfileBuilder();

    // Base image selection
    switch (analysis.projectType) {
      case 'nodejs':
        dockerfile.from('node:18-alpine');
        break;
      case 'python':
        dockerfile.from('python:3.11-slim');
        break;
      case 'java':
        dockerfile.from('openjdk:17-jre-slim');
        break;
    }

    // Working directory
    dockerfile.workdir('/app');

    // Copy and install dependencies
    if (analysis.projectType === 'nodejs') {
      dockerfile.copy('package*.json', './');
      if (analysis.packageManager === 'pnpm') {
        dockerfile.run('npm install -g pnpm');
        dockerfile.run('pnpm install --frozen-lockfile');
      } else {
        dockerfile.run('npm ci');
      }
    }

    // Copy source code
    dockerfile.copy('.', '.');

    // Build step (if needed)
    if (analysis.buildTool) {
      dockerfile.run(this.getBuildCommand(analysis.buildTool));
    }

    // Expose port
    if (analysis.defaultPort) {
      dockerfile.expose(analysis.defaultPort);
    }

    // Start command
    dockerfile.cmd(this.getStartCommand(analysis));

    return dockerfile.toString();
  }
}
```

### Intelligent Configuration Generation

```typescript
// Smart configuration generation based on project analysis
class ConfigurationGenerator {
  async generateConfiguration(
    projectPath: string,
    analysis: ProjectAnalysis
  ): Promise<DockronosConfig> {
    const config: DockronosConfig = {
      project: {
        name: path.basename(projectPath),
        description: `Auto-generated configuration for ${analysis.projectType} project`,
        version: '1.0.0'
      },
      containers: [],
      networks: {},
      volumes: {}
    };

    // Generate main application container
    const appContainer = this.generateApplicationContainer(analysis);
    config.containers.push(appContainer);

    // Generate database containers if needed
    const dbContainers = this.generateDatabaseContainers(analysis);
    config.containers.push(...dbContainers);

    // Generate service containers (Redis, etc.)
    const serviceContainers = this.generateServiceContainers(analysis);
    config.containers.push(...serviceContainers);

    // Setup networks
    if (config.containers.length > 1) {
      config.networks = {
        app_network: {
          driver: 'bridge'
        }
      };

      // Add all containers to the network
      for (const container of config.containers) {
        container.networks = ['app_network'];
      }
    }

    // Setup volumes for persistent data
    if (dbContainers.length > 0) {
      config.volumes = {
        db_data: {
          driver: 'local'
        }
      };
    }

    return config;
  }

  private generateApplicationContainer(analysis: ProjectAnalysis): ContainerConfig {
    const container: ContainerConfig = {
      name: 'app',
      build: '.',
      ports: [this.getDefaultPort(analysis)],
      environment: this.getDefaultEnvironment(analysis),
      volumes: this.getDefaultVolumes(analysis)
    };

    // Add development-specific configurations
    if (analysis.packageManager === 'pnpm') {
      container.volumes?.push('pnpm-store:/root/.local/share/pnpm/store');
    }

    if (analysis.projectType === 'nodejs') {
      container.volumes?.push('./src:/app/src');
      container.environment?.push('NODE_ENV=development');
    }

    return container;
  }

  private generateDatabaseContainers(analysis: ProjectAnalysis): ContainerConfig[] {
    const containers: ContainerConfig[] = [];

    // Detect database requirements from dependencies
    const dbTypes = this.detectDatabaseTypes(analysis);

    for (const dbType of dbTypes) {
      switch (dbType) {
        case 'postgresql':
          containers.push({
            name: 'postgres',
            image: 'postgres:15-alpine',
            environment: [
              'POSTGRES_DB=app',
              'POSTGRES_USER=app_user',
              'POSTGRES_PASSWORD=app_password'
            ],
            volumes: ['db_data:/var/lib/postgresql/data'],
            ports: ['5432:5432']
          });
          break;

        case 'mysql':
          containers.push({
            name: 'mysql',
            image: 'mysql:8.0',
            environment: [
              'MYSQL_DATABASE=app',
              'MYSQL_USER=app_user',
              'MYSQL_PASSWORD=app_password',
              'MYSQL_ROOT_PASSWORD=root_password'
            ],
            volumes: ['db_data:/var/lib/mysql'],
            ports: ['3306:3306']
          });
          break;

        case 'mongodb':
          containers.push({
            name: 'mongodb',
            image: 'mongo:6-jammy',
            environment: [
              'MONGO_INITDB_DATABASE=app',
              'MONGO_INITDB_ROOT_USERNAME=admin',
              'MONGO_INITDB_ROOT_PASSWORD=admin_password'
            ],
            volumes: ['db_data:/data/db'],
            ports: ['27017:27017']
          });
          break;
      }
    }

    return containers;
  }

  private detectDatabaseTypes(analysis: ProjectAnalysis): DatabaseType[] {
    const databases: DatabaseType[] = [];

    // Check dependencies
    for (const dep of analysis.dependencies) {
      if (dep.includes('pg') || dep.includes('postgres')) {
        databases.push('postgresql');
      } else if (dep.includes('mysql')) {
        databases.push('mysql');
      } else if (dep.includes('mongodb') || dep.includes('mongoose')) {
        databases.push('mongodb');
      } else if (dep.includes('redis')) {
        databases.push('redis');
      }
    }

    // Check configuration files
    if (analysis.configFiles.some(f => f.includes('database.yml'))) {
      // Rails-style database configuration
      databases.push('postgresql'); // Default assumption
    }

    return [...new Set(databases)]; // Remove duplicates
  }
}
```

## 🔍 Error Handling and Recovery

### Comprehensive Error Management

```typescript
// Multi-layered error handling system
class ErrorManager {
  private errorHandlers: Map<string, ErrorHandler> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private errorHistory: ErrorHistoryEntry[] = [];

  registerErrorHandler(errorType: string, handler: ErrorHandler): void {
    this.errorHandlers.set(errorType, handler);
  }

  registerRecoveryStrategy(errorType: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  async handleError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    const errorType = this.classifyError(error);
    const errorId = this.generateErrorId();

    // Log error details
    const errorEntry: ErrorHistoryEntry = {
      id: errorId,
      type: errorType,
      error,
      context,
      timestamp: new Date(),
      handled: false,
      recovered: false
    };

    this.errorHistory.push(errorEntry);
    logger.error('Error occurred', {
      id: errorId,
      type: errorType,
      message: error.message,
      context
    });

    try {
      // Find appropriate handler
      const handler = this.errorHandlers.get(errorType) || this.getDefaultHandler();

      // Execute error handling
      const handlingResult = await handler.handle(error, context);
      errorEntry.handled = true;

      // Attempt recovery if handler suggests it
      if (handlingResult.shouldRecover) {
        const recoveryResult = await this.attemptRecovery(error, errorType, context);
        errorEntry.recovered = recoveryResult.success;

        return {
          handled: true,
          recovered: recoveryResult.success,
          errorId,
          actions: [...handlingResult.actions, ...recoveryResult.actions]
        };
      }

      return {
        handled: true,
        recovered: false,
        errorId,
        actions: handlingResult.actions
      };

    } catch (handlingError) {
      logger.error('Error handling failed', {
        originalError: error.message,
        handlingError: handlingError.message
      });

      return {
        handled: false,
        recovered: false,
        errorId,
        actions: ['error_handling_failed']
      };
    }
  }

  private classifyError(error: Error): string {
    // Container-related errors
    if (error.message.includes('docker') || error.message.includes('podman')) {
      if (error.message.includes('not found')) return 'container_not_found';
      if (error.message.includes('already exists')) return 'container_already_exists';
      if (error.message.includes('permission denied')) return 'container_permission_denied';
      return 'container_engine_error';
    }

    // Network-related errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return 'network_error';
    }

    // File system errors
    if (error.message.includes('ENOENT')) return 'file_not_found';
    if (error.message.includes('EACCES')) return 'permission_denied';
    if (error.message.includes('ENOSPC')) return 'disk_full';

    // Configuration errors
    if (error instanceof ConfigValidationError) return 'config_validation_error';
    if (error instanceof ConfigNotFoundError) return 'config_not_found';

    // UI errors
    if (error.message.includes('blessed')) return 'ui_error';

    return 'unknown_error';
  }

  private async attemptRecovery(
    error: Error,
    errorType: string,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      return { success: false, actions: ['no_recovery_strategy'] };
    }

    try {
      const result = await strategy.recover(error, context);

      if (result.success) {
        logger.info(`Successfully recovered from ${errorType}`, {
          strategy: strategy.name,
          actions: result.actions
        });
      } else {
        logger.warn(`Recovery attempt failed for ${errorType}`, {
          strategy: strategy.name,
          reason: result.reason
        });
      }

      return result;

    } catch (recoveryError) {
      logger.error(`Recovery strategy failed for ${errorType}:`, recoveryError);
      return {
        success: false,
        actions: ['recovery_strategy_failed'],
        reason: recoveryError.message
      };
    }
  }
}
```

### Auto-Recovery Mechanisms

```typescript
// Intelligent recovery strategies
class RecoveryStrategies {
  static containerEngineError: RecoveryStrategy = {
    name: 'Container Engine Recovery',
    async recover(error: Error, context: ErrorContext): Promise<RecoveryResult> {
      // Try to restart container engine
      try {
        await this.restartContainerEngine();
        return { success: true, actions: ['container_engine_restarted'] };
      } catch (restartError) {
        // Try alternative engine
        const currentEngine = containerEngine.getCurrentEngine();
        const alternativeEngine = currentEngine === 'docker' ? 'podman' : 'docker';

        try {
          await containerEngine.switchEngine(alternativeEngine);
          return {
            success: true,
            actions: [`switched_to_${alternativeEngine}`]
          };
        } catch (switchError) {
          return {
            success: false,
            actions: ['engine_recovery_failed'],
            reason: 'No working container engine available'
          };
        }
      }
    }
  };

  static configurationError: RecoveryStrategy = {
    name: 'Configuration Recovery',
    async recover(error: Error, context: ErrorContext): Promise<RecoveryResult> {
      // Try to regenerate configuration
      try {
        const projectAnalysis = await projectIntelligence.analyzeProject(process.cwd());
        const newConfig = await configurationGenerator.generateConfiguration(
          process.cwd(),
          projectAnalysis
        );

        await configManager.saveConfiguration(newConfig);

        return {
          success: true,
          actions: ['configuration_regenerated']
        };
      } catch (regenerationError) {
        // Fall back to minimal configuration
        try {
          const minimalConfig = configManager.getMinimalConfiguration();
          await configManager.saveConfiguration(minimalConfig);

          return {
            success: true,
            actions: ['minimal_configuration_applied']
          };
        } catch (minimalError) {
          return {
            success: false,
            actions: ['configuration_recovery_failed'],
            reason: 'Could not create any valid configuration'
          };
        }
      }
    }
  };

  static networkError: RecoveryStrategy = {
    name: 'Network Recovery',
    async recover(error: Error, context: ErrorContext): Promise<RecoveryResult> {
      // Check network connectivity
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          actions: ['network_connectivity_issue'],
          reason: 'No network connectivity available'
        };
      }

      // Try to reset container networks
      try {
        await containerEngine.resetNetworks();
        return {
          success: true,
          actions: ['container_networks_reset']
        };
      } catch (resetError) {
        return {
          success: false,
          actions: ['network_reset_failed'],
          reason: resetError.message
        };
      }
    }
  };
}
```

---

*This comprehensive functionality documentation reveals the sophisticated logic and intelligent systems that power Dockronos. The application combines real-time processing, intelligent automation, and robust error handling to deliver a seamless container management experience.*