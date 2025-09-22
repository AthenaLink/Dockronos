# CLI Reference

Complete command-line interface reference for Dockronos. All commands can be run from the terminal to manage containers, repositories, and configuration.

## 📋 Command Overview

```bash
dockronos [command] [options]
```

### Available Commands

| Command | Description |
|---------|-------------|
| `start` | Start the interactive TUI (default) |
| `init` | Initialize Dockronos configuration |
| `list` | List all containers |
| `up` | Start services |
| `down` | Stop services |
| `restart` | Restart services |
| `logs` | Show logs for a service |
| `pull` | Pull and run a container image |
| `templates` | List available container templates |
| `search` | Search for container images |
| `images` | List local container images |
| `git` | Git repository management |
| `help` | Display help for command |

## 🚀 Core Commands

### `dockronos` / `dockronos start`

Start the interactive Terminal User Interface.

```bash
# Start with default configuration
dockronos
dockronos start

# Use custom configuration file
dockronos start --config ./custom.yml
dockronos start -c ./environments/production.yml

# Start in debug mode
dockronos start --debug

# Dry run (validate config without starting)
dockronos start --dry-run
```

**Options:**
- `-c, --config <path>` - Path to configuration file
- `--debug` - Enable debug logging
- `--dry-run` - Validate configuration without starting
- `--no-color` - Disable colored output
- `--log-level <level>` - Set log level (debug, info, warn, error)

**Examples:**
```bash
# Basic usage
dockronos

# Production environment
dockronos start -c ./config/production.yml

# Debug startup issues
dockronos start --debug --log-level debug

# Validate configuration
dockronos start --dry-run
```

### `dockronos init`

Initialize Dockronos configuration in the current directory.

```bash
# Create basic configuration
dockronos init

# Auto-discover services
dockronos init --auto-discover

# Validate existing configuration
dockronos init --validate

# Force overwrite existing config
dockronos init --force
```

**Options:**
- `--auto-discover` - Automatically discover services in subdirectories
- `--validate` - Validate existing configuration file
- `--force` - Overwrite existing configuration file
- `--template <name>` - Use configuration template
- `--output <path>` - Output file path (default: dockronos.yml)

**Examples:**
```bash
# Initialize with auto-discovery
dockronos init --auto-discover

# Create config from template
dockronos init --template web-app

# Validate existing config
dockronos init --validate

# Create config in specific location
dockronos init --output ./config/dockronos.yml
```

## 🐳 Container Management

### `dockronos list`

List all containers with their current status.

```bash
# List all containers
dockronos list

# List only running containers
dockronos list --running

# Show detailed information
dockronos list --verbose

# Output in JSON format
dockronos list --json
```

**Options:**
- `--running` - Show only running containers
- `--stopped` - Show only stopped containers
- `--verbose, -v` - Show detailed container information
- `--json` - Output in JSON format
- `--format <template>` - Custom output format

**Examples:**
```bash
# Basic container list
dockronos list

# Running containers only
dockronos list --running

# Detailed view with ports and volumes
dockronos list --verbose

# JSON output for scripting
dockronos list --json | jq '.[] | select(.status=="running")'
```

### `dockronos up`

Start services defined in your configuration.

```bash
# Start all services
dockronos up

# Start specific services
dockronos up frontend backend

# Start in detached mode
dockronos up --detach

# Start with rebuild
dockronos up --build
```

**Arguments:**
- `[services...]` - Specific services to start (default: all)

**Options:**
- `-d, --detach` - Run in detached mode
- `--build` - Build images before starting
- `--force-recreate` - Force recreate containers
- `--no-deps` - Don't start linked services
- `--directory <path>` - Working directory
- `--timeout <seconds>` - Timeout for operation

**Examples:**
```bash
# Start all services
dockronos up

# Start specific services
dockronos up web-frontend api-backend

# Start with build
dockronos up --build

# Start in specific directory
dockronos up --directory ./microservices
```

### `dockronos down`

Stop services and remove containers.

```bash
# Stop all services
dockronos down

# Stop specific services
dockronos down frontend backend

# Stop and remove volumes
dockronos down --volumes

# Stop and remove everything
dockronos down --remove-orphans
```

**Arguments:**
- `[services...]` - Specific services to stop (default: all)

**Options:**
- `-v, --volumes` - Remove named volumes
- `--remove-orphans` - Remove containers for services not defined
- `--timeout <seconds>` - Timeout for stop operation
- `--directory <path>` - Working directory

**Examples:**
```bash
# Stop all services
dockronos down

# Stop specific services
dockronos down database cache

# Stop and clean up volumes
dockronos down --volumes

# Complete cleanup
dockronos down --volumes --remove-orphans
```

### `dockronos restart`

Restart running services.

```bash
# Restart all services
dockronos restart

# Restart specific services
dockronos restart frontend backend

# Restart with timeout
dockronos restart --timeout 30
```

**Arguments:**
- `[services...]` - Specific services to restart (default: all)

**Options:**
- `--timeout <seconds>` - Timeout for restart operation
- `--directory <path>` - Working directory
- `--no-deps` - Don't restart linked services

**Examples:**
```bash
# Restart all services
dockronos restart

# Restart web services
dockronos restart frontend backend

# Quick restart with short timeout
dockronos restart --timeout 10
```

### `dockronos logs`

Show logs for a specific service.

```bash
# Show logs for a service
dockronos logs frontend

# Follow logs in real-time
dockronos logs frontend --follow

# Show last 100 lines
dockronos logs frontend --tail 100

# Show logs with timestamps
dockronos logs frontend --timestamps
```

**Arguments:**
- `<service>` - Service name (required)

**Options:**
- `-f, --follow` - Follow log output
- `--tail <lines>` - Number of lines to show from end
- `--timestamps` - Show timestamps
- `--since <time>` - Show logs since timestamp
- `--until <time>` - Show logs until timestamp
- `--directory <path>` - Working directory

**Examples:**
```bash
# Basic log viewing
dockronos logs api-server

# Follow logs with timestamps
dockronos logs api-server --follow --timestamps

# Show last 50 lines
dockronos logs frontend --tail 50

# Show logs from last hour
dockronos logs database --since 1h
```

## 📦 Container Registry

### `dockronos pull`

Pull and run container images from registries.

```bash
# Pull and run a template
dockronos pull redis

# Pull specific image version
dockronos pull redis --tag 7-alpine

# Pull with custom configuration
dockronos pull nginx --port 8080:80 --env API_URL=http://localhost:3000

# Pull without starting
dockronos pull postgres --no-start
```

**Arguments:**
- `<image>` - Container image name or template name (required)

**Options:**
- `-n, --name <name>` - Container name
- `-p, --port <ports...>` - Port mappings (e.g., 3000:3000)
- `-e, --env <vars...>` - Environment variables (e.g., KEY=value)
- `-v, --volume <volumes...>` - Volume mounts (e.g., ./data:/data)
- `--tag <tag>` - Image tag (default: latest)
- `--no-start` - Pull image but don't start container
- `--restart <policy>` - Restart policy (default: unless-stopped)

**Examples:**
```bash
# Pull Redis template
dockronos pull redis

# Pull with custom name and environment
dockronos pull postgres -n my-db -e POSTGRES_PASSWORD=secret

# Pull nginx with port mapping
dockronos pull nginx -p 8080:80 -p 8443:443

# Pull specific version
dockronos pull node --tag 18-alpine

# Pull without starting
dockronos pull mongodb --no-start
```

### `dockronos templates`

List available container templates.

```bash
# List all templates
dockronos templates

# Search templates
dockronos templates --search postgres

# Group by category
dockronos templates --category

# Show template details
dockronos templates --verbose
```

**Options:**
- `-s, --search <query>` - Search templates by name or description
- `-c, --category` - Group templates by category
- `-v, --verbose` - Show detailed template information
- `--json` - Output in JSON format

**Examples:**
```bash
# List all available templates
dockronos templates

# Search for database templates
dockronos templates --search database

# Show templates grouped by category
dockronos templates --category

# Detailed template information
dockronos templates --verbose
```

### `dockronos search`

Search for container images in registries.

```bash
# Search for images
dockronos search postgres

# Limit results
dockronos search node --limit 5

# Show official images only
dockronos search redis --official

# JSON output
dockronos search nginx --json
```

**Arguments:**
- `<query>` - Search query (required)

**Options:**
- `-l, --limit <number>` - Limit number of results (default: 10)
- `--official` - Show only official images
- `--automated` - Show only automated builds
- `--json` - Output in JSON format
- `--registry <registry>` - Search specific registry

**Examples:**
```bash
# Basic search
dockronos search python

# Limited results
dockronos search node --limit 5

# Official images only
dockronos search ubuntu --official

# Search specific registry
dockronos search grafana --registry quay.io
```

### `dockronos images`

List local container images.

```bash
# List all local images
dockronos images

# Show image details
dockronos images --verbose

# Filter by repository
dockronos images --filter repository=nginx

# JSON output
dockronos images --json
```

**Options:**
- `-v, --verbose` - Show detailed image information
- `--filter <filter>` - Filter images (repository=name, tag=tag)
- `--json` - Output in JSON format
- `--sort <field>` - Sort by field (name, tag, size, created)

**Examples:**
```bash
# List all images
dockronos images

# Show detailed information
dockronos images --verbose

# Filter nginx images
dockronos images --filter repository=nginx

# Sort by size
dockronos images --sort size
```

## 🔄 Git Management

### `dockronos git clone`

Clone git repositories to the projects directory.

```bash
# Clone repository
dockronos git clone https://github.com/user/repo.git

# Clone to specific directory
dockronos git clone https://github.com/user/repo.git my-service

# Clone specific branch
dockronos git clone https://github.com/user/repo.git --branch develop

# Shallow clone
dockronos git clone https://github.com/user/repo.git --depth 1
```

**Arguments:**
- `<url>` - Git repository URL (required)
- `[directory]` - Target directory name (optional)

**Options:**
- `-b, --branch <branch>` - Branch to clone
- `--depth <depth>` - Clone depth for shallow clone
- `--recursive` - Clone submodules recursively
- `--projects-dir <path>` - Projects directory override

**Examples:**
```bash
# Basic clone
dockronos git clone https://github.com/company/microservice.git

# Clone specific branch
dockronos git clone https://github.com/company/api.git --branch feature/v2

# Shallow clone for faster download
dockronos git clone https://github.com/company/frontend.git --depth 1

# Clone with submodules
dockronos git clone https://github.com/company/platform.git --recursive
```

### `dockronos git refresh`

Update git repositories.

```bash
# Update all repositories
dockronos git refresh

# Update specific repository
dockronos git refresh my-service

# Force update (reset to remote)
dockronos git refresh --force

# Update with rebase
dockronos git refresh --rebase
```

**Arguments:**
- `[repository]` - Specific repository to update (optional)

**Options:**
- `--force` - Reset local changes and force update
- `--rebase` - Use rebase instead of merge
- `--all` - Update all repositories (default)
- `--prune` - Prune remote branches

**Examples:**
```bash
# Update all repositories
dockronos git refresh

# Update specific repository
dockronos git refresh user-service

# Force update ignoring local changes
dockronos git refresh --force

# Update with rebase strategy
dockronos git refresh --rebase
```

### `dockronos git status`

Show status of git repositories.

```bash
# Show status of all repositories
dockronos git status

# Show detailed status
dockronos git status --verbose

# Show only modified repositories
dockronos git status --modified

# JSON output
dockronos git status --json
```

**Options:**
- `-v, --verbose` - Show detailed status information
- `--modified` - Show only repositories with changes
- `--json` - Output in JSON format
- `--short` - Show compact status

**Examples:**
```bash
# Basic status
dockronos git status

# Detailed status with file changes
dockronos git status --verbose

# Only repositories with changes
dockronos git status --modified

# JSON output for scripting
dockronos git status --json
```

### `dockronos git remove`

Remove a git repository.

```bash
# Remove repository
dockronos git remove my-service

# Force remove with uncommitted changes
dockronos git remove my-service --force

# Remove multiple repositories
dockronos git remove service-a service-b
```

**Arguments:**
- `<repository>` - Repository directory to remove (required)

**Options:**
- `--force` - Force removal even with uncommitted changes
- `--backup` - Create backup before removal
- `--dry-run` - Show what would be removed

**Examples:**
```bash
# Remove repository
dockronos git remove old-service

# Force remove with local changes
dockronos git remove broken-service --force

# Dry run to see what would be removed
dockronos git remove test-service --dry-run
```

## 🔧 Utility Commands

### `dockronos help`

Display help information.

```bash
# General help
dockronos help

# Help for specific command
dockronos help start
dockronos help git clone

# List all commands
dockronos help --list
```

**Arguments:**
- `[command]` - Command to get help for (optional)

**Options:**
- `--list` - List all available commands
- `--verbose` - Show detailed help

### Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `-V, --version` | Output the version number |
| `-h, --help` | Display help for command |
| `--config <path>` | Path to configuration file |
| `--no-color` | Disable colored output |
| `--verbose` | Enable verbose logging |
| `--quiet` | Suppress non-error output |

## 🔄 Exit Codes

Dockronos uses standard exit codes:

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Configuration error |
| `4` | Container engine error |
| `5` | Git operation error |
| `126` | Command not executable |
| `127` | Command not found |
| `130` | Script terminated by Control-C |

## 📝 Examples

### Common Workflows

#### Initial Project Setup
```bash
# Initialize configuration with auto-discovery
dockronos init --auto-discover

# Start the interactive interface
dockronos start

# Or use specific configuration
dockronos start -c ./config/development.yml
```

#### Daily Development
```bash
# Start all services
dockronos up

# Check logs for a specific service
dockronos logs api-server --follow

# Restart a service after changes
dockronos restart frontend

# Stop all services
dockronos down
```

#### Working with Repositories
```bash
# Clone a new service
dockronos git clone https://github.com/company/new-service.git

# Update all repositories
dockronos git refresh

# Check repository status
dockronos git status
```

#### Container Management
```bash
# List running containers
dockronos list --running

# Pull and run a database
dockronos pull postgres -e POSTGRES_PASSWORD=secret

# Search for images
dockronos search redis --limit 5

# View available templates
dockronos templates --category
```

### Advanced Usage

#### Custom Configuration Environments
```bash
# Development environment
dockronos start -c ./config/dev.yml

# Staging environment
dockronos start -c ./config/staging.yml

# Production environment
dockronos start -c ./config/prod.yml
```

#### Automated Scripts
```bash
#!/bin/bash
# deployment script

# Validate configuration
if ! dockronos init --validate; then
    echo "Configuration validation failed"
    exit 1
fi

# Update repositories
dockronos git refresh --force

# Start services
dockronos up --build

# Wait for services to be ready
sleep 30

# Check status
dockronos list --running --json | jq '.[] | select(.status=="running") | .name'
```

#### CI/CD Integration
```bash
# In CI/CD pipeline
export DOCKRONOS_CONFIG=./ci/dockronos.yml

# Validate configuration
dockronos init --validate

# Start services for testing
dockronos up --detach

# Run tests
npm test

# Cleanup
dockronos down --volumes
```

## 🐛 Troubleshooting Commands

### Debug Issues
```bash
# Enable debug logging
dockronos start --debug --log-level debug

# Validate configuration
dockronos init --validate

# Check container engine
docker --version
podman --version

# Test container operations
dockronos list
```

### Common Error Solutions
```bash
# Configuration not found
dockronos init  # Create default config
dockronos start -c ./path/to/config.yml

# Container engine not found
which docker
which podman

# Permission denied
sudo usermod -aG docker $USER  # Linux Docker
newgrp docker

# Port already in use
dockronos down  # Stop conflicting services
netstat -tulpn | grep :8080  # Check what's using port
```

---

*For more examples and detailed usage, see the [Getting Started Guide](guides/getting-started.md) and [Advanced Usage](guides/advanced-usage.md).*