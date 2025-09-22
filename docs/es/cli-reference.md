# Referencia CLI

Referencia completa de la interfaz de línea de comandos para Dockronos. Todos los comandos pueden ejecutarse desde el terminal para gestionar contenedores, repositorios y configuración.

## 📋 Resumen de Comandos

```bash
dockronos [comando] [opciones]
```

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `start` | Iniciar la TUI interactiva (por defecto) |
| `init` | Inicializar configuración de Dockronos |
| `list` | Listar todos los contenedores |
| `up` | Iniciar servicios |
| `down` | Detener servicios |
| `restart` | Reiniciar servicios |
| `logs` | Mostrar logs de un servicio |
| `pull` | Descargar y ejecutar una imagen de contenedor |
| `templates` | Listar plantillas de contenedores disponibles |
| `search` | Buscar imágenes de contenedores |
| `images` | Listar imágenes de contenedores locales |
| `git` | Gestión de repositorios Git |
| `help` | Mostrar ayuda para un comando |

## 🚀 Comandos Principales

### `dockronos` / `dockronos start`

Iniciar la Interfaz de Usuario de Terminal interactiva.

```bash
# Iniciar con configuración por defecto
dockronos
dockronos start

# Usar archivo de configuración personalizado
dockronos start --config ./custom.yml
dockronos start -c ./environments/production.yml

# Iniciar en modo debug
dockronos start --debug

# Ejecución en seco (validar config sin iniciar)
dockronos start --dry-run
```

**Opciones:**
- `-c, --config <ruta>` - Ruta al archivo de configuración
- `--debug` - Habilitar logging de debug
- `--dry-run` - Validar configuración sin iniciar
- `--no-color` - Deshabilitar salida con colores
- `--log-level <nivel>` - Establecer nivel de log (debug, info, warn, error)

**Ejemplos:**
```bash
# Uso básico
dockronos

# Entorno de producción
dockronos start -c ./config/production.yml

# Debug de problemas de inicio
dockronos start --debug --log-level debug

# Validar configuración
dockronos start --dry-run
```

### `dockronos init`

Inicializar configuración de Dockronos en el directorio actual.

```bash
# Crear configuración básica
dockronos init

# Auto-descubrir servicios
dockronos init --auto-discover

# Validar configuración existente
dockronos init --validate

# Forzar sobrescritura de config existente
dockronos init --force
```

**Opciones:**
- `--auto-discover` - Descubrir automáticamente servicios en subdirectorios
- `--validate` - Validar archivo de configuración existente
- `--force` - Sobrescribir archivo de configuración existente
- `--template <nombre>` - Usar plantilla de configuración
- `--output <ruta>` - Ruta del archivo de salida (por defecto: dockronos.yml)

**Ejemplos:**
```bash
# Inicializar con auto-descubrimiento
dockronos init --auto-discover

# Usar plantilla específica
dockronos init --template web-app

# Crear configuración personalizada
dockronos init --output ./config/dockronos.yml
```

## 🐳 Gestión de Contenedores

### `dockronos list`

Listar todos los contenedores disponibles.

```bash
# Listar todos los contenedores
dockronos list

# Mostrar solo contenedores en ejecución
dockronos list --running

# Mostrar contenedores detenidos
dockronos list --stopped

# Formato de salida personalizado
dockronos list --format table
dockronos list --format json
```

**Opciones:**
- `--running` - Mostrar solo contenedores en ejecución
- `--stopped` - Mostrar solo contenedores detenidos
- `--all` - Mostrar todos los contenedores (por defecto)
- `--format <formato>` - Formato de salida (table, json, yaml)
- `--quiet` - Mostrar solo IDs de contenedores

**Ejemplos:**
```bash
# Ver contenedores ejecutándose
dockronos list --running

# Exportar lista en JSON
dockronos list --format json > containers.json

# Solo nombres de contenedores
dockronos list --quiet
```

### `dockronos up`

Iniciar servicios definidos en la configuración.

```bash
# Iniciar todos los servicios
dockronos up

# Iniciar servicios específicos
dockronos up web database

# Iniciar en segundo plano
dockronos up --detach

# Forzar recreación de contenedores
dockronos up --force-recreate
```

**Opciones:**
- `-d, --detach` - Ejecutar en segundo plano
- `--force-recreate` - Recrear contenedores aunque no hayan cambiado
- `--no-deps` - No iniciar servicios dependientes
- `--build` - Construir imágenes antes de iniciar
- `--timeout <segundos>` - Timeout para operaciones de inicio

**Ejemplos:**
```bash
# Iniciar stack completo
dockronos up

# Solo base de datos y caché
dockronos up database redis

# Construir e iniciar
dockronos up --build

# Inicio rápido sin dependencias
dockronos up web --no-deps
```

### `dockronos down`

Detener y remover servicios.

```bash
# Detener todos los servicios
dockronos down

# Detener servicios específicos
dockronos down web api

# Remover volúmenes también
dockronos down --volumes

# Remover imágenes órfanas
dockronos down --remove-orphans
```

**Opciones:**
- `-v, --volumes` - Remover volúmenes nombrados
- `--remove-orphans` - Remover contenedores para servicios no definidos
- `--rmi <tipo>` - Remover imágenes (all, local)
- `--timeout <segundos>` - Timeout para operaciones de parada

**Ejemplos:**
```bash
# Detener todo incluyendo volúmenes
dockronos down --volumes

# Limpieza completa
dockronos down --volumes --remove-orphans --rmi all
```

### `dockronos restart`

Reiniciar servicios.

```bash
# Reiniciar todos los servicios
dockronos restart

# Reiniciar servicios específicos
dockronos restart web api

# Reinicio con timeout personalizado
dockronos restart --timeout 30
```

**Opciones:**
- `--timeout <segundos>` - Timeout para operaciones de reinicio
- `--force` - Forzar reinicio aunque el servicio esté saludable

**Ejemplos:**
```bash
# Reinicio rápido
dockronos restart web

# Reinicio con timeout largo
dockronos restart database --timeout 60
```

## 📝 Gestión de Logs

### `dockronos logs`

Mostrar logs de servicios.

```bash
# Ver logs de un servicio
dockronos logs web

# Seguir logs en tiempo real
dockronos logs web --follow

# Ver últimas 100 líneas
dockronos logs web --tail 100

# Ver logs de múltiples servicios
dockronos logs web api database
```

**Opciones:**
- `-f, --follow` - Seguir salida de logs
- `--tail <líneas>` - Número de líneas desde el final
- `--since <timestamp>` - Mostrar logs desde timestamp
- `--until <timestamp>` - Mostrar logs hasta timestamp
- `--timestamps` - Mostrar timestamps
- `--no-color` - Deshabilitar colores

**Ejemplos:**
```bash
# Seguir logs de aplicación web
dockronos logs web --follow --tail 50

# Logs de las últimas 2 horas
dockronos logs api --since 2h

# Logs con timestamps
dockronos logs database --timestamps

# Todos los logs sin colores
dockronos logs --no-color
```

## 🖼️ Gestión de Imágenes

### `dockronos pull`

Descargar y ejecutar imágenes de contenedores.

```bash
# Descargar imagen específica
dockronos pull nginx:alpine

# Ejecutar imagen inmediatamente
dockronos pull nginx:alpine --run

# Descargar con configuración personalizada
dockronos pull postgres:15 --env POSTGRES_PASSWORD=secret
```

**Opciones:**
- `--run` - Ejecutar imagen después de descargar
- `--name <nombre>` - Nombre para el contenedor
- `--port <puertos>` - Mapeo de puertos
- `--env <variables>` - Variables de entorno
- `--volume <volúmenes>` - Montajes de volúmenes

**Ejemplos:**
```bash
# Nginx con puerto personalizado
dockronos pull nginx:alpine --run --port 8080:80 --name mi-nginx

# PostgreSQL con variables de entorno
dockronos pull postgres:15 --run --env POSTGRES_PASSWORD=secret --env POSTGRES_DB=miapp
```

### `dockronos images`

Listar imágenes de contenedores locales.

```bash
# Listar todas las imágenes
dockronos images

# Mostrar solo nombres de imágenes
dockronos images --quiet

# Filtrar por repositorio
dockronos images --filter reference=nginx
```

**Opciones:**
- `-q, --quiet` - Mostrar solo IDs de imágenes
- `--filter <filtro>` - Filtrar imágenes
- `--format <formato>` - Formato de salida
- `--no-trunc` - No truncar salida

**Ejemplos:**
```bash
# Ver imágenes de PostgreSQL
dockronos images --filter reference=postgres

# Exportar lista de imágenes
dockronos images --format json > images.json
```

### `dockronos search`

Buscar imágenes de contenedores en registros.

```bash
# Buscar imágenes de nginx
dockronos search nginx

# Buscar con límite de resultados
dockronos search postgres --limit 10

# Buscar solo imágenes oficiales
dockronos search redis --filter is-official=true
```

**Opciones:**
- `--limit <número>` - Limitar número de resultados
- `--filter <filtro>` - Filtrar resultados
- `--no-trunc` - No truncar descripciones

**Ejemplos:**
```bash
# Buscar imágenes de Node.js oficiales
dockronos search node --filter is-official=true

# Buscar con muchos resultados
dockronos search python --limit 25
```

## 📋 Sistema de Plantillas

### `dockronos templates`

Gestionar plantillas de contenedores.

```bash
# Listar plantillas disponibles
dockronos templates list

# Información de una plantilla
dockronos templates info web-app

# Usar una plantilla
dockronos templates use web-app

# Instalar plantilla externa
dockronos templates install https://github.com/usuario/plantilla.git
```

**Subcomandos:**
- `list` - Listar plantillas disponibles
- `info <nombre>` - Mostrar información de plantilla
- `use <nombre>` - Usar plantilla en directorio actual
- `install <url>` - Instalar plantilla desde URL
- `remove <nombre>` - Remover plantilla instalada

**Ejemplos:**
```bash
# Ver plantillas disponibles
dockronos templates list

# Usar plantilla de microservicio
dockronos templates use microservice --name mi-servicio

# Instalar plantilla personalizada
dockronos templates install https://github.com/miusuario/mi-plantilla.git
```

## 🔗 Integración Git

### `dockronos git`

Gestionar repositorios Git y servicios.

```bash
# Clonar y configurar repositorio
dockronos git clone https://github.com/usuario/proyecto.git

# Actualizar repositorio y servicios
dockronos git pull

# Listar repositorios gestionados
dockronos git list

# Estado de repositorios
dockronos git status
```

**Subcomandos:**
- `clone <url>` - Clonar repositorio y auto-configurar
- `pull` - Actualizar repositorio y reiniciar servicios si es necesario
- `list` - Listar repositorios gestionados
- `status` - Mostrar estado de repositorios
- `add <ruta>` - Agregar repositorio existente
- `remove <nombre>` - Remover repositorio de gestión

**Opciones:**
- `--auto-start` - Iniciar servicios después de clonar/actualizar
- `--branch <rama>` - Especificar rama
- `--depth <profundidad>` - Clonar con profundidad limitada

**Ejemplos:**
```bash
# Clonar e iniciar servicios automáticamente
dockronos git clone https://github.com/usuario/proyecto.git --auto-start

# Actualizar y reiniciar servicios
dockronos git pull --auto-start

# Clonar rama específica
dockronos git clone https://github.com/usuario/proyecto.git --branch develop
```

## ⚙️ Comandos de Configuración

### `dockronos config`

Gestionar configuración de Dockronos.

```bash
# Mostrar configuración actual
dockronos config show

# Validar configuración
dockronos config validate

# Editar configuración
dockronos config edit

# Exportar configuración
dockronos config export --format yaml
```

**Subcomandos:**
- `show` - Mostrar configuración fusionada
- `validate` - Validar configuración actual
- `edit` - Abrir configuración en editor
- `export` - Exportar configuración
- `set <clave> <valor>` - Establecer valor de configuración
- `get <clave>` - Obtener valor de configuración

**Ejemplos:**
```bash
# Ver configuración de motor
dockronos config get engine

# Cambiar motor preferido
dockronos config set engine.preferred podman

# Exportar en JSON
dockronos config export --format json > config.json
```

## 🔧 Comandos de Utilidad

### `dockronos version`

Mostrar información de versión.

```bash
# Versión básica
dockronos version

# Información detallada
dockronos version --verbose

# Solo número de versión
dockronos version --short
```

### `dockronos doctor`

Diagnosticar problemas del sistema.

```bash
# Diagnóstico completo
dockronos doctor

# Verificar solo motor de contenedores
dockronos doctor --engine-only

# Verificar configuración
dockronos doctor --config-only
```

### `dockronos help`

Mostrar ayuda para comandos.

```bash
# Ayuda general
dockronos help

# Ayuda para comando específico
dockronos help start
dockronos help init

# Ayuda para subcomando
dockronos help git clone
```

## 🌍 Variables de Entorno

### Variables de Configuración

```bash
# Configuración de Dockronos
export DOCKRONOS_CONFIG_PATH="./mi-config.yml"
export DOCKRONOS_ENGINE="podman"
export DOCKRONOS_DEBUG="true"
export DOCKRONOS_LOG_LEVEL="debug"

# Configuración de terminal
export DOCKRONOS_NO_COLOR="true"
export DOCKRONOS_FORCE_COLOR="true"
```

### Variables de Motor de Contenedores

```bash
# Docker
export DOCKER_HOST="tcp://localhost:2376"
export DOCKER_TLS_VERIFY="1"
export DOCKER_CERT_PATH="/path/to/certs"

# Podman
export PODMAN_SOCKET_PATH="/run/user/1000/podman/podman.sock"
```

## 📤 Códigos de Salida

| Código | Descripción |
|--------|-------------|
| 0 | Éxito |
| 1 | Error general |
| 2 | Error de configuración |
| 3 | Motor de contenedores no encontrado |
| 4 | Error de permisos |
| 5 | Archivo no encontrado |
| 130 | Interrumpido por usuario (Ctrl+C) |

## 📚 Ejemplos de Flujos de Trabajo

### Configuración Inicial de Proyecto

```bash
# 1. Crear directorio de proyecto
mkdir mi-proyecto && cd mi-proyecto

# 2. Inicializar con auto-descubrimiento
dockronos init --auto-discover

# 3. Verificar configuración
dockronos config validate

# 4. Iniciar servicios
dockronos up

# 5. Abrir interfaz interactiva
dockronos
```

### Desarrollo Diario

```bash
# Iniciar servicios de desarrollo
dockronos up --build

# Ver logs en tiempo real
dockronos logs app --follow

# Reiniciar después de cambios
dockronos restart app

# Limpiar al final del día
dockronos down --volumes
```

### Debugging

```bash
# Iniciar en modo debug
dockronos start --debug --log-level debug

# Verificar estado del sistema
dockronos doctor

# Ver configuración efectiva
dockronos config show

# Logs detallados
dockronos logs app --timestamps --since 1h
```

---

*Esta referencia CLI te permite aprovechar al máximo las capacidades de Dockronos desde la línea de comandos. Combina estos comandos con la interfaz TUI para un flujo de trabajo eficiente.*