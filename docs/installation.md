# Installation Guide

This guide covers all available methods to install and run Dockronos on your system.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Linux, macOS, or Windows 10+
- **Architecture**: x64 (ARM64 support planned)
- **Container Engine**: Docker 20.0+ or Podman 3.0+
- **Memory**: 50MB+ available RAM
- **Terminal**: Any modern terminal with color support

### Recommended Setup
- **Modern terminal emulator**:
  - **Linux**: GNOME Terminal, Konsole, Alacritty
  - **macOS**: iTerm2, Terminal.app, Alacritty
  - **Windows**: Windows Terminal, PowerShell, Git Bash
- **Git** for repository management features
- **Node.js 18+** for development and building from source

## 🚀 Installation Methods

### Method 1: Pre-built Binaries (Recommended)

Pre-built binaries are self-contained executables that don't require Node.js installation.

#### Linux
```bash
# Download the latest release
curl -L -o dockronos https://github.com/your-org/dockronos/releases/latest/download/dockronos-linux

# Make it executable
chmod +x dockronos

# Move to PATH (optional)
sudo mv dockronos /usr/local/bin/

# Run
dockronos
```

#### macOS
```bash
# Download the latest release
curl -L -o dockronos https://github.com/your-org/dockronos/releases/latest/download/dockronos-macos

# Make it executable
chmod +x dockronos

# Move to PATH (optional)
sudo mv dockronos /usr/local/bin/

# Run
dockronos
```

#### Windows
```powershell
# Download using PowerShell
Invoke-WebRequest -Uri "https://github.com/your-org/dockronos/releases/latest/download/dockronos-windows.exe" -OutFile "dockronos.exe"

# Add to PATH (optional)
# Move dockronos.exe to a directory in your PATH

# Run
./dockronos.exe
```

### Method 2: Package Managers

#### Homebrew (macOS/Linux)
```bash
# Add our tap (coming soon)
brew tap your-org/dockronos
brew install dockronos

# Run
dockronos
```

#### Scoop (Windows)
```powershell
# Add bucket (coming soon)
scoop bucket add dockronos https://github.com/your-org/scoop-dockronos
scoop install dockronos

# Run
dockronos
```

#### NPM (Node.js required)
```bash
# Install globally (coming soon)
npm install -g dockronos

# Run from anywhere
dockronos
```

### Method 3: Build from Source

This method requires Node.js 18+ and is ideal for development or customization.

#### Prerequisites
```bash
# Install Node.js 18+ and pnpm
node --version  # Should be 18.0.0 or higher
npm install -g pnpm
```

#### Build Steps
```bash
# Clone the repository
git clone https://github.com/your-org/dockronos.git
cd dockronos

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run directly
pnpm start

# Or create a binary
pnpm pkg:build
pnpm pkg:macos  # or pkg:linux, pkg:windows
```

### Method 4: Docker (Experimental)

Run Dockronos itself in a container:

```bash
# Run with Docker
docker run -it --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd):/workspace \
  your-org/dockronos:latest

# Run with Podman
podman run -it --rm \
  -v /run/user/$(id -u)/podman/podman.sock:/var/run/docker.sock \
  -v $(pwd):/workspace \
  your-org/dockronos:latest
```

## 🔧 Container Engine Setup

Dockronos requires either Docker or Podman to be installed and accessible.

### Docker Installation

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io

# Add user to docker group
sudo usermod -aG docker $USER

# Restart session or run
newgrp docker

# Verify installation
docker --version
docker run hello-world
```

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from https://docs.docker.com/desktop/mac/install/

# Start Docker Desktop from Applications
# Verify installation
docker --version
```

#### Windows
1. Download Docker Desktop from [docker.com](https://docs.docker.com/desktop/windows/install/)
2. Install and follow the setup wizard
3. Enable WSL 2 backend if prompted
4. Restart your computer
5. Verify installation in PowerShell: `docker --version`

### Podman Installation

#### Linux (Fedora/RHEL/CentOS)
```bash
# Install Podman
sudo dnf install podman

# Verify installation
podman --version
podman run hello-world
```

#### Linux (Ubuntu/Debian)
```bash
# Add repository
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y ppa:projectatomic/ppa

# Install Podman
sudo apt-get update
sudo apt-get install podman

# Verify installation
podman --version
```

#### macOS
```bash
# Install Podman
brew install podman

# Initialize and start
podman machine init
podman machine start

# Verify installation
podman --version
```

#### Windows
```powershell
# Install via Chocolatey
choco install podman

# Or install via Scoop
scoop install podman

# Verify installation
podman --version
```

## ✅ Verification

After installation, verify that Dockronos is working correctly:

### 1. Check Installation
```bash
# Check version
dockronos --version

# Check help
dockronos --help
```

### 2. Verify Container Engine
```bash
# Test Docker
docker --version
docker ps

# Or test Podman
podman --version
podman ps
```

### 3. Run Basic Commands
```bash
# List containers
dockronos list

# Initialize configuration
dockronos init

# Start interactive mode
dockronos start
```

### 4. Test Interactive Mode
```bash
# Launch TUI (press 'q' to quit)
dockronos

# Should show:
# - Services panel (left)
# - Metrics panel (right)
# - Logs panel (bottom)
# - Status bar with detected engine
```

## 🔄 Updating Dockronos

### Binary Installation
```bash
# Download latest version
curl -L -o dockronos-new https://github.com/your-org/dockronos/releases/latest/download/dockronos-linux

# Replace existing binary
chmod +x dockronos-new
mv dockronos-new /usr/local/bin/dockronos

# Verify update
dockronos --version
```

### Package Manager Updates
```bash
# Homebrew
brew upgrade dockronos

# NPM
npm update -g dockronos

# Scoop
scoop update dockronos
```

### Source Build Updates
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

## 🗑️ Uninstalling

### Binary Installation
```bash
# Remove binary
sudo rm /usr/local/bin/dockronos

# Remove configuration (optional)
rm -rf ~/.config/dockronos
rm -rf ~/.dockronos
```

### Package Manager Uninstall
```bash
# Homebrew
brew uninstall dockronos

# NPM
npm uninstall -g dockronos

# Scoop
scoop uninstall dockronos
```

## 🐛 Troubleshooting Installation

### Common Issues

#### "Command not found: dockronos"
```bash
# Check if binary is in PATH
echo $PATH

# Add current directory to PATH temporarily
export PATH=$PATH:$(pwd)

# Or use full path
./dockronos
```

#### "Permission denied"
```bash
# Make binary executable
chmod +x dockronos

# Check ownership
ls -la dockronos

# Fix ownership if needed
sudo chown $USER:$USER dockronos
```

#### "Neither Docker nor Podman found"
```bash
# Check if Docker/Podman is installed
docker --version
podman --version

# Check if it's in PATH
which docker
which podman

# Add to PATH if needed
export PATH=$PATH:/usr/local/bin
```

#### "Cannot connect to Docker daemon"
```bash
# Check if Docker daemon is running
sudo systemctl status docker

# Start Docker daemon
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Binary Architecture Mismatch
```bash
# Check your architecture
uname -m

# Download correct binary:
# x86_64 / amd64 → dockronos-linux
# arm64 / aarch64 → dockronos-linux-arm64 (when available)
```

### Getting Help

If you encounter issues during installation:

1. **Check system requirements** above
2. **Review error messages** carefully
3. **Search existing issues** on [GitHub](https://github.com/your-org/dockronos/issues)
4. **Ask for help** in [Discussions](https://github.com/your-org/dockronos/discussions)
5. **Report bugs** with installation details

### Diagnostic Information

When reporting issues, include:

```bash
# System information
uname -a
echo $SHELL
echo $PATH

# Container engine info
docker --version 2>/dev/null || echo "Docker not found"
podman --version 2>/dev/null || echo "Podman not found"

# Terminal capabilities
echo $TERM
tput colors

# Dockronos version
dockronos --version 2>/dev/null || echo "Dockronos not found"
```

## 🔗 Next Steps

After successful installation:

1. **Read the [Getting Started Guide](guides/getting-started.md)** for your first steps
2. **Configure your project** with [Configuration Guide](configuration.md)
3. **Learn keyboard shortcuts** in [Keyboard Shortcuts](keyboard-shortcuts.md)
4. **Explore examples** in [Usage Examples](guides/examples.md)

---

*Need help? Check our [Troubleshooting Guide](guides/troubleshooting.md) or ask in [GitHub Discussions](https://github.com/your-org/dockronos/discussions).*