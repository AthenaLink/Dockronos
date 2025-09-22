# Advanced Usage Guide

This guide covers advanced features and techniques for power users who want to get the most out of Dockronos. Learn about automation, custom configurations, integration patterns, and expert workflows.

## 🔧 Advanced Configuration

### Multi-Environment Setup

Create sophisticated environment-specific configurations:

```yaml
# dockronos.yml - Base configuration
project:
  name: my-app
  environments:
    development:
      inherit: base
      overrides:
        containers:
          - name: app
            environment:
              - NODE_ENV=development
              - DEBUG=*
            volumes:
              - ./src:/app/src:cached
    staging:
      inherit: base
      overrides:
        containers:
          - name: app
            environment:
              - NODE_ENV=staging
              - API_URL=https://staging-api.example.com
    production:
      inherit: base
      overrides:
        containers:
          - name: app
            environment:
              - NODE_ENV=production
              - API_URL=https://api.example.com
            resources:
              limits:
                memory: 512M
                cpus: "0.5"

containers:
  - name: app
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development

  - name: database
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=!env POSTGRES_USER
      - POSTGRES_PASSWORD=!env POSTGRES_PASSWORD
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Custom YAML Extensions

Extend YAML with custom types and functions:

```yaml
# Advanced YAML features
project:
  name: !env PROJECT_NAME || "default-name"
  version: !file VERSION
  build_time: !timestamp

containers:
  - name: web
    image: !template "nginx:${NGINX_VERSION:-latest}"
    configuration: !include nginx.conf
    secrets: !secret-manager
      - api_key
      - database_url

networks:
  frontend:
    driver: bridge
    ipam: !cidr "192.168.1.0/24"

volumes:
  app_data: !conditional
    development: !bind ./data
    production: !volume app_data_prod
```

### Conditional Configuration

Use conditions to adapt configuration dynamically:

```yaml
# Conditional blocks
containers:
  - name: app
    build: .
    !if development:
      volumes:
        - ./src:/app/src
        - ./node_modules:/app/node_modules
      environment:
        - NODE_ENV=development
        - HOT_RELOAD=true
    !if production:
      restart: always
      resources:
        limits:
          memory: 1G
          cpus: "1.0"
    !if gpu_available:
      runtime: nvidia
      environment:
        - NVIDIA_VISIBLE_DEVICES=all

  !if database_required:
    - name: postgres
      image: postgres:15
      environment: !env-file .env.database

monitoring:
  !if metrics_enabled:
    prometheus:
      enabled: true
      port: 9090
    grafana:
      enabled: true
      port: 3001
```

## 🚀 Automation and Scripting

### Git Hooks Integration

Automate container management with Git hooks:

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Automatic testing before commits

echo "🔍 Running pre-commit checks..."

# Start test containers
dockronos start test-database
sleep 5

# Run tests
dockronos exec app npm test

# Capture exit code
TEST_EXIT_CODE=$?

# Cleanup
dockronos stop test-database

# Fail commit if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "❌ Tests failed. Commit aborted."
    exit 1
fi

echo "✅ All checks passed!"
```

```bash
#!/bin/bash
# .git/hooks/post-merge
# Automatic container updates after pulling changes

echo "🔄 Checking for container updates..."

# Check if dependencies changed
if git diff HEAD@{1} --name-only | grep -E "(package\.json|Dockerfile|requirements\.txt)"; then
    echo "📦 Dependencies changed, rebuilding containers..."
    dockronos rebuild --no-cache
fi

# Check if configuration changed
if git diff HEAD@{1} --name-only | grep "dockronos\.yml"; then
    echo "⚙️ Configuration changed, restarting services..."
    dockronos restart
fi

echo "✅ Post-merge actions completed!"
```

### CI/CD Integration

#### GitHub Actions Workflow

```yaml
# .github/workflows/dockronos.yml
name: Dockronos CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dockronos
        run: npm install -g dockronos

      - name: Validate Configuration
        run: dockronos validate

      - name: Start Test Environment
        run: |
          dockronos start --env test
          dockronos wait --healthy --timeout 60

      - name: Run Tests
        run: dockronos exec app npm test

      - name: Run Integration Tests
        run: dockronos exec app npm run test:integration

      - name: Cleanup
        if: always()
        run: dockronos down --volumes

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Staging
        run: |
          dockronos deploy staging
          dockronos wait --healthy --timeout 120

      - name: Run Smoke Tests
        run: dockronos exec app npm run test:smoke

      - name: Deploy to Production
        if: success()
        run: dockronos deploy production
```

#### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        DOCKRONOS_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : 'staging'}"
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g dockronos'
                sh 'dockronos validate'
            }
        }

        stage('Test') {
            steps {
                sh 'dockronos start --env test'
                sh 'dockronos wait --healthy --timeout 60'
                sh 'dockronos exec app npm test'
            }
            post {
                always {
                    sh 'dockronos down --volumes'
                }
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                sh "dockronos deploy ${DOCKRONOS_ENV}"
                sh 'dockronos wait --healthy --timeout 120'
            }
        }
    }
}
```

### Custom Scripts and Aliases

Create powerful automation scripts:

```bash
#!/bin/bash
# scripts/dev-setup.sh - Development environment setup

set -e

echo "🚀 Setting up development environment..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | xargs)
fi

# Start core services
echo "📦 Starting core services..."
dockronos start database redis

# Wait for services to be ready
echo "⏳ Waiting for services..."
dockronos wait --healthy database redis --timeout 60

# Install dependencies
echo "📥 Installing dependencies..."
dockronos exec app npm install

# Run database migrations
echo "🗄️ Running database migrations..."
dockronos exec app npm run migrate

# Seed development data
echo "🌱 Seeding development data..."
dockronos exec app npm run seed:dev

# Start application
echo "🔄 Starting application..."
dockronos start app

echo "✅ Development environment ready!"
echo "🌐 Application: http://localhost:3000"
echo "📊 Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
```

```bash
# ~/.bashrc or ~/.zshrc - Useful aliases

# Quick commands
alias dr='dockronos'
alias drs='dockronos start'
alias drt='dockronos stop'
alias drr='dockronos restart'
alias drl='dockronos logs'

# Development workflows
alias dev-start='dockronos start --env development'
alias dev-stop='dockronos stop --env development'
alias dev-reset='dockronos down --volumes && dev-start'
alias dev-shell='dockronos exec app bash'

# Testing shortcuts
alias test-unit='dockronos exec app npm test'
alias test-integration='dockronos exec app npm run test:integration'
alias test-e2e='dockronos exec app npm run test:e2e'

# Database operations
alias db-shell='dockronos exec database psql -U app'
alias db-migrate='dockronos exec app npm run migrate'
alias db-seed='dockronos exec app npm run seed'
alias db-reset='dockronos exec app npm run db:reset'

# Monitoring
alias dr-status='dockronos status --verbose'
alias dr-logs-all='dockronos logs --follow --all'
alias dr-metrics='dockronos metrics --watch'
```

## 🔌 Plugin System and Extensions

### Custom Plugin Development

Create custom plugins to extend Dockronos functionality:

```typescript
// plugins/my-plugin.ts
import { Plugin, PluginContext } from 'dockronos';

export class MyCustomPlugin implements Plugin {
  name = 'my-custom-plugin';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Register custom commands
    context.commands.register('deploy', this.deployCommand.bind(this));

    // Register event handlers
    context.events.on('container:started', this.onContainerStarted.bind(this));

    // Register UI components
    context.ui.registerPanel('deployment', this.createDeploymentPanel.bind(this));
  }

  private async deployCommand(args: string[]): Promise<void> {
    const environment = args[0] || 'staging';

    console.log(`🚀 Deploying to ${environment}...`);

    // Custom deployment logic
    await this.buildImages();
    await this.pushToRegistry(environment);
    await this.updateServices(environment);

    console.log(`✅ Deployment to ${environment} complete!`);
  }

  private async onContainerStarted(container: ContainerInfo): Promise<void> {
    // Custom logic when containers start
    if (container.name === 'app') {
      await this.runHealthChecks(container);
      await this.registerService(container);
    }
  }

  private createDeploymentPanel(): UIPanel {
    return {
      title: 'Deployments',
      content: this.renderDeploymentStatus(),
      keybindings: [
        { key: 'd', action: () => this.triggerDeployment() }
      ]
    };
  }
}
```

### Plugin Configuration

```yaml
# dockronos.yml
plugins:
  - name: my-custom-plugin
    path: ./plugins/my-plugin.ts
    config:
      deployment:
        registry: my-registry.com
        environments:
          - staging
          - production

  - name: slack-notifications
    package: dockronos-plugin-slack
    config:
      webhook_url: !env SLACK_WEBHOOK_URL
      channels:
        errors: "#alerts"
        deployments: "#deployments"

  - name: database-backup
    package: dockronos-plugin-db-backup
    config:
      schedule: "0 2 * * *"  # Daily at 2 AM
      retention: 7
      storage: s3://my-backups/
```

## 🔗 Integration Patterns

### Service Mesh Integration

Integrate with Istio or Linkerd:

```yaml
# Service mesh configuration
containers:
  - name: app
    build: .
    annotations:
      linkerd.io/inject: enabled
      prometheus.io/scrape: "true"
      prometheus.io/port: "9090"
    environment:
      - LINKERD_AWAIT_ENABLED=true

networks:
  service-mesh:
    external: true
    name: linkerd

monitoring:
  prometheus:
    enabled: true
    scrape_configs:
      - job_name: 'dockronos-apps'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
```

### API Gateway Integration

Integrate with Kong, Traefik, or NGINX:

```yaml
# API Gateway setup
containers:
  - name: api-gateway
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./certs:/etc/traefik/certs:ro
    labels:
      - traefik.enable=true
      - traefik.http.routers.dashboard.rule=Host(`traefik.localhost`)

  - name: app
    build: .
    labels:
      - traefik.enable=true
      - traefik.http.routers.app.rule=Host(`app.localhost`)
      - traefik.http.services.app.loadbalancer.server.port=3000
      - traefik.http.routers.app.middlewares=auth

  - name: api
    build: ./api
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(`api.localhost`)
      - traefik.http.services.api.loadbalancer.server.port=8000
      - traefik.http.routers.api.middlewares=cors,rate-limit
```

### Monitoring Stack Integration

Complete observability setup:

```yaml
# Comprehensive monitoring
containers:
  # Application containers
  - name: app
    build: .
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:14268/api/traces
    depends_on:
      - jaeger
      - prometheus

  # Metrics collection
  - name: prometheus
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  # Metrics visualization
  - name: grafana
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  # Distributed tracing
  - name: jaeger
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  # Log aggregation
  - name: loki
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml

  - name: promtail
    image: grafana/promtail:latest
    volumes:
      - ./logs:/var/log
      - ./monitoring/promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

volumes:
  prometheus_data:
  grafana_data:
```

## 🎯 Performance Optimization

### Resource Management

Optimize container resource usage:

```yaml
# Resource constraints and optimization
containers:
  - name: app
    build: .
    resources:
      limits:
        memory: 512M
        cpus: "0.5"
      reservations:
        memory: 256M
        cpus: "0.25"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    ulimits:
      nofile:
        soft: 1024
        hard: 2048
    sysctls:
      - net.core.somaxconn=1024

  - name: database
    image: postgres:15-alpine
    shm_size: 256mb
    resources:
      limits:
        memory: 1G
        cpus: "1.0"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/postgresql.conf:/etc/postgresql/postgresql.conf
    command: ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
```

### Build Optimization

Optimize container builds:

```dockerfile
# Multi-stage build optimization
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
USER node
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Network Optimization

Optimize container networking:

```yaml
# Network performance optimization
networks:
  frontend:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1500
    ipam:
      config:
        - subnet: 172.20.0.0/16

  backend:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.21.0.0/16

containers:
  - name: nginx
    image: nginx:alpine
    networks:
      frontend:
        ipv4_address: 172.20.0.10
      backend:
        ipv4_address: 172.21.0.10
    sysctls:
      - net.core.somaxconn=1024
      - net.ipv4.tcp_keepalive_time=600

  - name: app
    build: .
    networks:
      backend:
        ipv4_address: 172.21.0.20
    extra_hosts:
      - "api.internal:172.21.0.30"
```

## 🔒 Security Best Practices

### Secrets Management

Secure handling of sensitive data:

```yaml
# Secure secrets configuration
secrets:
  database_password:
    external: true
    name: db_password_v1
  api_key:
    file: ./secrets/api_key.txt
  ssl_cert:
    external: true
    name: ssl_certificate

containers:
  - name: app
    build: .
    secrets:
      - source: api_key
        target: /run/secrets/api_key
        mode: 0400
      - source: ssl_cert
        target: /run/secrets/ssl_cert
        mode: 0444
    environment:
      - API_KEY_FILE=/run/secrets/api_key
    user: "1000:1000"
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp

  - name: database
    image: postgres:15-alpine
    secrets:
      - source: database_password
        target: /run/secrets/db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - SETGID
      - SETUID
```

### Security Scanning

Automated security scanning:

```bash
#!/bin/bash
# scripts/security-scan.sh

set -e

echo "🔍 Running security scans..."

# Scan container images
echo "📦 Scanning container images..."
for image in $(dockronos images --format "{{.Repository}}:{{.Tag}}"); do
    echo "Scanning $image..."
    trivy image --exit-code 1 --severity HIGH,CRITICAL "$image"
done

# Scan configuration
echo "⚙️ Scanning configuration..."
dockronos config scan --compliance CIS

# Scan for secrets
echo "🔐 Scanning for secrets..."
truffleHog --regex --entropy=False .

# Network security scan
echo "🌐 Scanning network security..."
dockronos network scan --check-encryption --check-access

echo "✅ Security scans completed!"
```

---

*This advanced usage guide provides powerful techniques and patterns for expert Dockronos users. These features enable sophisticated workflows, automation, and integration with enterprise systems while maintaining security and performance.*