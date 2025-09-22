# Architecture Overview

This document provides a comprehensive overview of Dockronos architecture, design patterns, and system organization. Understanding the architecture is essential for contributors and developers looking to extend or modify Dockronos.

## 🏗️ High-Level Architecture

Dockronos follows a modular, event-driven architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dockronos Application                   │
├─────────────────────────────────────────────────────────────────┤
│                     User Interface Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  Services Panel │ │  Metrics Panel  │ │   Logs Panel    │   │
│  │   (Blessed)     │ │   (Blessed)     │ │   (Blessed)     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Application Logic Layer                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Configuration   │ │    Container    │ │   Git Manager   │   │
│  │   Manager       │ │     Engine      │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │    Template     │ │    Registry     │ │     Metrics     │   │
│  │   Manager       │ │   Integration   │ │   Collector     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Docker/Podman   │ │  File System    │ │   Git Commands  │   │
│  │   Commands      │ │   Operations    │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🏛️ Core Design Principles

### 1. Modular Architecture
- **Single Responsibility**: Each module has a clear, focused purpose
- **Loose Coupling**: Modules interact through well-defined interfaces
- **High Cohesion**: Related functionality is grouped together

### 2. Event-Driven Communication
- **Observer Pattern**: Components subscribe to events they care about
- **Async Operations**: Non-blocking operations for better UX
- **Real-time Updates**: Live data streaming and UI updates

### 3. Cross-Platform Compatibility
- **Engine Abstraction**: Docker/Podman through unified interface
- **Path Handling**: Platform-agnostic file system operations
- **Terminal Compatibility**: Works across different terminal emulators

### 4. TypeScript-First Design
- **Strong Typing**: Comprehensive type coverage
- **Interface Contracts**: Clear API boundaries
- **Compile-time Safety**: Catch errors before runtime

## 📁 Project Structure Deep Dive

```
src/
├── index.ts                    # Application entry point & CLI setup
├── config/                     # Configuration management
│   └── index.ts               # YAML config loading & validation
├── engine/                     # Container engine abstraction
│   └── index.ts               # Docker/Podman unified interface
├── env-editor/                 # Environment file management
│   └── index.ts               # .env file editing capabilities
├── git/                        # Git repository management
│   └── index.ts               # Git operations & auto-discovery
├── metrics/                    # System monitoring
│   └── index.ts               # Metrics collection & aggregation
├── registry/                   # Container registry integration
│   └── index.ts               # Docker Hub, GHCR, Quay support
├── templates/                  # Container templates
│   ├── index.ts               # Template management system
│   └── definitions/           # Pre-built templates
│       ├── redis.ts
│       ├── postgres.ts
│       ├── mongo.ts
│       ├── mysql.ts
│       └── nginx.ts
├── types/                      # TypeScript definitions
│   ├── index.ts               # Core application types
│   ├── git.ts                 # Git-related types
│   ├── registry.ts            # Registry & template types
│   └── blessed.d.ts           # Blessed framework type extensions
├── ui/                         # Terminal user interface
│   ├── index.ts               # Main UI controller & orchestration
│   └── components/            # UI components
│       ├── services-table.ts  # Services management panel
│       ├── metrics-panel.ts   # System metrics display
│       └── logs-panel.ts      # Log streaming panel
└── utils/                      # Shared utilities
    └── index.ts               # Common helper functions
```

## 🔧 Core Components

### 1. Application Entry Point (`src/index.ts`)

The main entry point orchestrates the entire application:

```typescript
// CLI Command Structure
program
  .command('start')      // Interactive TUI
  .command('init')       // Configuration initialization
  .command('list')       // Container listing
  .command('up/down')    // Service management
  .command('logs')       // Log viewing
  .command('pull')       // Container registry operations
  .command('templates')  // Template management
  .command('git')        // Git repository operations
```

**Responsibilities**:
- CLI argument parsing with Commander.js
- Command routing and execution
- Error handling and user feedback
- Integration of all subsystems

### 2. Configuration Manager (`src/config/`)

Handles all configuration-related operations:

```typescript
export class ConfigManager {
  // Configuration loading and validation
  async loadConfig(configPath?: string): Promise<ProjectConfig>
  async saveConfig(config?: ProjectConfig): Promise<void>

  // Service management
  async addService(service: ServiceConfig): Promise<void>
  async removeService(serviceName: string): Promise<void>
  async updateService(serviceName: string, updates: Partial<ServiceConfig>): Promise<void>

  // Auto-discovery
  async autoDiscoverServices(rootDirectory?: string): Promise<ServiceConfig[]>
}
```

**Key Features**:
- YAML configuration parsing and validation
- Auto-discovery of docker-compose services
- Configuration file search hierarchy
- Service configuration management

### 3. Container Engine (`src/engine/`)

Provides unified interface for Docker and Podman:

```typescript
export class ContainerEngineManager {
  // Engine detection and initialization
  async initialize(): Promise<void>
  private async detectEngine(): Promise<void>

  // Container operations
  async listContainers(): Promise<ContainerInfo[]>
  async startServices(services: string[], cwd?: string): Promise<void>
  async stopServices(services: string[], cwd?: string): Promise<void>
  async restartServices(services: string[], cwd?: string): Promise<void>

  // Logging and monitoring
  async getLogs(service?: string, follow?: boolean, cwd?: string): Promise<NodeJS.ReadableStream>
  async getStats(): Promise<string[]>
}
```

**Architecture Benefits**:
- **Engine Abstraction**: Single API for Docker/Podman
- **Automatic Detection**: Runtime engine discovery
- **Fallback Support**: Demo mode when no engine available
- **Command Mapping**: Engine-specific command translation

### 4. UI System (`src/ui/`)

Terminal user interface built with blessed:

```typescript
export class CronosUI {
  // UI lifecycle
  async start(): Promise<void>
  destroy(): void

  // Panel management
  private setFocus(focus: 'services' | 'metrics' | 'logs'): void
  private cycleFocus(): void

  // Event handling
  private setupKeyBindings(): void
  private setupEventHandlers(): void

  // Data management
  private async refreshContainers(): Promise<void>
  private async handleServiceAction(action: string, container: ContainerInfo): Promise<void>
}
```

**UI Architecture**:
- **Three-Panel Layout**: Services, Metrics, Logs
- **Event-Driven Updates**: Real-time data refresh
- **Keyboard Navigation**: Efficient hotkey system
- **Responsive Design**: Adapts to terminal size

### 5. Git Integration (`src/git/`)

Repository management and service discovery:

```typescript
export class GitManager {
  // Repository operations
  async cloneRepository(options: GitCloneOptions): Promise<void>
  async updateRepository(repositoryPath: string): Promise<GitUpdateResult>
  async removeRepository(repositoryPath: string, force?: boolean): Promise<void>

  // Repository information
  async getRepositoryStatus(repositoryPath: string): Promise<GitStatus>
  async listRepositories(): Promise<GitStatus[]>

  // Service discovery
  async autoDiscoverServices(repositoryPath?: string): Promise<ServiceConfig[]>
}
```

**Git Features**:
- **Repository Cloning**: HTTPS and SSH support
- **Branch Management**: Specific branch cloning
- **Auto-Discovery**: Find docker-compose services in repos
- **Status Tracking**: Ahead/behind, modified files

### 6. Template System (`src/templates/`)

Pre-configured container templates:

```typescript
export class TemplateManager {
  // Template management
  getTemplate(name: string): ContainerTemplate | undefined
  listTemplates(): ContainerTemplate[]
  searchTemplates(query: string): ContainerTemplate[]
  getTemplatesByCategory(): Record<string, ContainerTemplate[]>

  // Template validation
  validateTemplate(template: ContainerTemplate): string[]
}
```

**Template Architecture**:
- **Category Organization**: Databases, Web Servers, Caching
- **Configuration Validation**: Required/optional environment variables
- **Documentation Integration**: Built-in usage instructions
- **Extensible Design**: Easy to add new templates

### 7. Registry Integration (`src/registry/`)

Container registry operations:

```typescript
export class ContainerRegistry {
  // Image operations
  async pullImage(image: string, options?: PullOptions): Promise<void>
  async runContainer(options: ContainerRunOptions): Promise<string>
  async searchImages(query: string, limit?: number): Promise<SearchResult[]>
  async listLocalImages(): Promise<ImageInfo[]>

  // Registry management
  addRegistry(name: string, config: RegistryConfig): void
  removeRegistry(name: string): void
}
```

**Registry Features**:
- **Multi-Registry Support**: Docker Hub, GHCR, Quay
- **Image Search**: Public registry search
- **Template Integration**: Pre-configured image deployment
- **Local Image Management**: List and manage local images

### 8. Metrics System (`src/metrics/`)

System and container monitoring:

```typescript
export class MetricsCollector {
  // Metrics collection
  async start(): Promise<void>
  stop(): void

  // Data access
  getSystemMetrics(): SystemMetrics
  getContainerMetrics(): ContainerMetrics[]

  // Event system
  onMetricsUpdate(callback: (system: SystemMetrics, containers: ContainerMetrics[]) => void): void
}
```

**Metrics Architecture**:
- **Real-time Collection**: Continuous monitoring
- **Event-Driven Updates**: Observer pattern for UI updates
- **Multiple Data Sources**: System info + container stats
- **Performance Optimization**: Efficient data collection

## 🔄 Data Flow Architecture

### 1. Application Startup

```
User Input → CLI Parser → Config Manager → Engine Detection → UI Initialization
```

1. **CLI Parsing**: Commander.js processes arguments
2. **Config Loading**: YAML configuration loaded and validated
3. **Engine Detection**: Docker/Podman auto-discovery
4. **UI Setup**: Blessed interface initialization
5. **Data Loading**: Initial container and metrics data

### 2. Interactive Operations

```
User Input → UI Event → Action Handler → Engine/Manager → Data Update → UI Refresh
```

1. **Keyboard Input**: Blessed captures and routes key events
2. **Action Mapping**: Key events mapped to application actions
3. **Business Logic**: Appropriate manager handles the operation
4. **External Commands**: Docker/Podman/Git commands executed
5. **UI Updates**: Interface refreshed with new data

### 3. Real-time Updates

```
Timer → Metrics Collection → Event Emission → UI Update
Background Process → Log Stream → Event Emission → UI Update
```

1. **Scheduled Updates**: Periodic data refresh
2. **Stream Processing**: Real-time log and metric streams
3. **Event System**: Observer pattern for component communication
4. **UI Rendering**: Blessed re-renders affected components

## 🎛️ Event System Architecture

Dockronos uses an event-driven architecture for loose coupling:

### Core Events

```typescript
// System events
interface SystemEvents {
  'metrics-update': (system: SystemMetrics, containers: ContainerMetrics[]) => void
  'container-state-change': (container: ContainerInfo) => void
  'config-reload': (config: ProjectConfig) => void
}

// UI events
interface UIEvents {
  'service-select': (container: ContainerInfo) => void
  'service-action': (action: string, container: ContainerInfo) => void
  'panel-focus': (panel: string) => void
}

// Git events
interface GitEvents {
  'repository-cloned': (path: string) => void
  'repository-updated': (result: GitUpdateResult) => void
  'services-discovered': (services: ServiceConfig[]) => void
}
```

### Event Flow Example

```
User presses 'S' → UI captures key → Emits 'service-action' event →
ContainerEngine receives event → Executes docker compose up →
Emits 'container-state-change' → UI receives event → Updates display
```

## 🔧 Extension Points

The architecture provides several extension points for customization:

### 1. Custom Templates

```typescript
// Add custom template
const customTemplate: ContainerTemplate = {
  name: 'my-custom-service',
  description: 'Custom service template',
  category: 'custom',
  image: 'mycompany/myservice:latest',
  // ... configuration
}

templateManager.addTemplate(customTemplate)
```

### 2. Custom Commands

```typescript
// Add custom CLI command
program
  .command('custom-action')
  .description('My custom action')
  .action(async () => {
    // Custom logic
  })
```

### 3. UI Extensions

```typescript
// Custom UI panel
class CustomPanel extends blessed.Box {
  constructor(options: any) {
    super(options)
    this.setupCustomPanel()
  }

  private setupCustomPanel() {
    // Custom panel logic
  }
}
```

### 4. Custom Engine Support

```typescript
// Custom container engine
class CustomEngine implements ContainerEngineInterface {
  async initialize(): Promise<void> { /* */ }
  async listContainers(): Promise<ContainerInfo[]> { /* */ }
  // ... implement interface
}
```

## 🧪 Testing Architecture

### Test Structure

```
test/
├── unit/                       # Unit tests
│   ├── config/
│   ├── engine/
│   ├── git/
│   └── templates/
├── integration/                # Integration tests
│   ├── container-operations/
│   ├── git-workflows/
│   └── ui-interactions/
└── e2e/                       # End-to-end tests
    ├── full-workflows/
    └── cross-platform/
```

### Testing Patterns

1. **Unit Tests**: Mock external dependencies
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Full application workflows
4. **UI Tests**: Terminal interface testing

## 🔒 Security Considerations

### 1. Command Injection Prevention

```typescript
// Safe command execution
const sanitizeInput = (input: string): string => {
  return input.replace(/[;&|`$]/g, '')
}

// Parameterized commands
const { stdout } = await execAsync(`docker ps --format "${format}"`)
```

### 2. Path Traversal Protection

```typescript
// Safe path resolution
const safePath = path.resolve(path.join(basePath, userInput))
if (!safePath.startsWith(basePath)) {
  throw new Error('Invalid path')
}
```

### 3. Environment Variable Sanitization

```typescript
// Sanitize environment variables
const sanitizeEnvVar = (value: string): string => {
  return value.replace(/[\n\r\0]/g, '')
}
```

## 🚀 Performance Optimizations

### 1. Lazy Loading

```typescript
// Lazy component initialization
class LazyComponent {
  private _component?: RealComponent

  get component(): RealComponent {
    if (!this._component) {
      this._component = new RealComponent()
    }
    return this._component
  }
}
```

### 2. Debounced Updates

```typescript
// Debounce frequent updates
const debouncedRefresh = debounce(async () => {
  await this.refreshContainers()
}, 1000)
```

### 3. Efficient Data Structures

```typescript
// Use Maps for O(1) lookups
const containerMap = new Map<string, ContainerInfo>()

// Use Sets for unique collections
const runningContainers = new Set<string>()
```

### 4. Stream Processing

```typescript
// Process logs as streams
const logStream = await containerEngine.getLogs(serviceName, true)
logStream.on('data', (chunk: Buffer) => {
  // Process chunk incrementally
})
```

## 🔮 Future Architecture Considerations

### 1. Plugin System

```typescript
interface Plugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy(): Promise<void>
}

class PluginManager {
  loadPlugin(plugin: Plugin): void
  unloadPlugin(name: string): void
}
```

### 2. Remote Operations

```typescript
interface RemoteEngine {
  connect(host: string, credentials: Credentials): Promise<void>
  disconnect(): Promise<void>
}
```

### 3. Configuration Templating

```typescript
interface ConfigTemplate {
  name: string
  variables: VariableDefinition[]
  generate(values: Record<string, any>): ProjectConfig
}
```

### 4. Advanced Metrics

```typescript
interface MetricsStore {
  saveMetrics(metrics: SystemMetrics): Promise<void>
  queryMetrics(timeRange: TimeRange): Promise<SystemMetrics[]>
  getAlerts(): Promise<Alert[]>
}
```

## 📚 Additional Resources

### Architecture Patterns Used

1. **MVC Pattern**: Separation of UI, logic, and data
2. **Observer Pattern**: Event-driven communication
3. **Strategy Pattern**: Multiple container engine support
4. **Factory Pattern**: Template and component creation
5. **Singleton Pattern**: Global managers and configuration

### External Dependencies

| Dependency | Purpose | Architecture Impact |
|------------|---------|-------------------|
| blessed | Terminal UI framework | UI layer foundation |
| blessed-contrib | Additional UI components | Enhanced UI components |
| commander | CLI parsing | Command routing |
| yaml | Configuration parsing | Config format support |
| systeminformation | System metrics | Metrics data source |
| chalk | Terminal colors | Output formatting |

### Design Decisions

1. **TypeScript over JavaScript**: Type safety and better IDE support
2. **blessed over alternatives**: Mature, stable terminal UI framework
3. **YAML over JSON**: Human-readable configuration format
4. **Event-driven architecture**: Loose coupling and real-time updates
5. **Modular design**: Maintainability and testability

---

*This architecture documentation is maintained alongside the codebase. For implementation details, see the [Component Documentation](../components/) section.*