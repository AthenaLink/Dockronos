# Guía de Configuración

Dockronos puede configurarse usando archivos YAML para personalizar el comportamiento, definir contenedores y optimizar tu flujo de trabajo. Esta guía cubre todas las opciones de configuración disponibles.

## 🎯 Resumen de Configuración

Dockronos soporta múltiples formas de configuración:

1. **Archivo `dockronos.yml`** - Configuración nativa de Dockronos
2. **Archivo `docker-compose.yml`** - Compatibilidad con Docker Compose
3. **Variables de entorno** - Sobrescribir configuraciones
4. **Argumentos de línea de comandos** - Configuración temporal

## 📁 Descubrimiento de Archivos

Dockronos busca archivos de configuración en este orden:

```
1. ./dockronos.yml
2. ./dockronos.yaml
3. ./.dockronos/config.yml
4. ./docker-compose.yml
5. ./docker-compose.yaml
6. ./compose.yml
```

## 📝 Configuración Básica

### Estructura Mínima

```yaml
# dockronos.yml
project:
  name: "mi-proyecto"

containers:
  - name: "mi-app"
    image: "nginx:alpine"
    ports:
      - "8080:80"
```

### Configuración Completa

```yaml
# dockronos.yml - Configuración completa de ejemplo
project:
  name: "Mi Aplicación Web"
  description: "Aplicación web completa con base de datos"
  version: "1.0.0"

# Configuración del motor de contenedores
engine:
  preferred: "docker"  # "docker" o "podman"
  fallback: true       # Probar otros motores si falla el preferido
  timeout: 30000       # Timeout de comandos en milisegundos

# Configuración de la interfaz de usuario
ui:
  theme: "default"     # Esquema de colores
  refreshInterval: 5000 # Frecuencia de actualización en ms
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

# Definición de contenedores
containers:
  - name: "frontend"
    image: "nginx:alpine"
    ports:
      - "8080:80"
    environment:
      - "NODE_ENV=production"
    volumes:
      - "./dist:/usr/share/nginx/html"
    labels:
      - "app=frontend"
      - "tier=web"

  - name: "backend"
    build: "./api"
    ports:
      - "3000:3000"
    environment:
      - "DATABASE_URL=postgresql://user:pass@database:5432/app"
    depends_on:
      - database
    volumes:
      - "./api:/app"
      - "/app/node_modules"

  - name: "database"
    image: "postgres:15-alpine"
    environment:
      - "POSTGRES_DB=app"
      - "POSTGRES_USER=user"
      - "POSTGRES_PASSWORD=password"
    volumes:
      - "postgres_data:/var/lib/postgresql/data"
    ports:
      - "5432:5432"

# Definición de volúmenes
volumes:
  postgres_data:
    driver: local

# Definición de redes
networks:
  app_network:
    driver: bridge

# Sistema de plantillas
templates:
  enabled: true
  directory: ".dockronos/templates"

# Integración con Git
git:
  enabled: true
  autoCommit: false
  hooks:
    pre_start: "npm run build"
    post_stop: "npm run cleanup"
```

## 🔧 Configuración del Proyecto

### Metadatos del Proyecto

```yaml
project:
  name: "Nombre del Proyecto"           # Requerido
  description: "Descripción del proyecto" # Opcional
  version: "1.0.0"                      # Opcional
  author: "Tu Nombre"                   # Opcional
  license: "MIT"                        # Opcional
  homepage: "https://mi-proyecto.com"   # Opcional
  repository: "https://github.com/usuario/proyecto" # Opcional
```

### Configuración de Entorno

```yaml
# Variables de entorno globales
environment:
  NODE_ENV: "development"
  DEBUG: "*"
  LOG_LEVEL: "info"

# Archivos de entorno
env_files:
  - ".env"
  - ".env.local"
  - ".env.development"
```

## 🐳 Configuración de Contenedores

### Definición Básica de Contenedor

```yaml
containers:
  - name: "mi-servicio"          # Requerido: nombre único
    image: "nginx:alpine"        # Imagen de Docker Hub
    # O usar build en lugar de image
    # build: "./ruta/al/dockerfile"

    # Puertos
    ports:
      - "8080:80"               # host:contenedor
      - "443:443"

    # Variables de entorno
    environment:
      - "VAR1=valor1"
      - "VAR2=valor2"

    # Volúmenes
    volumes:
      - "./local:/contenedor"   # bind mount
      - "volumen_nombrado:/ruta" # named volume

    # Dependencias
    depends_on:
      - "database"
      - "redis"
```

### Configuración Avanzada de Contenedor

```yaml
containers:
  - name: "app-avanzada"
    image: "node:18-alpine"

    # Comando personalizado
    command: ["node", "server.js"]
    # O usar entrypoint
    # entrypoint: ["/entrypoint.sh"]

    # Directorio de trabajo
    working_dir: "/app"

    # Usuario
    user: "1000:1000"

    # Recursos
    resources:
      limits:
        memory: "512M"
        cpus: "0.5"
      reservations:
        memory: "256M"
        cpus: "0.25"

    # Reinicio
    restart: "unless-stopped"  # no, always, on-failure, unless-stopped

    # Chequeo de salud
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: "30s"
      timeout: "10s"
      retries: 3
      start_period: "40s"

    # Etiquetas
    labels:
      - "app=mi-aplicacion"
      - "environment=development"
      - "version=1.0.0"

    # Configuración de red
    networks:
      - "app_network"

    # Configuración de seguridad
    security_opt:
      - "no-new-privileges:true"

    # Capabilities
    cap_add:
      - "SYS_TIME"
    cap_drop:
      - "ALL"

    # Opciones adicionales
    privileged: false
    read_only: false
    stdin_open: true
    tty: true
```

## 🎨 Configuración de UI

### Temas y Apariencia

```yaml
ui:
  theme: "default"              # default, dark, light, high-contrast

  # Colores personalizados
  colors:
    primary: "#007acc"
    secondary: "#6c757d"
    success: "#28a745"
    warning: "#ffc107"
    error: "#dc3545"
    background: "#1e1e1e"
    foreground: "#d4d4d4"

  # Configuración de paneles
  panels:
    layout: "three-column"      # three-column, two-column, single

    services:
      enabled: true
      width: "60%"
      autoExpand: true
      showImages: true
      showPorts: true
      showStatus: true
      sortBy: "name"            # name, status, created
      groupBy: "none"           # none, status, image

    metrics:
      enabled: true
      width: "40%"
      refreshInterval: 2000
      historySize: 100
      showGraphs: true

      # Métricas a mostrar
      system:
        cpu: true
        memory: true
        disk: true
        network: true

      containers:
        cpu: true
        memory: true
        network: false
        disk: false

    logs:
      enabled: true
      height: "30%"
      followMode: true
      maxLines: 1000
      showTimestamps: true
      showLineNumbers: false
      wordWrap: true

      # Filtros de logs
      filters:
        - level: "error"
        - level: "warn"

      # Formato de timestamps
      timestampFormat: "YYYY-MM-DD HH:mm:ss"
```

### Atajos de Teclado Personalizados

```yaml
ui:
  shortcuts:
    # Controles globales
    quit: "q"
    help: "?"
    refresh: ["F5", "r"]

    # Navegación de paneles
    panels:
      services: "1"
      metrics: "2"
      logs: "3"
      cycle: "Tab"

    # Acciones de servicios
    services:
      start: "s"
      stop: "x"
      restart: "r"
      logs: "d"
      edit_env: "e"
      inspect: "i"

    # Controles de logs
    logs:
      follow: "f"
      clear: "c"
      search: "/"
      filter: "ctrl+f"

    # Controles de métricas
    metrics:
      pause: "space"
      reset: "ctrl+r"
      zoom_in: "+"
      zoom_out: "-"
```

## ⚙️ Configuración del Motor

### Docker

```yaml
engine:
  preferred: "docker"
  timeout: 30000

  # Configuración específica de Docker
  docker:
    host: "unix:///var/run/docker.sock"  # O tcp://localhost:2376
    api_version: "1.41"

    # Configuración TLS (para Docker remoto)
    tls:
      enabled: false
      ca_cert: "/path/to/ca.pem"
      cert: "/path/to/cert.pem"
      key: "/path/to/key.pem"
      verify: true

    # Configuración de registro
    registry:
      username: "usuario"
      password: "contraseña"
      server: "docker.io"
```

### Podman

```yaml
engine:
  preferred: "podman"

  # Configuración específica de Podman
  podman:
    socket: "unix:///run/user/1000/podman/podman.sock"
    remote: false

    # Configuración de máquina (macOS/Windows)
    machine:
      name: "podman-machine-default"
      auto_start: true
```

## 🔗 Redes y Volúmenes

### Configuración de Redes

```yaml
networks:
  # Red bridge básica
  app_network:
    driver: "bridge"

  # Red con configuración IPAM
  frontend_network:
    driver: "bridge"
    ipam:
      config:
        - subnet: "172.20.0.0/16"
          gateway: "172.20.0.1"

  # Red externa
  external_network:
    external: true
    name: "mi_red_externa"
```

### Configuración de Volúmenes

```yaml
volumes:
  # Volumen local
  app_data:
    driver: "local"

  # Volumen con opciones
  database_data:
    driver: "local"
    driver_opts:
      type: "nfs"
      o: "addr=10.40.0.199,rw"
      device: ":/path/to/dir"

  # Volumen externo
  shared_data:
    external: true
    name: "shared_volume"
```

## 🔄 Configuración de Plantillas

### Sistema de Plantillas

```yaml
templates:
  enabled: true
  directory: ".dockronos/templates"

  # Plantillas predefinidas
  registry:
    enabled: true
    sources:
      - "https://raw.githubusercontent.com/athenalink/dockronos-templates/main/registry.yml"

  # Plantillas personalizadas
  custom:
    - name: "mi-stack"
      description: "Mi stack personalizado"
      path: "./templates/mi-stack"

    - name: "microservicio"
      description: "Plantilla de microservicio"
      path: "./templates/microservicio"
```

### Definición de Plantilla

```yaml
# .dockronos/templates/web-app/template.yml
template:
  name: "Aplicación Web"
  description: "Stack completo para aplicación web"
  version: "1.0.0"
  author: "Tu Nombre"

  # Variables de entrada
  variables:
    - name: "app_name"
      description: "Nombre de la aplicación"
      type: "string"
      required: true

    - name: "app_port"
      description: "Puerto de la aplicación"
      type: "number"
      default: 3000

    - name: "database_type"
      description: "Tipo de base de datos"
      type: "choice"
      choices: ["postgres", "mysql", "mongodb"]
      default: "postgres"

# Archivos a generar
files:
  - source: "docker-compose.yml.template"
    destination: "docker-compose.yml"
  - source: "dockronos.yml.template"
    destination: "dockronos.yml"
```

## 🔐 Configuración de Seguridad

### Variables de Entorno Seguras

```yaml
# Usar variables de entorno para datos sensibles
containers:
  - name: "app"
    environment:
      - "DATABASE_URL=${DATABASE_URL}"
      - "API_KEY=${API_KEY}"
      - "JWT_SECRET=${JWT_SECRET}"

# O usar archivos de secretos
secrets:
  database_password:
    file: "./secrets/db_password.txt"
  api_key:
    external: true
    name: "api_key_v1"
```

### Configuración de Permisos

```yaml
containers:
  - name: "secure-app"
    # Usuario no-root
    user: "1000:1000"

    # Solo lectura
    read_only: true

    # Directorios temporales
    tmpfs:
      - "/tmp"
      - "/var/tmp"

    # Configuración de seguridad
    security_opt:
      - "no-new-privileges:true"
      - "apparmor:unconfined"

    # Capabilities mínimas
    cap_drop:
      - "ALL"
    cap_add:
      - "CHOWN"
      - "DAC_OVERRIDE"
```

## 📊 Configuración de Monitoreo

### Métricas y Alertas

```yaml
monitoring:
  enabled: true

  # Configuración de métricas
  metrics:
    collection_interval: 5000
    retention_period: "24h"

    # Exportadores
    exporters:
      prometheus:
        enabled: false
        port: 9090
        path: "/metrics"

      influxdb:
        enabled: false
        url: "http://localhost:8086"
        database: "dockronos"

  # Configuración de alertas
  alerts:
    enabled: true

    # Reglas de alerta
    rules:
      - name: "high_cpu_usage"
        condition: "cpu > 80"
        duration: "5m"
        severity: "warning"

      - name: "container_down"
        condition: "status == 'exited'"
        duration: "1m"
        severity: "critical"

    # Canales de notificación
    channels:
      - type: "slack"
        webhook_url: "${SLACK_WEBHOOK_URL}"
        channel: "#alerts"

      - type: "email"
        smtp_server: "smtp.gmail.com"
        username: "${EMAIL_USERNAME}"
        password: "${EMAIL_PASSWORD}"
        recipients: ["admin@ejemplo.com"]
```

## 🚀 Ejemplos de Configuración

### Aplicación Web Completa

```yaml
# Ejemplo: Stack LEMP (Linux, Nginx, MySQL, PHP)
project:
  name: "Mi App LEMP"
  description: "Aplicación web con stack LEMP"

containers:
  - name: "nginx"
    image: "nginx:alpine"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "./nginx.conf:/etc/nginx/nginx.conf"
      - "./ssl:/etc/nginx/ssl"
      - "./app:/var/www/html"
    depends_on:
      - "php"

  - name: "php"
    image: "php:8.1-fpm-alpine"
    volumes:
      - "./app:/var/www/html"
    environment:
      - "DB_HOST=mysql"
      - "DB_NAME=miapp"
      - "DB_USER=usuario"
      - "DB_PASS=${MYSQL_PASSWORD}"

  - name: "mysql"
    image: "mysql:8.0"
    environment:
      - "MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}"
      - "MYSQL_DATABASE=miapp"
      - "MYSQL_USER=usuario"
      - "MYSQL_PASSWORD=${MYSQL_PASSWORD}"
    volumes:
      - "mysql_data:/var/lib/mysql"
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

### Microservicios

```yaml
# Ejemplo: Arquitectura de microservicios
project:
  name: "Microservicios"

containers:
  - name: "api-gateway"
    build: "./gateway"
    ports:
      - "8080:8080"
    environment:
      - "USER_SERVICE_URL=http://user-service:3001"
      - "ORDER_SERVICE_URL=http://order-service:3002"
    depends_on:
      - "user-service"
      - "order-service"

  - name: "user-service"
    build: "./services/user"
    ports:
      - "3001:3001"
    environment:
      - "DB_URL=postgresql://postgres:password@postgres:5432/users"
    depends_on:
      - "postgres"

  - name: "order-service"
    build: "./services/order"
    ports:
      - "3002:3002"
    environment:
      - "DB_URL=postgresql://postgres:password@postgres:5432/orders"
      - "REDIS_URL=redis://redis:6379"
    depends_on:
      - "postgres"
      - "redis"

  - name: "postgres"
    image: "postgres:15"
    environment:
      - "POSTGRES_PASSWORD=password"
    volumes:
      - "postgres_data:/var/lib/postgresql/data"

  - name: "redis"
    image: "redis:7-alpine"

volumes:
  postgres_data:

networks:
  default:
    driver: bridge
```

## 🔧 Variables de Entorno

### Variables de Sistema

```bash
# Variables de configuración de Dockronos
export DOCKRONOS_CONFIG_PATH="./mi-config.yml"
export DOCKRONOS_ENGINE="podman"
export DOCKRONOS_DEBUG="true"
export DOCKRONOS_LOG_LEVEL="debug"

# Variables de motor de contenedores
export DOCKER_HOST="tcp://localhost:2376"
export DOCKER_TLS_VERIFY="1"
export DOCKER_CERT_PATH="/path/to/certs"

# Variables de interfaz
export DOCKRONOS_THEME="dark"
export DOCKRONOS_REFRESH_INTERVAL="3000"
```

### Archivo .env

```bash
# .env - Variables de entorno del proyecto
NODE_ENV=development
DEBUG=*

# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=myapp

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
API_KEY=tu-api-key-aqui
JWT_SECRET=tu-jwt-secret-super-seguro

# Configuración de aplicación
APP_PORT=3000
APP_HOST=0.0.0.0
```

## ✅ Validación de Configuración

### Verificar Configuración

```bash
# Validar configuración
dockronos validate

# Validar configuración específica
dockronos validate --config mi-config.yml

# Mostrar configuración fusionada
dockronos config show

# Mostrar solo contenedores
dockronos config show --section containers
```

### Errores Comunes

```yaml
# ❌ Incorrecto: puertos como números
ports:
  - 8080:80  # Error: debe ser string

# ✅ Correcto: puertos como strings
ports:
  - "8080:80"

# ❌ Incorrecto: variable sin valor por defecto
environment:
  - "API_KEY=${API_KEY}"  # Error si API_KEY no está definida

# ✅ Correcto: variable con valor por defecto
environment:
  - "API_KEY=${API_KEY:-default-key}"
```

## 📚 Referencias

### Documentación Relacionada
- [Guía de Primeros Pasos](guides/getting-started.md)
- [Referencia CLI](cli-reference.md)
- [Atajos de Teclado](keyboard-shortcuts.md)
- [Solución de Problemas](guides/troubleshooting.md)

### Recursos Externos
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Podman Documentation](https://docs.podman.io/)
- [YAML Specification](https://yaml.org/spec/)

---

*Esta guía de configuración te permite personalizar completamente tu experiencia con Dockronos. Experimenta con diferentes configuraciones para encontrar el flujo de trabajo perfecto para tus proyectos.*