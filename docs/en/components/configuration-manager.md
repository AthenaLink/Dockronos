# Configuration Manager

The Configuration Manager handles all application settings, project discovery, and configuration file management in Dockronos. It provides a centralized system for managing YAML configurations, environment variables, and project-specific settings.

## 🏗️ Architecture Overview

### Core Components

```typescript
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;
  private configPath: string | null = null;
  private projectRoot: string | null = null;
  private watcher: chokidar.FSWatcher | null = null;

  // Event emitters for configuration changes
  private configChangeEmitter = new EventEmitter();
}
```

**Key Responsibilities**:
- **Configuration Loading**: Parse and validate YAML configuration files
- **Project Discovery**: Automatically detect project structure and settings
- **Hot Reloading**: Watch for configuration changes and update runtime
- **Validation**: Ensure configuration integrity and provide helpful error messages
- **Defaults Management**: Apply sensible defaults when configuration is missing

## 📁 Configuration File Structure

### Primary Configuration (`dockronos.yml`)

```yaml
# Project metadata
project:
  name: "my-awesome-app"
  description: "A containerized web application"
  version: "1.0.0"

# Container engine preferences
engine:
  preferred: "docker"  # or "podman"
  fallback: true       # Try other engines if preferred fails
  timeout: 30000       # Command timeout in milliseconds

# UI customization
ui:
  theme: "default"     # UI color scheme
  refreshInterval: 5000 # Update frequency in milliseconds
  panels:
    services:
      autoExpand: true
      showImages: true
    metrics:
      enabled: true
      historySize: 100
    logs:
      followMode: true
      maxLines: 1000

# Container definitions
containers:
  - name: "web-frontend"
    image: "nginx:alpine"
    ports:
      - "8080:80"
    environment:
      - "NODE_ENV=production"
    volumes:
      - "./dist:/usr/share/nginx/html"

  - name: "api-backend"
    build: "./api"
    ports:
      - "3000:3000"
    environment:
      - "DATABASE_URL=postgresql://user:pass@db:5432/app"
    depends_on:
      - database

# Templates and presets
templates:
  enabled: true
  directory: ".dockronos/templates"

# Git integration
git:
  enabled: true
  autoCommit: false
  hooks:
    pre_start: "npm run build"
    post_stop: "npm run cleanup"
```

### Environment Configuration (`.env`)

```bash
# Database configuration
DATABASE_URL=postgresql://localhost:5432/development
DATABASE_USER=dev_user
DATABASE_PASSWORD=dev_password

# API configuration
API_PORT=3000
API_HOST=localhost
JWT_SECRET=your-secret-key

# External services
REDIS_URL=redis://localhost:6379
STRIPE_API_KEY=sk_test_...
```

## 🔍 Configuration Discovery System

### Auto-Discovery Algorithm

```typescript
async function discoverConfiguration(): Promise<ConfigDiscoveryResult> {
  const discoveryPaths = [
    './dockronos.yml',
    './dockronos.yaml',
    './.dockronos/config.yml',
    './compose.yml',
    './docker-compose.yml',
    './docker-compose.yaml'
  ];

  for (const path of discoveryPaths) {
    try {
      const fullPath = resolve(process.cwd(), path);
      if (await exists(fullPath)) {
        return {
          configPath: fullPath,
          type: this.detectConfigType(path),
          projectRoot: dirname(fullPath)
        };
      }
    } catch (error) {
      logger.debug(`Failed to check ${path}:`, error);
    }
  }

  throw new ConfigurationError('No configuration file found');
}
```

### Configuration Type Detection

```typescript
private detectConfigType(filePath: string): ConfigType {
  const filename = basename(filePath);

  if (filename.startsWith('dockronos')) {
    return 'dockronos';
  } else if (filename.startsWith('compose') || filename.includes('docker-compose')) {
    return 'docker-compose';
  } else {
    return 'unknown';
  }
}
```

### Project Structure Analysis

```typescript
interface ProjectStructure {
  hasDockerfile: boolean;
  hasPackageJson: boolean;
  hasRequirementsTxt: boolean;
  hasPomXml: boolean;
  hasCargoToml: boolean;
  hasGoMod: boolean;
  language: 'node' | 'python' | 'java' | 'rust' | 'go' | 'unknown';
  framework: string[];
  buildTools: string[];
}

async function analyzeProjectStructure(projectRoot: string): Promise<ProjectStructure> {
  const structure: ProjectStructure = {
    hasDockerfile: false,
    hasPackageJson: false,
    hasRequirementsTxt: false,
    hasPomXml: false,
    hasCargoToml: false,
    hasGoMod: false,
    language: 'unknown',
    framework: [],
    buildTools: []
  };

  // Check for various project files
  const files = await readdir(projectRoot);

  for (const file of files) {
    switch (file.toLowerCase()) {
      case 'dockerfile':
        structure.hasDockerfile = true;
        break;
      case 'package.json':
        structure.hasPackageJson = true;
        structure.language = 'node';
        await this.analyzePackageJson(join(projectRoot, file), structure);
        break;
      case 'requirements.txt':
        structure.hasRequirementsTxt = true;
        structure.language = 'python';
        break;
      case 'pom.xml':
        structure.hasPomXml = true;
        structure.language = 'java';
        break;
      case 'cargo.toml':
        structure.hasCargoToml = true;
        structure.language = 'rust';
        break;
      case 'go.mod':
        structure.hasGoMod = true;
        structure.language = 'go';
        break;
    }
  }

  return structure;
}
```

## ⚙️ Configuration Loading and Validation

### YAML Parser with Schema Validation

```typescript
class ConfigLoader {
  private schema: JSONSchema7;

  constructor() {
    this.schema = this.loadConfigSchema();
  }

  async loadConfig(configPath: string): Promise<Config> {
    try {
      // Read and parse YAML
      const configContent = await readFile(configPath, 'utf-8');
      const parsedConfig = yaml.load(configContent) as any;

      // Validate against schema
      const validation = this.validateConfig(parsedConfig);
      if (!validation.valid) {
        throw new ConfigValidationError(
          `Configuration validation failed: ${validation.errors.join(', ')}`
        );
      }

      // Apply defaults and transformations
      const config = this.applyDefaults(parsedConfig);

      // Validate container definitions
      await this.validateContainers(config.containers);

      logger.info(`Configuration loaded from ${configPath}`);
      return config;

    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      throw new ConfigurationError(`Failed to load configuration: ${error.message}`);
    }
  }

  private validateConfig(config: any): ValidationResult {
    const validator = new Ajv();
    const validate = validator.compile(this.schema);
    const valid = validate(config);

    return {
      valid,
      errors: validate.errors?.map(error =>
        `${error.instancePath} ${error.message}`
      ) || []
    };
  }
}
```

### Default Configuration Generation

```typescript
private getDefaultConfig(): Config {
  return {
    project: {
      name: basename(process.cwd()),
      description: 'Dockronos managed project',
      version: '1.0.0'
    },
    engine: {
      preferred: 'docker',
      fallback: true,
      timeout: 30000
    },
    ui: {
      theme: 'default',
      refreshInterval: 5000,
      panels: {
        services: {
          autoExpand: true,
          showImages: true
        },
        metrics: {
          enabled: true,
          historySize: 100
        },
        logs: {
          followMode: true,
          maxLines: 1000
        }
      }
    },
    containers: [],
    templates: {
      enabled: true,
      directory: '.dockronos/templates'
    },
    git: {
      enabled: true,
      autoCommit: false,
      hooks: {}
    }
  };
}
```

## 🔄 Hot Reloading System

### File Watching Implementation

```typescript
class ConfigWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  startWatching(configPath: string, callback: (config: Config) => void): void {
    this.watcher = chokidar.watch(configPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('change', () => {
      this.debouncedReload(configPath, callback);
    });

    logger.info(`Watching configuration file: ${configPath}`);
  }

  private debouncedReload(configPath: string, callback: (config: Config) => void): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        logger.info('Configuration file changed, reloading...');
        const newConfig = await this.loadConfig(configPath);
        callback(newConfig);
        logger.info('Configuration reloaded successfully');
      } catch (error) {
        logger.error('Failed to reload configuration:', error);
      }
    }, 500);
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
```

### Configuration Change Events

```typescript
interface ConfigChangeEvent {
  type: 'reload' | 'error';
  config?: Config;
  error?: Error;
  timestamp: Date;
}

class ConfigEventEmitter extends EventEmitter {
  emitConfigChange(event: ConfigChangeEvent): void {
    this.emit('configChange', event);
  }

  onConfigChange(listener: (event: ConfigChangeEvent) => void): void {
    this.on('configChange', listener);
  }

  onConfigReload(listener: (config: Config) => void): void {
    this.on('configChange', (event: ConfigChangeEvent) => {
      if (event.type === 'reload' && event.config) {
        listener(event.config);
      }
    });
  }

  onConfigError(listener: (error: Error) => void): void {
    this.on('configChange', (event: ConfigChangeEvent) => {
      if (event.type === 'error' && event.error) {
        listener(event.error);
      }
    });
  }
}
```

## 🔒 Environment Variable Management

### Secure Environment Loading

```typescript
class EnvironmentManager {
  private envVars: Map<string, string> = new Map();
  private sensitiveKeys = new Set([
    'password', 'secret', 'key', 'token', 'auth', 'credential'
  ]);

  async loadEnvironmentFiles(projectRoot: string): Promise<void> {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production'
    ];

    for (const envFile of envFiles) {
      const envPath = join(projectRoot, envFile);
      if (await exists(envPath)) {
        await this.loadEnvFile(envPath);
      }
    }
  }

  private async loadEnvFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            this.envVars.set(key.trim(), value);
          }
        }
      }

      logger.debug(`Loaded environment variables from ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to load environment file ${filePath}:`, error);
    }
  }

  getEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};

    for (const [key, value] of this.envVars) {
      env[key] = this.isSensitive(key) ? this.maskValue(value) : value;
    }

    return env;
  }

  private isSensitive(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return Array.from(this.sensitiveKeys).some(sensitive =>
      lowerKey.includes(sensitive)
    );
  }

  private maskValue(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 3) + '*'.repeat(value.length - 6) + value.substring(value.length - 3);
  }
}
```

## 🛠️ Configuration Utilities

### Migration System

```typescript
class ConfigMigrator {
  private migrations: ConfigMigration[] = [
    {
      version: '1.0.0',
      description: 'Initial configuration format',
      migrate: (config: any) => config
    },
    {
      version: '1.1.0',
      description: 'Add UI customization options',
      migrate: (config: any) => {
        if (!config.ui) {
          config.ui = this.getDefaultUIConfig();
        }
        return config;
      }
    },
    {
      version: '1.2.0',
      description: 'Add template system configuration',
      migrate: (config: any) => {
        if (!config.templates) {
          config.templates = {
            enabled: true,
            directory: '.dockronos/templates'
          };
        }
        return config;
      }
    }
  ];

  async migrateConfig(config: any, currentVersion: string): Promise<Config> {
    let migratedConfig = { ...config };

    for (const migration of this.migrations) {
      if (this.shouldApplyMigration(currentVersion, migration.version)) {
        logger.info(`Applying migration: ${migration.description}`);
        migratedConfig = migration.migrate(migratedConfig);
      }
    }

    return migratedConfig;
  }

  private shouldApplyMigration(current: string, target: string): boolean {
    return semver.gt(target, current);
  }
}
```

### Configuration Export and Import

```typescript
class ConfigExporter {
  async exportConfig(config: Config, format: 'yaml' | 'json'): Promise<string> {
    const sanitizedConfig = this.sanitizeConfig(config);

    switch (format) {
      case 'yaml':
        return yaml.dump(sanitizedConfig, {
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });
      case 'json':
        return JSON.stringify(sanitizedConfig, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importConfig(content: string, format: 'yaml' | 'json'): Promise<Config> {
    let parsedConfig: any;

    switch (format) {
      case 'yaml':
        parsedConfig = yaml.load(content);
        break;
      case 'json':
        parsedConfig = JSON.parse(content);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    // Validate and migrate if necessary
    const validation = this.validateConfig(parsedConfig);
    if (!validation.valid) {
      throw new ConfigValidationError(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    return this.applyDefaults(parsedConfig);
  }

  private sanitizeConfig(config: Config): Config {
    // Remove sensitive information and runtime-only settings
    const sanitized = { ...config };

    // Remove any runtime-generated fields
    delete (sanitized as any).__runtime;
    delete (sanitized as any).__internal;

    return sanitized;
  }
}
```

## 🚨 Error Handling and Recovery

### Configuration Error Types

```typescript
export class ConfigurationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigValidationError extends ConfigurationError {
  constructor(message: string, public readonly errors: string[]) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigNotFoundError extends ConfigurationError {
  constructor(searchPaths: string[]) {
    super(`Configuration file not found. Searched: ${searchPaths.join(', ')}`);
    this.name = 'ConfigNotFoundError';
  }
}
```

### Recovery Strategies

```typescript
class ConfigRecovery {
  async recoverFromError(error: Error, context: ConfigContext): Promise<Config> {
    if (error instanceof ConfigNotFoundError) {
      return this.createDefaultConfig(context.projectRoot);
    }

    if (error instanceof ConfigValidationError) {
      return this.repairConfig(context.configPath, error.errors);
    }

    if (error instanceof yaml.YAMLException) {
      return this.repairYamlSyntax(context.configPath);
    }

    throw error; // Re-throw if we can't recover
  }

  private async createDefaultConfig(projectRoot: string): Promise<Config> {
    const defaultConfig = this.getDefaultConfig();
    const structure = await this.analyzeProjectStructure(projectRoot);

    // Customize defaults based on detected project type
    if (structure.language === 'node') {
      defaultConfig.containers.push({
        name: 'app',
        build: '.',
        ports: ['3000:3000'],
        environment: ['NODE_ENV=development']
      });
    }

    return defaultConfig;
  }

  private async repairConfig(configPath: string, errors: string[]): Promise<Config> {
    logger.warn('Attempting to repair configuration...');

    const config = await this.loadConfigUnsafe(configPath);
    const repairedConfig = this.applyRepairs(config, errors);

    // Backup original and save repaired version
    await this.backupConfig(configPath);
    await this.saveConfig(configPath, repairedConfig);

    return repairedConfig;
  }
}
```

## 🎯 Best Practices

### Configuration Organization

1. **Hierarchical Structure**: Organize configuration with clear sections
2. **Environment Separation**: Use different configs for dev/staging/production
3. **Sensitive Data**: Keep secrets in environment variables, not config files
4. **Validation**: Always validate configuration before use
5. **Documentation**: Include comments explaining configuration options

### Performance Optimization

1. **Lazy Loading**: Load configuration only when needed
2. **Caching**: Cache parsed configuration to avoid repeated parsing
3. **Debounced Reloading**: Prevent excessive reloads during rapid file changes
4. **Schema Validation**: Use JSON Schema for fast validation
5. **Memory Management**: Clean up watchers and event listeners properly

### Security Considerations

1. **Input Validation**: Validate all configuration inputs
2. **Path Traversal**: Prevent directory traversal attacks in file paths
3. **Environment Isolation**: Separate development and production configurations
4. **Sensitive Data Masking**: Never log sensitive configuration values
5. **File Permissions**: Ensure configuration files have appropriate permissions

---

*The Configuration Manager provides robust, flexible configuration management that adapts to various project types while maintaining security and performance. It serves as the foundation for Dockronos's intelligent project discovery and customization capabilities.*