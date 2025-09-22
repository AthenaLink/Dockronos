# Dockronos

> An interactive Terminal User Interface (TUI) for container management in development environments

![DOCKRONOS IMAGE BANNER](/assets/dockronos-banner.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Overview

**Dockronos** is a powerful Terminal User Interface (TUI) application that provides developers with an intuitive way to manage Docker and Podman containers in development environments. Built with Node.js and TypeScript, it offers real-time monitoring, log streaming, git repository management, and environment configuration through a modern terminal interface.

Perfect for developers who prefer working in the terminal and need efficient container management without leaving their command-line workflow.

## ✨ Key Features

### 🐳 **Multi-Engine Container Support**
- **Docker & Podman** - Automatic detection and seamless switching
- **Cross-platform** - Works on Linux, macOS, and Windows
- **Real-time monitoring** - Live container status and metrics

### 📊 **Interactive Terminal Interface**
- **Three-panel layout** - Services, Metrics, and Logs
- **Keyboard navigation** - Efficient hotkey-based controls
- **Real-time updates** - Live refresh of container status
- **Responsive design** - Adapts to terminal size

### 🔧 **Advanced Management Features**
- **Git integration** - Clone and manage git repositories with auto-discovery
- **Template system** - Pre-configured containers (Redis, PostgreSQL, MongoDB, MySQL, Nginx)
- **Container registry** - Pull and run public containers from Docker Hub, GHCR, Quay
- **Environment editing** - Built-in .env file management
- **Configuration management** - YAML-based project configuration

### 🚀 **Developer Experience**
- **CLI interface** - Full command-line interface for automation
- **Auto-discovery** - Automatically detect docker-compose projects
- **Cross-platform binaries** - Standalone executables, no Node.js required
- **Hot reload** - Development mode with live code reloading

## 🏗️ Architecture & Technology Stack

### **Core Technologies**
- **Runtime**: Node.js 18+ with ES Modules
- **Language**: TypeScript 5.3+ with strict mode
- **TUI Framework**: blessed + blessed-contrib for terminal UI
- **Package Manager**: pnpm for fast, efficient dependency management
- **Build System**: TypeScript Compiler + PKG for binary packaging

### **Key Libraries**
- **blessed** - Terminal UI framework for interactive interfaces
- **blessed-contrib** - Additional UI components (graphs, tables)
- **systeminformation** - System and container metrics collection
- **chalk** - Terminal string styling and colors
- **commander** - CLI argument parsing and command structure
- **yaml** - Configuration file parsing and generation
- **chokidar** - File system watching for hot reload

### **Architecture Principles**
- **Modular design** - Clean separation of concerns
- **TypeScript-first** - Strong typing throughout the codebase
- **Event-driven** - Reactive UI updates and async operations
- **Cross-platform** - Abstracted container engine interface
- **Extensible** - Plugin-ready architecture for future enhancements

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (for development)
- **Docker** or **Podman** installed and accessible
- **Terminal with color support** (recommended)
- **Git** (for repository management features)

### Installation Options

#### Option 1: Pre-built Binaries (Recommended)

```bash
# Download from releases page
wget https://github.com/athenalink/dockronos/releases/latest/download/dockronos-linux
chmod +x dockronos-linux
./dockronos-linux
```

#### Option 2: Development Setup

```bash
# Clone the repository
git clone https://github.com/athenalink/dockronos.git
cd dockronos

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode with hot reload
pnpm dev

# Or run the built version
pnpm start
```

#### Option 3: Global Installation (NPM)

```bash
# Install globally (coming soon)
npm install -g dockronos

# Run from anywhere
dockronos
```

## 🎮 Usage Guide

### Interactive TUI Mode (Default)

```bash
# Start the interactive interface
dockronos

# With custom configuration
dockronos start -c ./my-config.yml

# Initialize project with auto-discovery
dockronos init --auto-discover
```

### Command Line Interface

```bash
# Container management
dockronos list                    # List all containers
dockronos up [services...]        # Start services
dockronos down [services...]      # Stop services
dockronos restart [services...]   # Restart services
dockronos logs <service> [-f]     # View logs

# Container registry operations
dockronos pull redis                      # Pull and run Redis template
dockronos pull nginx -p 8080:80          # Pull nginx with custom port
dockronos search postgres                # Search for PostgreSQL images
dockronos templates                       # List available templates
dockronos images                         # List local images

# Git repository management
dockronos git clone <url> [directory]    # Clone repository
dockronos git refresh [repository]       # Update repositories
dockronos git status                     # Show repository status
dockronos git remove <repository>        # Remove repository
```

## ⌨️ Keyboard Shortcuts Reference

### Global Navigation
| Key | Action |
|-----|--------|
| `Tab` | Cycle through panels (Services → Metrics → Logs) |
| `1` / `2` / `3` | Jump to Services/Metrics/Logs panel |
| `?` | Show/hide help overlay |
| `F5` or `R` | Refresh all data |
| `Q` or `Ctrl+C` | Quit application |
| `Escape` | Return to Services panel |

### Services Panel
| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate service list |
| `Enter` | Select service |
| `S` | Start selected service |
| `X` | Stop selected service |
| `R` | Restart selected service |
| `D` | Show logs for service |
| `E` | Edit environment files |

### Logs Panel
| Key | Action |
|-----|--------|
| `F` | Toggle follow mode |
| `C` | Clear logs |
| `Page Up` / `Page Down` | Scroll logs |
| `Home` / `End` | Jump to beginning/end |
| `T` | Toggle timestamps |

### Metrics Panel
| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate metrics |
| `Enter` | Expand metric details |
| `G` | Toggle graph view |

## 📁 Project Structure

```
dockronos/
├── src/                          # Source code
│   ├── config/                   # Configuration management
│   │   └── index.ts             # YAML config loading and validation
│   ├── engine/                   # Container engine abstraction
│   │   └── index.ts             # Docker/Podman interface
│   ├── env-editor/               # Environment file management
│   │   └── index.ts             # .env file editing capabilities
│   ├── git/                      # Git repository management
│   │   └── index.ts             # Git operations and auto-discovery
│   ├── metrics/                  # System monitoring
│   │   └── index.ts             # Metrics collection and aggregation
│   ├── registry/                 # Container registry integration
│   │   └── index.ts             # Docker Hub, GHCR, Quay support
│   ├── templates/                # Container templates
│   │   ├── index.ts             # Template management system
│   │   └── definitions/         # Pre-built templates
│   │       ├── redis.ts         # Redis template
│   │       ├── postgres.ts      # PostgreSQL template
│   │       ├── mongo.ts         # MongoDB template
│   │       ├── mysql.ts         # MySQL template
│   │       └── nginx.ts         # Nginx template
│   ├── types/                    # TypeScript definitions
│   │   ├── index.ts             # Core types
│   │   ├── git.ts               # Git-related types
│   │   ├── registry.ts          # Registry and template types
│   │   └── blessed.d.ts         # Blessed framework types
│   ├── ui/                       # Terminal user interface
│   │   ├── index.ts             # Main UI controller
│   │   └── components/          # UI components
│   │       ├── services-table.ts # Services management panel
│   │       ├── metrics-panel.ts  # System metrics display
│   │       └── logs-panel.ts     # Log streaming panel
│   ├── utils/                    # Shared utilities
│   └── index.ts                  # Application entry point
├── build/                        # Build scripts and tools
│   └── pkg-build.cjs            # PKG binary build script
├── dist/                         # Compiled JavaScript (ESM)
├── dist-pkg/                     # Compiled JavaScript (CommonJS for PKG)
├── pkg/                          # Generated binaries
├── docs/                         # Documentation (see docs/index.md)
├── test/                         # Test files
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript config (development)
├── tsconfig.pkg.json            # TypeScript config (PKG packaging)
└── dockronos.yml.example        # Example configuration file
```

## 🔧 Configuration

Dockronos uses YAML configuration files for project setup. Create a `dockronos.yml` file in your project root:

```yaml
# dockronos.yml
name: my-awesome-project
engine: auto  # auto, docker, or podman

# Optional: Git repository management
projects_directory: "./projects"
repositories:
  - url: "https://github.com/user/microservice-a.git"
    directory: "microservice-a"
    branch: "develop"
  - url: "https://github.com/user/microservice-b.git"
    directory: "microservice-b"

# Service definitions
services:
  - name: web-app
    directory: ./web
    compose_file: docker-compose.yml
    env_file: .env

  - name: api-server
    directory: ./api
    compose_file: docker-compose.dev.yml
    env_file: .env.development

  - name: database
    directory: ./db
    compose_file: docker-compose.db.yml

# Optional: Container definitions (alternative to docker-compose)
containers:
  - name: redis-cache
    image: redis:7-alpine
    ports: ["6379:6379"]
    env:
      REDIS_PASSWORD: "secret"
    template: redis

# Global environment file
global_env: .env.global
```

### Auto-Discovery

Dockronos can automatically discover services in your project:

```bash
# Initialize with auto-discovery
dockronos init --auto-discover

# This will scan for:
# - docker-compose.yml files
# - .env files
# - Common project structures
# - Git repositories
```

## 🏗️ Development Workflow

### Setting Up Development Environment

```bash
# Clone and setup
git clone https://github.com/athenalink/dockronos.git
cd dockronos

# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Run tests
pnpm test

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

### Building and Packaging

```bash
# Development build
pnpm build

# Type checking
pnpm typecheck

# Linting and formatting
pnpm lint
pnpm lint:fix
pnpm format

# Cross-platform binary packaging
pnpm pkg:build        # Prepare for packaging
pnpm pkg:linux        # Build Linux binary
pnpm pkg:macos        # Build macOS binary
pnpm pkg:windows      # Build Windows binary
pnpm pkg:all          # Build all platforms
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test suites
pnpm test -- --testNamePattern="ContainerEngine"
```

### Code Quality

The project uses strict TypeScript, ESLint, and Prettier for code quality:

```bash
# Type checking (strict mode)
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format
```

## 🧪 Testing Strategy

### Test Structure
- **Unit tests** - Individual component testing
- **Integration tests** - Component interaction testing
- **E2E tests** - Full application workflow testing
- **Mock containers** - Demo mode for development

### Running Tests
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific test pattern
pnpm test -- --testNamePattern="GitManager"
```

## 📦 Binary Distribution

Dockronos provides standalone binaries that don't require Node.js installation:

### Building Binaries

```bash
# Build optimized binaries for all platforms
pnpm pkg:all

# Individual platforms
pnpm pkg:linux    # → pkg/dockronos-linux
pnpm pkg:macos    # → pkg/dockronos-macos
pnpm pkg:windows  # → pkg/dockronos-windows.exe
```

### Binary Features
- **Self-contained** - No external dependencies
- **Fast startup** - Optimized for quick execution
- **Cross-platform** - Linux, macOS, Windows support
- **Full feature parity** - Same functionality as Node.js version

## 🛠️ Contributing

We welcome contributions! Please see our [Contributing Guide](docs/development/contributing.md) for details.

### Development Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Develop** your changes following our coding standards
4. **Test** your changes: `pnpm test`
5. **Lint** your code: `pnpm lint`
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to your branch: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Coding Standards

- **TypeScript** with strict mode enabled
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing
- **Conventional commits** for commit messages
- **JSDoc** comments for public APIs

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Linux, macOS, or Windows
- **Architecture**: x64 (ARM64 support planned)
- **Container Engine**: Docker 20.0+ or Podman 3.0+
- **Memory**: 50MB+ available RAM
- **Terminal**: Color support recommended

### Recommended Setup
- **Modern terminal** (iTerm2, Windows Terminal, Alacritty)
- **Git** for repository management features
- **Docker Desktop** or **Podman Desktop** for GUI fallback
- **Node.js 18+** for development

## 🐛 Troubleshooting

### Common Issues

**"Neither Docker nor Podman found"**
```bash
# Verify installation
docker --version
podman --version

# Check PATH
echo $PATH

# Linux: Add user to docker group
sudo usermod -aG docker $USER
```

**"Permission denied" errors**
```bash
# Linux: Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# macOS: Start Docker Desktop
open /Applications/Docker.app
```

**Terminal display issues**
```bash
# Check terminal capabilities
echo $TERM
tput colors

# Try different TERM values
export TERM=xterm-256color
```

**Configuration not found**
```bash
# Initialize configuration
dockronos init --auto-discover

# Check current directory
ls -la dockronos.yml

# Use custom config path
dockronos start -c /path/to/config.yml
```

For more troubleshooting help, see [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md).

## 📚 Documentation

- **[Getting Started Guide](docs/guides/getting-started.md)** - Step-by-step tutorial
- **[CLI Reference](docs/cli-reference.md)** - Complete command documentation
- **[Configuration Guide](docs/configuration.md)** - Configuration options and examples
- **[Development Guide](docs/development/)** - Contributing and extending Dockronos
- **[API Documentation](docs/api/)** - Internal APIs and extension points

## 🗺️ Roadmap

### Current Version (v2.0)
- ✅ Multi-engine container support (Docker/Podman)
- ✅ Interactive TUI with real-time updates
- ✅ Git repository management
- ✅ Container templates and registry integration
- ✅ Cross-platform binary packaging
- ✅ Environment file editing

### Planned Features (v2.1+)
- 🔄 **Enhanced service view** - Tabbed interface with detailed service information
- 🔄 **Advanced environment editor** - Visual .env file editing with validation
- 🔄 **Resource monitoring graphs** - CPU, memory, and network visualization
- 🔄 **Log enhancements** - Timestamp toggle, filtering, and search
- ⏳ **Plugin system** - Extensible architecture for custom functionality
- ⏳ **Kubernetes support** - kubectl integration for K8s environments
- ⏳ **Remote connections** - Manage containers on remote hosts
- ⏳ **Configuration templates** - Project templates for common setups

### Future Vision (v3.0+)
- **Web interface** - Optional web UI for team collaboration
- **Container orchestration** - Advanced multi-container workflows
- **CI/CD integration** - GitHub Actions, GitLab CI support
- **Performance profiling** - Advanced container performance analysis
- **Security scanning** - Built-in vulnerability scanning

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Dockronos is built on the shoulders of giants. Special thanks to:

- **[blessed](https://github.com/chjj/blessed)** - Excellent terminal UI framework
- **[blessed-contrib](https://github.com/yaronn/blessed-contrib)** - Additional UI components
- **[systeminformation](https://github.com/sebhildebrandt/systeminformation)** - Comprehensive system metrics
- **[chalk](https://github.com/chalk/chalk)** - Terminal string styling
- **[commander](https://github.com/tj/commander.js)** - CLI framework
- **Docker** and **Podman** teams for container platforms
- **Node.js** and **TypeScript** communities
- All contributors and users who make this project possible

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=athenalink/dockronos&type=Date)](https://star-history.com/#athenalink/dockronos&Date)

---

<div align="center">

**Made with ❤️ for developers who live in the terminal**

[Website](https://dockronos.dev) • [Documentation](docs/) • [Issues](https://github.com/athenalink/dockronos/issues) • [Discussions](https://github.com/athenalink/dockronos/discussions)

</div>