# Guía de Uso Avanzado

Esta guía cubre características avanzadas y técnicas para usuarios expertos que quieren aprovechar al máximo Dockronos. Aprende sobre automatización, configuraciones personalizadas, patrones de integración y flujos de trabajo expertos.

## 🔧 Configuración Avanzada

### Configuración Multi-Entorno

Crear configuraciones sofisticadas específicas para cada entorno:

```yaml
# dockronos.yml - Configuración base
project:
  name: mi-app
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

### Extensiones YAML Personalizadas

Extender YAML con tipos y funciones personalizadas:

```yaml
# Características avanzadas de YAML
project:
  name: !env PROJECT_NAME || "nombre-por-defecto"
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

### Configuración Condicional

Usar condiciones para adaptar la configuración dinámicamente:

```yaml
# Bloques condicionales
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

## 🚀 Automatización y Scripting

### Integración con Git Hooks

Automatizar gestión de contenedores con Git hooks:

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Pruebas automáticas antes de commits

echo "🔍 Ejecutando verificaciones pre-commit..."

# Iniciar contenedores de prueba
dockronos start test-database
sleep 5

# Ejecutar pruebas
dockronos exec app npm test

# Capturar código de salida
TEST_EXIT_CODE=$?

# Limpiar
dockronos stop test-database

# Fallar commit si las pruebas fallaron
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "❌ Las pruebas fallaron. Commit abortado."
    exit 1
fi

echo "✅ ¡Todas las verificaciones pasaron!"
```

```bash
#!/bin/bash
# .git/hooks/post-merge
# Actualizaciones automáticas de contenedores después de hacer pull

echo "🔄 Verificando actualizaciones de contenedores..."

# Verificar si las dependencias cambiaron
if git diff HEAD@{1} --name-only | grep -E "(package\.json|Dockerfile|requirements\.txt)"; then
    echo "📦 Las dependencias cambiaron, reconstruyendo contenedores..."
    dockronos rebuild --no-cache
fi

# Verificar si la configuración cambió
if git diff HEAD@{1} --name-only | grep "dockronos\.yml"; then
    echo "⚙️ La configuración cambió, reiniciando servicios..."
    dockronos restart
fi

echo "✅ ¡Acciones post-merge completadas!"
```

### Integración CI/CD

#### Flujo de Trabajo GitHub Actions

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

      - name: Configurar Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Instalar Dockronos
        run: npm install -g dockronos

      - name: Validar Configuración
        run: dockronos validate

      - name: Iniciar Entorno de Pruebas
        run: |
          dockronos start --env test
          dockronos wait --healthy --timeout 60

      - name: Ejecutar Pruebas
        run: dockronos exec app npm test

      - name: Ejecutar Pruebas de Integración
        run: dockronos exec app npm run test:integration

      - name: Limpiar
        if: always()
        run: dockronos down --volumes

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy a Staging
        run: |
          dockronos deploy staging
          dockronos wait --healthy --timeout 120

      - name: Ejecutar Pruebas de Humo
        run: dockronos exec app npm run test:smoke

      - name: Deploy a Producción
        if: success()
        run: dockronos deploy production
```

#### Pipeline Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        DOCKRONOS_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : 'staging'}"
    }

    stages {
        stage('Configuración') {
            steps {
                sh 'npm install -g dockronos'
                sh 'dockronos validate'
            }
        }

        stage('Pruebas') {
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

### Scripts Personalizados y Aliases

Crear scripts de automatización poderosos:

```bash
#!/bin/bash
# scripts/dev-setup.sh - Configuración de entorno de desarrollo

set -e

echo "🚀 Configurando entorno de desarrollo..."

# Cargar variables de entorno
if [ -f .env.local ]; then
    export $(cat .env.local | xargs)
fi

# Iniciar servicios principales
echo "📦 Iniciando servicios principales..."
dockronos start database redis

# Esperar a que los servicios estén listos
echo "⏳ Esperando servicios..."
dockronos wait --healthy database redis --timeout 60

# Instalar dependencias
echo "📥 Instalando dependencias..."
dockronos exec app npm install

# Ejecutar migraciones de base de datos
echo "🗄️ Ejecutando migraciones de base de datos..."
dockronos exec app npm run migrate

# Poblar datos de desarrollo
echo "🌱 Poblando datos de desarrollo..."
dockronos exec app npm run seed:dev

# Iniciar aplicación
echo "🔄 Iniciando aplicación..."
dockronos start app

echo "✅ ¡Entorno de desarrollo listo!"
echo "🌐 Aplicación: http://localhost:3000"
echo "📊 Base de datos: localhost:5432"
echo "🔴 Redis: localhost:6379"
```

```bash
# ~/.bashrc o ~/.zshrc - Aliases útiles

# Comandos rápidos
alias dr='dockronos'
alias drs='dockronos start'
alias drt='dockronos stop'
alias drr='dockronos restart'
alias drl='dockronos logs'

# Flujos de trabajo de desarrollo
alias dev-start='dockronos start --env development'
alias dev-stop='dockronos stop --env development'
alias dev-reset='dockronos down --volumes && dev-start'
alias dev-shell='dockronos exec app bash'

# Atajos de pruebas
alias test-unit='dockronos exec app npm test'
alias test-integration='dockronos exec app npm run test:integration'
alias test-e2e='dockronos exec app npm run test:e2e'

# Operaciones de base de datos
alias db-shell='dockronos exec database psql -U app'
alias db-migrate='dockronos exec app npm run migrate'
alias db-seed='dockronos exec app npm run seed'
alias db-reset='dockronos exec app npm run db:reset'

# Monitoreo
alias dr-status='dockronos status --verbose'
alias dr-logs-all='dockronos logs --follow --all'
alias dr-metrics='dockronos metrics --watch'
```

## 🔌 Sistema de Plugins y Extensiones

### Desarrollo de Plugins Personalizados

Crear plugins personalizados para extender la funcionalidad de Dockronos:

```typescript
// plugins/my-plugin.ts
import { Plugin, PluginContext } from 'dockronos';

export class MiPluginPersonalizado implements Plugin {
  name = 'mi-plugin-personalizado';
  version = '1.0.0';

  async initialize(context: PluginContext): Promise<void> {
    // Registrar comandos personalizados
    context.commands.register('deploy', this.deployCommand.bind(this));

    // Registrar manejadores de eventos
    context.events.on('container:started', this.onContainerStarted.bind(this));

    // Registrar componentes de UI
    context.ui.registerPanel('deployment', this.createDeploymentPanel.bind(this));
  }

  private async deployCommand(args: string[]): Promise<void> {
    const environment = args[0] || 'staging';

    console.log(`🚀 Desplegando a ${environment}...`);

    // Lógica de despliegue personalizada
    await this.buildImages();
    await this.pushToRegistry(environment);
    await this.updateServices(environment);

    console.log(`✅ ¡Despliegue a ${environment} completo!`);
  }

  private async onContainerStarted(container: ContainerInfo): Promise<void> {
    // Lógica personalizada cuando los contenedores inician
    if (container.name === 'app') {
      await this.runHealthChecks(container);
      await this.registerService(container);
    }
  }

  private createDeploymentPanel(): UIPanel {
    return {
      title: 'Despliegues',
      content: this.renderDeploymentStatus(),
      keybindings: [
        { key: 'd', action: () => this.triggerDeployment() }
      ]
    };
  }
}
```

### Configuración de Plugins

```yaml
# dockronos.yml
plugins:
  - name: mi-plugin-personalizado
    path: ./plugins/mi-plugin.ts
    config:
      deployment:
        registry: mi-registry.com
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
      schedule: "0 2 * * *"  # Diario a las 2 AM
      retention: 7
      storage: s3://mis-backups/
```

## 🔗 Patrones de Integración

### Integración con Service Mesh

Integrar con Istio o Linkerd:

```yaml
# Configuración de service mesh
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

### Integración con API Gateway

Integrar con Kong, Traefik, o NGINX:

```yaml
# Configuración de API Gateway
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

### Integración con Stack de Monitoreo

Configuración completa de observabilidad:

```yaml
# Monitoreo comprensivo
containers:
  # Contenedores de aplicación
  - name: app
    build: .
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:14268/api/traces
    depends_on:
      - jaeger
      - prometheus

  # Recolección de métricas
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

  # Visualización de métricas
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

  # Trazado distribuido
  - name: jaeger
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  # Agregación de logs
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

## 🎯 Optimización de Rendimiento

### Gestión de Recursos

Optimizar el uso de recursos del contenedor:

```yaml
# Restricciones y optimización de recursos
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

### Optimización de Build

Optimizar builds de contenedores:

```dockerfile
# Build multi-etapa optimizado
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

### Optimización de Red

Optimizar redes de contenedores:

```yaml
# Optimización de rendimiento de red
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

## 🔒 Mejores Prácticas de Seguridad

### Gestión de Secretos

Manejo seguro de datos sensibles:

```yaml
# Configuración segura de secretos
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

### Escaneo de Seguridad

Escaneo automatizado de seguridad:

```bash
#!/bin/bash
# scripts/security-scan.sh

set -e

echo "🔍 Ejecutando escaneos de seguridad..."

# Escanear imágenes de contenedores
echo "📦 Escaneando imágenes de contenedores..."
for image in $(dockronos images --format "{{.Repository}}:{{.Tag}}"); do
    echo "Escaneando $image..."
    trivy image --exit-code 1 --severity HIGH,CRITICAL "$image"
done

# Escanear configuración
echo "⚙️ Escaneando configuración..."
dockronos config scan --compliance CIS

# Escanear secretos
echo "🔐 Escaneando secretos..."
truffleHog --regex --entropy=False .

# Escaneo de seguridad de red
echo "🌐 Escaneando seguridad de red..."
dockronos network scan --check-encryption --check-access

echo "✅ ¡Escaneos de seguridad completados!"
```

---

*Esta guía de uso avanzado proporciona técnicas poderosas y patrones para usuarios expertos de Dockronos. Estas características permiten flujos de trabajo sofisticados, automatización e integración con sistemas empresariales mientras mantienen seguridad y rendimiento.*