# Configuration Guide

Dockronos uses YAML configuration files to define your project structure, services, and preferences. This guide covers all configuration options and best practices.

## 📁 Configuration Files

### Primary Configuration
- **`dockronos.yml`** - Main configuration file (recommended)
- **`dockronos.yaml`** - Alternative YAML extension
- **`.dockronos.yml`** - Hidden configuration file
- **`dockronos.config.yml`** - Extended name format

### Search Order
Dockronos searches for configuration files in this order:
1. `dockronos.yml`
2. `dockronos.yaml`
3. `.dockronos.yml`
4. `.dockronos.yaml`
5. `dockronos.config.yml`
6. `dockronos.config.yaml`

## 📋 Configuration Schema

### Basic Configuration

```yaml
# dockronos.yml
name: my-project                    # Project name
engine: auto                       # Container engine: auto, docker, podman

# Service definitions
services:
  - name: web-app
    directory: ./web
    compose_file: docker-compose.yml
    env_file: .env

# Global settings
global_env: .env.global
projects_directory: "./projects"
```

### Complete Configuration Example

```yaml
# dockronos.yml - Complete example
name: microservices-project
description: "Multi-service containerized application"
version: "1.0.0"
engine: auto  # auto, docker, or podman

# Global settings
global_env: .env.global
projects_directory: "./projects"

# Git repository management (optional)
repositories:
  - url: "https://github.com/company/service-a.git"
    directory: "service-a"
    branch: "develop"
    depth: 1
    recursive: false

  - url: "git@github.com:company/service-b.git"
    directory: "service-b"
    branch: "main"

# Service definitions (docker-compose based)
services:
  - name: web-frontend
    description: "React frontend application"
    directory: ./frontend
    compose_file: docker-compose.yml
    env_file: .env.local

  - name: api-backend
    description: "Node.js API server"
    directory: ./backend
    compose_file: docker-compose.dev.yml
    env_file: .env.development

  - name: database
    description: "PostgreSQL database"
    directory: ./database
    compose_file: docker-compose.db.yml
    env_file: .env.db

# Direct container definitions (alternative to docker-compose)
containers:
  - name: redis-cache
    description: "Redis caching layer"
    image: redis:7-alpine
    ports:
      - "6379:6379"
    env:
      REDIS_PASSWORD: "secret123"
      REDIS_MAXMEMORY: "256mb"
    volumes:
      - "./data/redis:/data"
    restart: unless-stopped
    template: redis

  - name: monitoring
    description: "Application monitoring"
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    env:
      GF_SECURITY_ADMIN_PASSWORD: "admin"
    volumes:
      - "./config/grafana:/etc/grafana"
      - "grafana-storage:/var/lib/grafana"

# Environment overrides
env_overrides:
  development:
    DATABASE_URL: "postgresql://dev:dev@localhost:5432/myapp_dev"
    LOG_LEVEL: "debug"

  production:
    DATABASE_URL: "postgresql://prod:prod@db:5432/myapp_prod"
    LOG_LEVEL: "info"

# UI preferences
ui:
  theme: dark              # dark, light, auto
  refresh_interval: 5000   # milliseconds
  log_buffer_size: 1000    # number of log lines to keep
  show_timestamps: true    # show timestamps in logs
  follow_logs: true        # auto-follow new logs
```

## 🔧 Configuration Options Reference

### Root Level Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `"dockronos-project"` | Project name displayed in UI |
| `description` | string | `""` | Project description |
| `version` | string | `"1.0.0"` | Project version |
| `engine` | string | `"auto"` | Container engine: `auto`, `docker`, `podman` |
| `global_env` | string | `undefined` | Global environment file path |
| `projects_directory` | string | `"./projects"` | Directory for git repositories |

### Services Configuration

Services are docker-compose based container groups:

```yaml
services:
  - name: string                    # Required: Service name
    description: string             # Optional: Service description
    directory: string               # Required: Working directory
    compose_file: string            # Optional: Compose file name (default: docker-compose.yml)
    env_file: string                # Optional: Environment file path
```

#### Service Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | ✅ | Unique service identifier |
| `description` | string | ❌ | Human-readable description |
| `directory` | string | ✅ | Path to service directory |
| `compose_file` | string | ❌ | Docker Compose file name |
| `env_file` | string | ❌ | Environment file path |

### Container Configuration

Direct container definitions without docker-compose:

```yaml
containers:
  - name: string                    # Required: Container name
    description: string             # Optional: Container description
    image: string                   # Required: Container image
    ports: string[]                 # Optional: Port mappings
    env: object                     # Optional: Environment variables
    volumes: string[]               # Optional: Volume mounts
    restart: string                 # Optional: Restart policy
    template: string                # Optional: Template name
```

#### Container Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | ✅ | Unique container name |
| `description` | string | ❌ | Human-readable description |
| `image` | string | ✅ | Container image (e.g., `redis:7-alpine`) |
| `ports` | string[] | ❌ | Port mappings (e.g., `["8080:80"]`) |
| `env` | object | ❌ | Environment variables |
| `volumes` | string[] | ❌ | Volume mounts (e.g., `["./data:/data"]`) |
| `restart` | string | ❌ | Restart policy: `no`, `always`, `unless-stopped`, `on-failure` |
| `template` | string | ❌ | Template name for predefined configurations |

### Git Repository Configuration

Manage git repositories with automatic service discovery:

```yaml
repositories:
  - url: string                     # Required: Git repository URL
    directory: string               # Required: Target directory name
    branch: string                  # Optional: Branch to clone (default: default branch)
    depth: number                   # Optional: Clone depth for shallow clones
    recursive: boolean              # Optional: Clone submodules recursively
```

#### Repository Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `url` | string | ✅ | Git repository URL (HTTPS or SSH) |
| `directory` | string | ✅ | Target directory name |
| `branch` | string | ❌ | Specific branch to clone |
| `depth` | number | ❌ | Shallow clone depth |
| `recursive` | boolean | ❌ | Clone submodules recursively |

### UI Preferences

Customize the terminal interface:

```yaml
ui:
  theme: string                     # dark, light, auto
  refresh_interval: number          # milliseconds
  log_buffer_size: number           # number of log lines
  show_timestamps: boolean          # show timestamps in logs
  follow_logs: boolean              # auto-follow new logs
  max_log_lines: number             # maximum log lines to display
```

## 🏗️ Configuration Examples

### Simple Web Application

```yaml
# Simple web app with database
name: my-web-app
engine: docker

services:
  - name: frontend
    directory: ./client
    compose_file: docker-compose.yml
    env_file: .env

  - name: backend
    directory: ./server
    compose_file: docker-compose.yml
    env_file: .env.server

  - name: database
    directory: ./db
    compose_file: docker-compose.db.yml

global_env: .env.global
```

### Microservices Architecture

```yaml
# Microservices with multiple repositories
name: microservices-platform
description: "Distributed microservices platform"
engine: auto
projects_directory: "./services"

# Clone external repositories
repositories:
  - url: "https://github.com/company/user-service.git"
    directory: "user-service"
    branch: "develop"

  - url: "https://github.com/company/order-service.git"
    directory: "order-service"
    branch: "develop"

  - url: "https://github.com/company/notification-service.git"
    directory: "notification-service"

# Local services
services:
  - name: api-gateway
    directory: ./gateway
    compose_file: docker-compose.gateway.yml
    env_file: .env.gateway

  - name: user-service
    directory: ./services/user-service
    compose_file: docker-compose.yml
    env_file: .env.user

  - name: order-service
    directory: ./services/order-service
    compose_file: docker-compose.yml
    env_file: .env.order

# Shared infrastructure
containers:
  - name: redis-session
    image: redis:7-alpine
    ports: ["6379:6379"]
    env:
      REDIS_PASSWORD: "session_secret"
    template: redis

  - name: postgres-main
    image: postgres:15-alpine
    ports: ["5432:5432"]
    env:
      POSTGRES_DB: "platform"
      POSTGRES_USER: "platform"
      POSTGRES_PASSWORD: "secret"
    volumes:
      - "postgres_data:/var/lib/postgresql/data"
    template: postgres

global_env: .env.platform
```

### Development Environment

```yaml
# Development environment with hot reload
name: dev-environment
description: "Development setup with hot reload"
engine: docker

services:
  - name: web-dev
    directory: ./web
    compose_file: docker-compose.dev.yml
    env_file: .env.development

  - name: api-dev
    directory: ./api
    compose_file: docker-compose.dev.yml
    env_file: .env.development

containers:
  - name: dev-db
    image: postgres:15-alpine
    ports: ["5432:5432"]
    env:
      POSTGRES_DB: "devdb"
      POSTGRES_USER: "dev"
      POSTGRES_PASSWORD: "dev"
    template: postgres

  - name: dev-redis
    image: redis:7-alpine
    ports: ["6379:6379"]
    template: redis

# Development-specific UI settings
ui:
  theme: dark
  refresh_interval: 2000
  show_timestamps: true
  follow_logs: true
  log_buffer_size: 2000

global_env: .env.development
```

## 🚀 Auto-Discovery

Dockronos can automatically discover services in your project:

### Running Auto-Discovery

```bash
# Initialize with auto-discovery
dockronos init --auto-discover

# This scans for:
# - docker-compose.yml files
# - .env files
# - Git repositories
# - Common project structures
```

### What Gets Discovered

1. **Docker Compose Files**:
   - `docker-compose.yml`
   - `docker-compose.yaml`
   - `compose.yml`
   - `compose.yaml`
   - `podman-compose.yml`

2. **Environment Files**:
   - `.env`
   - `.env.local`
   - `.env.development`
   - `.env.production`

3. **Project Directories**:
   - Subdirectories with compose files
   - Git repositories
   - Node.js projects (`package.json`)
   - Python projects (`requirements.txt`)

### Example Auto-Discovery Result

Given this project structure:
```
my-project/
├── frontend/
│   ├── docker-compose.yml
│   └── .env
├── backend/
│   ├── docker-compose.dev.yml
│   └── .env.development
└── database/
    └── docker-compose.yml
```

Auto-discovery generates:
```yaml
name: my-project
engine: auto

services:
  - name: frontend
    directory: ./frontend
    compose_file: docker-compose.yml
    env_file: .env

  - name: backend
    directory: ./backend
    compose_file: docker-compose.dev.yml
    env_file: .env.development

  - name: database
    directory: ./database
    compose_file: docker-compose.yml
```

## 🔄 Environment Management

### Environment File Hierarchy

Dockronos supports multiple levels of environment configuration:

1. **Global environment** (`global_env`)
2. **Service-specific environment** (`env_file`)
3. **Container environment** (`env` in containers)
4. **Runtime overrides** (command line)

### Environment File Examples

#### Global Environment (`.env.global`)
```bash
# Global settings for all services
LOG_LEVEL=info
NODE_ENV=development
DATABASE_HOST=localhost
REDIS_HOST=localhost
```

#### Service Environment (`.env.frontend`)
```bash
# Frontend-specific settings
REACT_APP_API_URL=http://localhost:3001
REACT_APP_TITLE="My Application"
PORT=3000
```

#### Service Environment (`.env.backend`)
```bash
# Backend-specific settings
API_PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp
JWT_SECRET=your-secret-key
```

### Environment Overrides

Use `env_overrides` for different deployment environments:

```yaml
env_overrides:
  development:
    LOG_LEVEL: "debug"
    DATABASE_URL: "postgresql://dev:dev@localhost:5432/myapp_dev"
    REDIS_URL: "redis://localhost:6379"

  staging:
    LOG_LEVEL: "info"
    DATABASE_URL: "postgresql://staging:staging@staging-db:5432/myapp_staging"
    REDIS_URL: "redis://staging-redis:6379"

  production:
    LOG_LEVEL: "warn"
    DATABASE_URL: "postgresql://prod:prod@prod-db:5432/myapp_prod"
    REDIS_URL: "redis://prod-redis:6379"
```

Activate overrides:
```bash
dockronos start --env production
```

## ✅ Configuration Validation

### Validation Rules

Dockronos validates your configuration file and reports errors:

1. **Required fields**: `name`, service `name` and `directory`
2. **Valid engine values**: `auto`, `docker`, `podman`
3. **File existence**: Directories and compose files must exist
4. **Unique names**: Service and container names must be unique
5. **Valid ports**: Port mappings must be valid
6. **Valid restart policies**: Must be valid Docker restart policies

### Example Validation Errors

```yaml
# Invalid configuration examples
name: ""                    # Error: Name cannot be empty
engine: invalid             # Error: Invalid engine value

services:
  - name: web
    # Error: Missing required 'directory' field

  - name: api
    directory: ./nonexistent # Error: Directory does not exist

containers:
  - name: web               # Error: Name conflicts with service
    image: nginx:latest
    ports: ["invalid"]      # Error: Invalid port mapping
```

### Validation Commands

```bash
# Validate configuration
dockronos init --validate

# Check specific config file
dockronos init --config ./custom.yml --validate

# Dry run with validation
dockronos start --dry-run
```

## 🔧 Advanced Configuration

### Custom Configuration Paths

```bash
# Use custom config file
dockronos start --config ./environments/production.yml

# Use config from different directory
dockronos start --config ../shared/dockronos.yml

# Environment variable
export DOCKRONOS_CONFIG=./custom-config.yml
dockronos start
```

### Configuration Templates

Create reusable configuration templates:

#### Basic Web App Template
```yaml
# templates/web-app.yml
name: "${PROJECT_NAME}"
engine: auto

services:
  - name: frontend
    directory: ./client
    compose_file: docker-compose.yml
    env_file: .env.client

  - name: backend
    directory: ./server
    compose_file: docker-compose.yml
    env_file: .env.server

global_env: .env
```

Use with variable substitution:
```bash
export PROJECT_NAME="my-web-app"
dockronos start --config templates/web-app.yml
```

### Configuration Inheritance

Extend base configurations:

```yaml
# base.yml
name: base-project
engine: docker

services:
  - name: common-service
    directory: ./common
    compose_file: docker-compose.yml
```

```yaml
# production.yml (extends base.yml)
extends: ./base.yml

name: production-project

# Add production-specific services
services:
  - name: monitoring
    directory: ./monitoring
    compose_file: docker-compose.prod.yml

containers:
  - name: nginx-proxy
    image: nginx:alpine
    ports: ["80:80", "443:443"]
```

## 🐛 Troubleshooting Configuration

### Common Issues

#### Configuration File Not Found
```bash
# Check current directory
ls -la *.yml

# Use specific path
dockronos start --config ./path/to/dockronos.yml

# Create default config
dockronos init
```

#### Invalid YAML Syntax
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('dockronos.yml'))"

# Or use online YAML validator
# https://yamlchecker.com/
```

#### Service Directory Not Found
```bash
# Check relative paths
ls -la ./frontend/

# Use absolute paths if needed
/absolute/path/to/service
```

#### Docker Compose File Not Found
```bash
# Check compose file exists
ls -la ./frontend/docker-compose.yml

# Use different compose file name
compose_file: docker-compose.dev.yml
```

### Debug Configuration

```bash
# Debug configuration loading
dockronos start --debug --config dockronos.yml

# Validate without starting
dockronos init --validate

# Show effective configuration
dockronos config show
```

## 📚 Best Practices

### 1. Organize by Environment
```
configs/
├── dockronos.dev.yml
├── dockronos.staging.yml
└── dockronos.prod.yml
```

### 2. Use Descriptive Names
```yaml
services:
  - name: user-authentication-api  # Good
    # vs
  - name: api                      # Too generic
```

### 3. Document Your Configuration
```yaml
# dockronos.yml
# Main configuration for MyApp development environment
# Last updated: 2024-01-15
name: myapp-development

# Frontend React application
services:
  - name: frontend
    description: "React frontend with hot reload"
    directory: ./client
```

### 4. Use Environment Files
```yaml
# Don't put secrets directly in config
env:
  API_KEY: "secret123"  # Bad

# Use environment files instead
env_file: .env.secrets  # Good
```

### 5. Version Your Configuration
```yaml
name: myapp
version: "2.1.0"  # Track config version
description: "Updated to include monitoring services"
```

---

*Next: Learn how to use the [CLI Reference](cli-reference.md) or start with the [Getting Started Guide](guides/getting-started.md).*