# Cronos v2

An interactive console application for container management on development environment.

## 🎯 Overview

Cronos is a powerful Terminal User Interface (TUI) application built with Node.js that provides developers with an intuitive way to manage Docker and Podman containers in development environments. It offers real-time monitoring, log streaming, and environment management capabilities through a modern terminal interface.

## ✨ Features

- **🐳 Multi-Engine Support**: Works with both Docker and Podman with automatic detection
- **📊 Real-time Metrics**: Live CPU and memory monitoring for system and containers
- **📋 Interactive Services Table**: Easy-to-navigate container status and management
- **📝 Live Log Streaming**: Real-time log viewing with scroll and follow modes
- **🔧 Environment Management**: Built-in .env file editor for quick configuration changes
- **⌨️ Keyboard Shortcuts**: Efficient navigation and control with hotkeys
- **🎨 Modern TUI**: Beautiful terminal interface built with blessed
- **📦 Cross-platform Binaries**: Standalone executables for Linux, macOS, and Windows

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for development)
- Docker or Podman installed and accessible
- Terminal with color support

### Installation & Usage

#### Option 1: Using Pre-built Binaries

1. Download the appropriate binary for your platform from the releases
2. Make it executable (Linux/macOS): `chmod +x cronos`
3. Run: `./cronos`

#### Option 2: Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd cronos-v2

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev

# Or run the built version
pnpm start
```

## 🎮 Usage

### Interactive TUI Mode (Default)

```bash
# Start the interactive interface
cronos
# or
cronos start
```

### Command Line Interface

```bash
# Initialize configuration with auto-discovery
cronos init --auto-discover

# List all containers
cronos list

# Start services
cronos up [service1] [service2]

# Stop services
cronos down [service1] [service2]

# Restart services
cronos restart [service1] [service2]

# View logs
cronos logs <service> [-f]
```

## ⌨️ Keyboard Shortcuts

### Global Navigation
- `Tab` - Cycle through panels (Services → Metrics → Logs)
- `1/2/3` - Jump directly to Services/Metrics/Logs panel
- `?` - Show/hide help
- `F5` or `R` - Refresh data
- `Q` or `Ctrl+C` - Quit application
- `Escape` - Return to Services panel

### Services Panel
- `S` - Start selected service
- `X` - Stop selected service
- `R` - Restart selected service
- `D` - Show logs for selected service
- `E` - Edit environment files (coming soon)
- `↑/↓` - Navigate service list
- `Enter` - Select service

### Logs Panel
- `F` - Toggle follow mode
- `C` - Clear logs
- `Page Up/Down` - Scroll through logs
- `Home/End` - Jump to beginning/end

## 📁 Project Structure

```
cronos-v2/
├── src/
│   ├── config/          # Configuration management
│   ├── engine/          # Docker/Podman abstraction
│   ├── env-editor/      # Environment file management
│   ├── metrics/         # System and container metrics
│   ├── types/           # TypeScript type definitions
│   ├── ui/              # Terminal user interface
│   │   ├── components/  # UI components
│   │   └── utils/       # UI utilities
│   ├── utils/           # Common utilities
│   └── index.ts         # Main entry point
├── build/               # Build scripts
├── dist/                # Compiled JavaScript
├── pkg/                 # Packaged binaries
└── test/                # Test files
```

## 🔧 Configuration

Cronos supports configuration files in YAML format. Place a `cronos.yml` file in your project root:

```yaml
name: my-project
engine: auto  # auto, docker, or podman
services:
  - name: web-app
    directory: ./web
    compose_file: docker-compose.yml
    env_file: .env
  - name: api-server
    directory: ./api
    compose_file: docker-compose.dev.yml
    env_file: .env.development
global_env: .env.global
```

### Auto-Discovery

Run `cronos init --auto-discover` to automatically detect services in your project directory. Cronos will look for:
- `docker-compose.yml` files
- `.env` files
- Common project structures

## 🏗️ Building

### Development Build

```bash
pnpm build
```

### Cross-platform Binaries

```bash
# Build all platforms
pnpm pkg:all

# Or build specific platforms
pnpm pkg:linux
pnpm pkg:macos
pnpm pkg:windows
```

### Custom Build Script

```bash
# Use the comprehensive build script
node build/build.js
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix
```

## 🛠️ Development

### Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **TUI Framework**: neo-blessed + blessed-contrib
- **Package Manager**: pnpm
- **Build Tool**: TypeScript Compiler + pkg
- **Testing**: Jest
- **Linting**: ESLint + Prettier

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📋 System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Architecture**: x64
- **Container Engine**: Docker 20.0+ or Podman 3.0+
- **Memory**: 50MB+ available RAM
- **Terminal**: Color support recommended

## 🐛 Troubleshooting

### Common Issues

**"Neither Docker nor Podman found on system"**
- Ensure Docker or Podman is installed and accessible in your PATH
- Try running `docker --version` or `podman --version` manually

**"Permission denied" errors**
- Make sure your user has permission to access Docker/Podman
- On Linux, you might need to add your user to the `docker` group

**Terminal display issues**
- Ensure your terminal supports colors and UTF-8
- Try resizing the terminal window
- Use a modern terminal emulator

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [blessed](https://github.com/chjj/blessed) for the excellent TUI framework
- [systeminformation](https://github.com/sebhildebrandt/systeminformation) for system metrics
- Docker and Podman teams for the container platforms
- The Node.js community for the amazing ecosystem

---

Made with ❤️ for developers who love working in the terminal.