# Getting Started with Dockronos

Welcome to Dockronos! This guide will walk you through your first steps with the interactive container management tool. By the end of this tutorial, you'll be confidently managing containers through the terminal interface.

## 🎯 What You'll Learn

- How to install and set up Dockronos
- Creating your first project configuration
- Navigating the interactive interface
- Managing containers and services
- Working with logs and metrics
- Basic git repository management

## 📋 Before You Start

### Prerequisites Checklist

Make sure you have:

- ✅ **Container Engine**: Docker or Podman installed and running
- ✅ **Terminal**: A modern terminal with color support
- ✅ **Permissions**: Ability to run container commands
- ✅ **Git** (optional): For repository management features

### Quick System Check

Run these commands to verify your setup:

```bash
# Check Docker
docker --version
docker ps

# Or check Podman
podman --version
podman ps

# Check terminal colors
tput colors  # Should show 256 or more
```

If any of these fail, see the [Installation Guide](../installation.md) for setup instructions.

## 🚀 Step 1: Install Dockronos

Choose the installation method that works best for you:

### Option A: Download Binary (Recommended)

```bash
# Linux
curl -L -o dockronos https://github.com/your-org/dockronos/releases/latest/download/dockronos-linux
chmod +x dockronos
sudo mv dockronos /usr/local/bin/

# macOS
curl -L -o dockronos https://github.com/your-org/dockronos/releases/latest/download/dockronos-macos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/your-org/dockronos/releases/latest/download/dockronos-windows.exe" -OutFile "dockronos.exe"
```

### Option B: Build from Source

```bash
git clone https://github.com/your-org/dockronos.git
cd dockronos
pnpm install
pnpm build
pnpm start
```

### Verify Installation

```bash
dockronos --version
# Should output: Dockronos v2.0.0 (or similar)
```

## 🏗️ Step 2: Create Your First Project

Let's create a simple web application project to learn Dockronos basics.

### Create Project Directory

```bash
mkdir my-first-dockronos-project
cd my-first-dockronos-project
```

### Set Up Sample Services

Create a simple multi-service application:

```bash
# Create directories
mkdir frontend backend database

# Frontend service (React app)
cat > frontend/docker-compose.yml << 'EOF'
version: '3.8'
services:
  frontend:
    image: node:18-alpine
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    working_dir: /app
    command: sh -c "npm install && npm start"
    environment:
      - NODE_ENV=development
EOF

cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:3001
REACT_APP_TITLE=My First Dockronos App
PORT=3000
EOF

# Backend service (Node.js API)
cat > backend/docker-compose.yml << 'EOF'
version: '3.8'
services:
  backend:
    image: node:18-alpine
    ports:
      - "3001:3001"
    volumes:
      - .:/app
    working_dir: /app
    command: sh -c "npm install && npm run dev"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:secret@database:5432/myapp
EOF

cat > backend/.env << 'EOF'
PORT=3001
DATABASE_URL=postgresql://postgres:secret@localhost:5432/myapp
JWT_SECRET=my-secret-key
LOG_LEVEL=debug
EOF

# Database service
cat > database/docker-compose.yml << 'EOF'
version: '3.8'
services:
  database:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF
```

## 🔧 Step 3: Initialize Dockronos Configuration

Now let's set up Dockronos to manage these services:

### Auto-Discovery (Recommended)

Dockronos can automatically detect your services:

```bash
dockronos init --auto-discover
```

This command will:
1. Scan your project directories
2. Find docker-compose.yml files
3. Detect environment files
4. Create a dockronos.yml configuration

### Manual Configuration

Alternatively, create the configuration manually:

```bash
cat > dockronos.yml << 'EOF'
name: my-first-project
description: "A simple web application with frontend, backend, and database"
engine: auto

services:
  - name: frontend
    description: "React frontend application"
    directory: ./frontend
    compose_file: docker-compose.yml
    env_file: .env

  - name: backend
    description: "Node.js API server"
    directory: ./backend
    compose_file: docker-compose.yml
    env_file: .env

  - name: database
    description: "PostgreSQL database"
    directory: ./database
    compose_file: docker-compose.yml

# Global environment settings
global_env: .env.global

# UI preferences
ui:
  theme: dark
  refresh_interval: 5000
  show_timestamps: true
  follow_logs: true
EOF
```

### Create Global Environment File

```bash
cat > .env.global << 'EOF'
# Global settings for all services
NODE_ENV=development
LOG_LEVEL=info
COMPOSE_PROJECT_NAME=my-first-project
EOF
```

## 🎮 Step 4: Launch Dockronos

Now let's start the interactive interface:

```bash
dockronos
```

You should see the Dockronos interface with three panels:

```
┌─────────────────────────────────────────────────────────────────┐
│ Services Panel            │ Metrics Panel                      │
│ ┌─ Services ───────────┐  │ ┌─ System Metrics ──────────────┐ │
│ │ ▶ frontend   [DOWN] │  │ │ CPU:  [████░░░░] 45%          │ │
│ │   backend    [DOWN] │  │ │ RAM:  [██████░░] 72%          │ │
│ │   database   [DOWN] │  │ │ DISK: [███░░░░░] 38%          │ │
│ └─────────────────────┘  │ └───────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Logs Panel                                                      │
│ ┌─ Logs ──────────────────────────────────────────────────────┐ │
│ │ Welcome to Dockronos! Press ? for help                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Ready | Engine: Docker | Press ? for help                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🕹️ Step 5: Navigate the Interface

Let's learn the basic navigation:

### Get Help
Press `?` to see the help overlay with all keyboard shortcuts.

### Switch Between Panels
- Press `1` to focus on Services panel
- Press `2` to focus on Metrics panel
- Press `3` to focus on Logs panel
- Press `Tab` to cycle through panels

### Navigate Services List
- Use `↑` and `↓` arrow keys to move through services
- Press `Enter` to select a service

## 🚀 Step 6: Start Your First Service

Let's start the database first since other services depend on it:

1. **Select the database service**:
   - Press `1` to focus on Services panel
   - Use `↓` arrow to navigate to "database"

2. **Start the service**:
   - Press `S` to start the database service
   - Watch the status change from [DOWN] to [STARTING] to [UP]

3. **View the logs**:
   - Press `D` to show logs for the database
   - You should see PostgreSQL initialization logs

4. **Start the backend**:
   - Press `1` to return to Services panel
   - Navigate to "backend" and press `S`

5. **Start the frontend**:
   - Navigate to "frontend" and press `S`

## 📊 Step 7: Monitor Your Services

### Check System Metrics
- Press `2` to switch to the Metrics panel
- Watch CPU and memory usage as services start
- See individual container metrics

### View Service Logs
- Press `3` to switch to the Logs panel
- Press `Tab` to cycle through different service logs
- Press `F` to toggle follow mode (auto-scroll new logs)
- Press `T` to toggle timestamps

### Monitor Service Status
- Press `1` to return to Services panel
- All services should show [UP] status
- Green indicators show healthy services

## 🔄 Step 8: Manage Running Services

Now let's try some basic management operations:

### Restart a Service
1. Navigate to the backend service
2. Press `R` to restart it
3. Watch the status change to [RESTARTING] then [UP]
4. Check logs to see the restart process

### Stop a Service
1. Navigate to the frontend service
2. Press `X` to stop it
3. Status changes to [DOWN]

### Start All Services
1. Press `Ctrl+A` to select all services
2. Press `Shift+S` to start all selected services
3. All services should start simultaneously

## 🔧 Step 9: Advanced Features

### Environment Management
1. Select a service
2. Press `E` to edit environment variables
3. Make changes and save (Ctrl+S)
4. Restart the service to apply changes

### Log Management
1. Switch to Logs panel (`3`)
2. Press `C` to clear current logs
3. Press `/` to search for specific text
4. Press `N` to find next occurrence

### Quick Actions
- `F5` or `R` - Refresh all data
- `Q` or `Ctrl+C` - Quit Dockronos
- `Escape` - Return to Services panel

## 🎯 Step 10: Try the CLI Commands

Exit the TUI (press `Q`) and try some command-line operations:

### List Containers
```bash
dockronos list
```

### Start Services from CLI
```bash
dockronos up frontend backend
```

### View Logs from CLI
```bash
dockronos logs backend --follow
```

### Stop All Services
```bash
dockronos down
```

## 🐳 Step 11: Explore Container Templates

Dockronos includes pre-built templates for common services:

### View Available Templates
```bash
dockronos templates
```

### Pull and Run Redis
```bash
dockronos pull redis -e REDIS_PASSWORD=secret123
```

### Search for Images
```bash
dockronos search postgres --limit 5
```

### List Local Images
```bash
dockronos images
```

## 📁 Step 12: Git Integration (Optional)

If you want to work with git repositories:

### Clone a Repository
```bash
dockronos git clone https://github.com/example/microservice.git
```

### Check Repository Status
```bash
dockronos git status
```

### Update Repositories
```bash
dockronos git refresh
```

## 🎓 What You've Learned

Congratulations! You've completed the Dockronos getting started tutorial. You now know how to:

- ✅ Install and set up Dockronos
- ✅ Create and configure projects
- ✅ Navigate the interactive interface
- ✅ Start, stop, and restart services
- ✅ Monitor logs and metrics
- ✅ Use CLI commands
- ✅ Work with container templates
- ✅ Basic git repository management

## 🚀 Next Steps

Now that you're familiar with the basics, explore these advanced topics:

### Recommended Reading
1. **[Configuration Guide](../configuration.md)** - Learn advanced configuration options
2. **[Keyboard Shortcuts](../keyboard-shortcuts.md)** - Master efficient navigation
3. **[Advanced Usage](advanced-usage.md)** - Power user features and workflows
4. **[CLI Reference](../cli-reference.md)** - Complete command documentation

### Try These Projects
1. **Multi-service Application** - Set up a complex microservices project
2. **Development Environment** - Create a full development stack
3. **CI/CD Integration** - Use Dockronos in automated workflows

### Join the Community
- **GitHub Discussions**: Ask questions and share tips
- **Issues**: Report bugs or request features
- **Contributing**: Help improve Dockronos

## 🐛 Troubleshooting

### Common Issues

**Services won't start**:
```bash
# Check Docker/Podman status
docker ps
# or
podman ps

# Check service configuration
dockronos init --validate
```

**Interface appears garbled**:
```bash
# Check terminal color support
tput colors

# Try different terminal
export TERM=xterm-256color
dockronos
```

**Permission errors**:
```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Restart Dockronos
dockronos
```

**Can't find configuration**:
```bash
# Check current directory
ls -la dockronos.yml

# Create new configuration
dockronos init --auto-discover
```

### Getting Help

If you encounter issues:

1. **Check the logs**: Use `dockronos start --debug` for detailed logging
2. **Validate config**: Run `dockronos init --validate`
3. **Read documentation**: See [Troubleshooting Guide](troubleshooting.md)
4. **Ask for help**: Visit [GitHub Discussions](https://github.com/your-org/dockronos/discussions)

## 📚 Example Projects

### Simple Web App
```yaml
name: simple-web-app
services:
  - name: web
    directory: ./web
    compose_file: docker-compose.yml
  - name: api
    directory: ./api
    compose_file: docker-compose.yml
```

### Microservices Platform
```yaml
name: microservices
projects_directory: "./services"
repositories:
  - url: "https://github.com/company/user-service.git"
    directory: "user-service"
  - url: "https://github.com/company/order-service.git"
    directory: "order-service"
services:
  - name: gateway
    directory: ./gateway
    compose_file: docker-compose.yml
```

### Development Environment
```yaml
name: dev-environment
containers:
  - name: dev-postgres
    image: postgres:15-alpine
    template: postgres
    env:
      POSTGRES_PASSWORD: "dev"
  - name: dev-redis
    image: redis:7-alpine
    template: redis
```

---

**Welcome to the Dockronos community!** 🎉

You're now ready to efficiently manage containers in your development workflow. Happy containerizing!

*Need help? Check our [Troubleshooting Guide](troubleshooting.md) or join the discussion on [GitHub](https://github.com/your-org/dockronos/discussions).*