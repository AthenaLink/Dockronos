# Funcionalidad y Lógica de la Aplicación

Este documento proporciona una cobertura completa de la funcionalidad central de Dockronos, la lógica de negocio y los flujos de trabajo operacionales. Explica cómo funciona la aplicación internamente, los procesos de toma de decisiones y los detalles intrincados de la implementación de funciones.

## 🧠 Lógica Central de la Aplicación

### Ciclo de Vida de la Aplicación

```typescript
// Secuencia de arranque principal de la aplicación
class DockronosApplication {
  private state: ApplicationState = 'initializing';
  private modules: ModuleRegistry = new ModuleRegistry();

  async start(): Promise<void> {
    try {
      this.state = 'initializing';

      // Fase 1: Configuración del Entorno
      await this.initializeEnvironment();

      // Fase 2: Carga de Configuración
      await this.loadConfiguration();

      // Fase 3: Descubrimiento del Motor de Contenedores
      await this.initializeContainerEngine();

      // Fase 4: Inicialización del Sistema UI
      await this.startUISystem();

      // Fase 5: Servicios en Segundo Plano
      await this.startBackgroundServices();

      this.state = 'running';
      logger.info('Aplicación Dockronos iniciada exitosamente');

    } catch (error) {
      this.state = 'error';
      await this.handleStartupError(error);
    }
  }

  private async initializeEnvironment(): Promise<void> {
    // Validar versión de Node.js
    const nodeVersion = process.version;
    if (!semver.gte(nodeVersion, '18.0.0')) {
      throw new StartupError(`Se requiere Node.js 18+, encontrado ${nodeVersion}`);
    }

    // Configurar manejadores de señales
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => this.handleUncaughtException(error));
    process.on('unhandledRejection', (reason) => this.handleUnhandledRejection(reason));

    // Inicializar sistema de logging
    await this.initializeLogger();
  }
}
```

### Arquitectura de Gestión de Estado

```typescript
// Máquina de estado de la aplicación
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
      logger.warn(`Transición inválida de ${this.currentState} a ${targetState}`);
      return false;
    }

    if (transition.condition && !transition.condition()) {
      logger.debug(`Condición de transición no cumplida para ${this.currentState} -> ${targetState}`);
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
      logger.error(`Transición falló de ${this.currentState} a ${targetState}:`, error);
      this.currentState = 'error';
      return false;
    }
  }
}
```

## 🐳 Lógica de Gestión de Contenedores

### Gestión del Ciclo de Vida de Contenedores

```typescript
// Manejo completo del ciclo de vida de contenedores
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
      // Validar que la acción esté permitida para el estado actual
      await this.validateAction(container, action);

      // Hooks pre-acción
      await this.executePreActionHooks(container, action);

      // Ejecutar la acción real
      const result = await this.performAction(container, action);

      // Hooks post-acción
      await this.executePostActionHooks(container, action, result);

      // Actualizar estado interno
      await this.updateContainerState(container.id);

      const duration = performance.now() - startTime;
      logger.info(`Acción de contenedor completada`, {
        container: container.name,
        action,
        duration: `${duration.toFixed(2)}ms`,
        success: true
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Acción de contenedor falló`, {
        container: container.name,
        action,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });

      throw new ContainerActionError(
        `Falló al ${action} contenedor ${container.name}: ${error.message}`,
        { container, action, originalError: error }
      );
    }
  }

  private async validateAction(
    container: ContainerInfo,
    action: ContainerAction
  ): Promise<void> {
    // Verificar si la acción es válida para el estado actual del contenedor
    const validActions = this.getValidActionsForState(container.status);
    if (!validActions.includes(action)) {
      throw new InvalidActionError(
        `No se puede ${action} contenedor en estado ${container.status}. Acciones válidas: ${validActions.join(', ')}`
      );
    }

    // Verificar dependencias
    if (action === 'stop' || action === 'remove') {
      const dependents = await this.findDependentContainers(container.id);
      if (dependents.length > 0) {
        const warning = `El contenedor ${container.name} tiene dependientes: ${dependents.map(c => c.name).join(', ')}`;
        logger.warn(warning);

        // Permitir con advertencia pero notificar al usuario
        this.ui.showWarning(warning);
      }
    }

    // Verificar conflictos de recursos
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
        throw new Error(`Acción desconocida: ${action}`);
    }
  }
}
```

### Dependencias Inteligentes de Contenedores

```typescript
// Resolución inteligente de dependencias
class ContainerDependencyResolver {
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();

  buildDependencyGraph(containers: ContainerInfo[]): void {
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();

    for (const container of containers) {
      const dependencies = this.extractDependencies(container);
      this.dependencyGraph.set(container.id, new Set(dependencies));

      // Construir grafo inverso para encontrar dependientes
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

    // Extraer de depends_on en la configuración
    if (container.config?.depends_on) {
      dependencies.push(...container.config.depends_on);
    }

    // Extraer de enlaces de red
    if (container.config?.links) {
      dependencies.push(...container.config.links.map(link =>
        link.split(':')[0] // Extraer nombre del contenedor del enlace
      ));
    }

    // Extraer de dependencias de volúmenes
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

          // Esperar a que el contenedor esté saludable antes de iniciar dependientes
          await this.waitForContainerHealth(id);
        }
      } catch (error) {
        logger.error(`Falló al iniciar dependencia ${id}:`, error);
        throw new DependencyStartError(
          `Falló al iniciar cadena de dependencias para ${containerId}`,
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
        throw new CircularDependencyError(`Dependencia circular detectada involucrando ${id}`);
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
          // No hay health check definido, asumir saludable después de una breve demora
          await new Promise(resolve => setTimeout(resolve, 2000));
          return;
        }

      } catch (error) {
        logger.debug(`Verificación de salud falló para ${containerId}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new HealthCheckTimeoutError(
      `El contenedor ${containerId} no se volvió saludable en ${timeout}ms`
    );
  }
}
```

## 📊 Procesamiento de Datos en Tiempo Real

### Arquitectura Dirigida por Eventos

```typescript
// Hub central de eventos para actualizaciones en tiempo real
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

    // Agregar a la cola de procesamiento
    this.processingQueue.enqueue(event, priority);

    // Buffer de eventos para reproducción
    this.bufferEvent(event);

    // Procesar inmediatamente si es de alta prioridad
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
        logger.error(`Error del suscriptor para evento ${event.type}:`, error);
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

  // Reproducción de eventos para suscriptores tardíos
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

### Procesamiento de Flujos de Datos

```typescript
// Pipeline de procesamiento de datos en tiempo real
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

    // Aplicar transformaciones en secuencia
    let currentStream = stream;
    for (const processor of processors) {
      currentStream = currentStream.pipe(processor.transform);
    }

    // Manejar datos procesados
    currentStream.on('data', (chunk) => {
      this.handleProcessedData(streamId, chunk);
    });

    currentStream.on('error', (error) => {
      logger.error(`Error en flujo ${streamId}:`, error);
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
        throw new Error(`Tipo de fuente de flujo desconocido: ${source.type}`);
    }
  }

  private createLogStream(containerId: string): NodeJS.ReadableStream {
    const logStream = new PassThrough();

    // Iniciar seguimiento de logs del contenedor
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
    // Parsear formato de log de Docker: timestamp + mensaje
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

    return 'info'; // Nivel por defecto
  }
}
```

## 🔄 Auto-Descubrimiento e Inteligencia

### Inteligencia de Estructura de Proyecto

```typescript
// Análisis inteligente de proyectos y configuración
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

    // Devolver el tipo de proyecto con mayor puntuación
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

    // Detección de framework Node.js
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

    // Detección de framework Python
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

    // Configurar basado en el tipo de proyecto
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

    // Agregar configuraciones específicas del framework
    for (const framework of analysis.framework) {
      this.applyFrameworkConfig(config, framework, analysis);
    }

    return config;
  }

  private generateDockerfile(analysis: ProjectAnalysis): string {
    const dockerfile = new DockerfileBuilder();

    // Selección de imagen base
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

    // Directorio de trabajo
    dockerfile.workdir('/app');

    // Copiar e instalar dependencias
    if (analysis.projectType === 'nodejs') {
      dockerfile.copy('package*.json', './');
      if (analysis.packageManager === 'pnpm') {
        dockerfile.run('npm install -g pnpm');
        dockerfile.run('pnpm install --frozen-lockfile');
      } else {
        dockerfile.run('npm ci');
      }
    }

    // Copiar código fuente
    dockerfile.copy('.', '.');

    // Paso de construcción (si es necesario)
    if (analysis.buildTool) {
      dockerfile.run(this.getBuildCommand(analysis.buildTool));
    }

    // Exponer puerto
    if (analysis.defaultPort) {
      dockerfile.expose(analysis.defaultPort);
    }

    // Comando de inicio
    dockerfile.cmd(this.getStartCommand(analysis));

    return dockerfile.toString();
  }
}
```

### Generación Inteligente de Configuración

```typescript
// Generación inteligente de configuración basada en análisis de proyecto
class ConfigurationGenerator {
  async generateConfiguration(
    projectPath: string,
    analysis: ProjectAnalysis
  ): Promise<DockronosConfig> {
    const config: DockronosConfig = {
      project: {
        name: path.basename(projectPath),
        description: `Configuración auto-generada para proyecto ${analysis.projectType}`,
        version: '1.0.0'
      },
      containers: [],
      networks: {},
      volumes: {}
    };

    // Generar contenedor de aplicación principal
    const appContainer = this.generateApplicationContainer(analysis);
    config.containers.push(appContainer);

    // Generar contenedores de base de datos si es necesario
    const dbContainers = this.generateDatabaseContainers(analysis);
    config.containers.push(...dbContainers);

    // Generar contenedores de servicios (Redis, etc.)
    const serviceContainers = this.generateServiceContainers(analysis);
    config.containers.push(...serviceContainers);

    // Configurar redes
    if (config.containers.length > 1) {
      config.networks = {
        app_network: {
          driver: 'bridge'
        }
      };

      // Agregar todos los contenedores a la red
      for (const container of config.containers) {
        container.networks = ['app_network'];
      }
    }

    // Configurar volúmenes para datos persistentes
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

    // Agregar configuraciones específicas de desarrollo
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

    // Detectar requerimientos de base de datos desde dependencias
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

    // Verificar dependencias
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

    // Verificar archivos de configuración
    if (analysis.configFiles.some(f => f.includes('database.yml'))) {
      // Configuración de base de datos estilo Rails
      databases.push('postgresql'); // Asunción por defecto
    }

    return [...new Set(databases)]; // Remover duplicados
  }
}
```

## 🔍 Manejo de Errores y Recuperación

### Gestión Completa de Errores

```typescript
// Sistema de manejo de errores multicapa
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

    // Registrar detalles del error
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
    logger.error('Error ocurrido', {
      id: errorId,
      type: errorType,
      message: error.message,
      context
    });

    try {
      // Encontrar manejador apropiado
      const handler = this.errorHandlers.get(errorType) || this.getDefaultHandler();

      // Ejecutar manejo de errores
      const handlingResult = await handler.handle(error, context);
      errorEntry.handled = true;

      // Intentar recuperación si el manejador lo sugiere
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
      logger.error('Manejo de errores falló', {
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
    // Errores relacionados con contenedores
    if (error.message.includes('docker') || error.message.includes('podman')) {
      if (error.message.includes('not found')) return 'container_not_found';
      if (error.message.includes('already exists')) return 'container_already_exists';
      if (error.message.includes('permission denied')) return 'container_permission_denied';
      return 'container_engine_error';
    }

    // Errores relacionados con la red
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return 'network_error';
    }

    // Errores del sistema de archivos
    if (error.message.includes('ENOENT')) return 'file_not_found';
    if (error.message.includes('EACCES')) return 'permission_denied';
    if (error.message.includes('ENOSPC')) return 'disk_full';

    // Errores de configuración
    if (error instanceof ConfigValidationError) return 'config_validation_error';
    if (error instanceof ConfigNotFoundError) return 'config_not_found';

    // Errores de UI
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
        logger.info(`Recuperación exitosa de ${errorType}`, {
          strategy: strategy.name,
          actions: result.actions
        });
      } else {
        logger.warn(`Intento de recuperación falló para ${errorType}`, {
          strategy: strategy.name,
          reason: result.reason
        });
      }

      return result;

    } catch (recoveryError) {
      logger.error(`Estrategia de recuperación falló para ${errorType}:`, recoveryError);
      return {
        success: false,
        actions: ['recovery_strategy_failed'],
        reason: recoveryError.message
      };
    }
  }
}
```

### Mecanismos de Auto-Recuperación

```typescript
// Estrategias inteligentes de recuperación
class RecoveryStrategies {
  static containerEngineError: RecoveryStrategy = {
    name: 'Recuperación de Motor de Contenedores',
    async recover(error: Error, context: ErrorContext): Promise<RecoveryResult> {
      // Intentar reiniciar motor de contenedores
      try {
        await this.restartContainerEngine();
        return { success: true, actions: ['container_engine_restarted'] };
      } catch (restartError) {
        // Intentar motor alternativo
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
            reason: 'No hay motor de contenedores funcionando disponible'
          };
        }
      }
    }
  };

  static configurationError: RecoveryStrategy = {
    name: 'Recuperación de Configuración',
    async recover(error: Error, context: ErrorContext): Promise<RecoveryResult> {
      // Intentar regenerar configuración
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
        // Recurrir a configuración mínima
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
            reason: 'No se pudo crear ninguna configuración válida'
          };
        }
      }
    }
  };

  static networkError: RecoveryStrategy = {
    name: 'Recuperación de Red',
    async recover(error: Error, context: ErrorContext): Promise<RecoveryResult> {
      // Verificar conectividad de red
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          actions: ['network_connectivity_issue'],
          reason: 'No hay conectividad de red disponible'
        };
      }

      // Intentar resetear redes de contenedores
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

*Esta documentación completa de funcionalidad revela la lógica sofisticada y los sistemas inteligentes que impulsan Dockronos. La aplicación combina procesamiento en tiempo real, automatización inteligente y manejo robusto de errores para ofrecer una experiencia perfecta de gestión de contenedores.*