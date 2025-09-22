# Resumen de Arquitectura

Este documento proporciona un resumen completo de la arquitectura de Dockronos, patrones de diseño y organización del sistema. Entender la arquitectura es esencial para contribuidores y desarrolladores que buscan extender o modificar Dockronos.

## 🏗️ Arquitectura de Alto Nivel

Dockronos sigue una arquitectura modular y dirigida por eventos con clara separación de responsabilidades:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Aplicación Dockronos                   │
├─────────────────────────────────────────────────────────────────┤
│                     Capa de Interfaz de Usuario               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  Panel Servicios│ │  Panel Métricas │ │   Panel Logs    │   │
│  │   (Blessed)     │ │   (Blessed)     │ │   (Blessed)     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Capa de Lógica de Aplicación               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Gestor de       │ │    Motor de     │ │  Gestor Git     │   │
│  │ Configuración   │ │  Contenedores   │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │    Gestor de    │ │   Integración   │ │  Recolector de  │   │
│  │   Plantillas    │ │   Registro      │ │    Métricas     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Capa de Infraestructura                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Comandos        │ │  Operaciones    │ │  Comandos Git   │   │
│  │ Docker/Podman   │ │ Sistema Archivos│ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🏛️ Principios de Diseño Central

### 1. Arquitectura Modular
- **Responsabilidad Única**: Cada módulo tiene un propósito claro y enfocado
- **Acoplamiento Débil**: Los módulos interactúan a través de interfaces bien definidas
- **Alta Cohesión**: La funcionalidad relacionada se agrupa junta

### 2. Comunicación Dirigida por Eventos
- **Patrón Observador**: Los componentes se suscriben a eventos que les interesan
- **Operaciones Asíncronas**: Operaciones no bloqueantes para mejor UX
- **Actualizaciones en Tiempo Real**: Streaming de datos en vivo y actualizaciones de UI

### 3. Compatibilidad Multiplataforma
- **Abstracción de Motor**: Docker/Podman a través de interfaz unificada
- **Manejo de Rutas**: Operaciones de sistema de archivos agnósticas a la plataforma
- **Compatibilidad Terminal**: Funciona a través de diferentes emuladores de terminal

### 4. Diseño TypeScript-Primero
- **Tipado Fuerte**: Cobertura de tipos completa
- **Contratos de Interfaz**: Límites de API claros
- **Seguridad en Tiempo de Compilación**: Captura errores antes del tiempo de ejecución

## 📁 Análisis Profundo de Estructura del Proyecto

```
src/
├── index.ts                    # Punto de entrada de aplicación y configuración CLI
├── config/                     # Gestión de configuración
│   └── index.ts               # Carga y validación de configuración YAML
├── engine/                     # Abstracción de motor de contenedores
│   └── index.ts               # Interfaz unificada Docker/Podman
├── env-editor/                 # Gestión de archivos de entorno
│   └── index.ts               # Capacidades de edición de archivos .env
├── git/                        # Gestión de repositorios Git
│   └── index.ts               # Operaciones Git y auto-descubrimiento
├── metrics/                    # Monitoreo de sistema
│   └── index.ts               # Recolección y agregación de métricas
├── registry/                   # Integración de registro de contenedores
│   └── index.ts               # Soporte Docker Hub, GHCR, Quay
├── templates/                  # Plantillas de contenedores
│   ├── index.ts               # Sistema de gestión de plantillas
│   └── definitions/           # Plantillas pre-construidas
│       ├── redis.ts
│       ├── postgres.ts
│       ├── mongo.ts
│       ├── mysql.ts
│       └── nginx.ts
├── types/                      # Definiciones TypeScript
│   ├── index.ts               # Tipos centrales de aplicación
│   ├── git.ts                 # Tipos relacionados con Git
│   ├── registry.ts            # Tipos de registro y plantillas
│   └── blessed.d.ts           # Extensiones de tipos del framework Blessed
├── ui/                         # Interfaz de usuario de terminal
│   ├── index.ts               # Controlador principal de UI y orquestación
│   └── components/            # Componentes de UI
│       ├── services-table.ts  # Panel de gestión de servicios
│       ├── metrics-panel.ts   # Pantalla de métricas del sistema
│       └── logs-panel.ts      # Panel de streaming de logs
└── utils/                      # Utilidades compartidas
    └── index.ts               # Funciones helper comunes
```

## 🔧 Componentes Centrales

### 1. Punto de Entrada de Aplicación (`src/index.ts`)

El punto de entrada principal orquesta toda la aplicación:

```typescript
// Estructura de Comandos CLI
program
  .command('start')      // TUI Interactivo
  .command('init')       // Inicialización de configuración
  .command('list')       // Listado de contenedores
  .command('up/down')    // Gestión de servicios
  .command('logs')       // Visualización de logs
  .command('pull')       // Operaciones de registro de contenedores
  .command('templates')  // Gestión de plantillas
  .command('git')        // Operaciones de repositorio Git
```

**Responsabilidades**:
- Análisis de argumentos CLI con Commander.js
- Enrutamiento y ejecución de comandos
- Manejo de errores y retroalimentación del usuario
- Integración de todos los subsistemas

### 2. Gestor de Configuración (`src/config/`)

Maneja todas las operaciones relacionadas con configuración:

```typescript
export class ConfigManager {
  // Carga y validación de configuración
  async loadConfig(configPath?: string): Promise<ProjectConfig>
  async saveConfig(config?: ProjectConfig): Promise<void>

  // Gestión de servicios
  async addService(service: ServiceConfig): Promise<void>
  async removeService(serviceName: string): Promise<void>
  async updateService(serviceName: string, updates: Partial<ServiceConfig>): Promise<void>

  // Auto-descubrimiento
  async autoDiscoverServices(rootDirectory?: string): Promise<ServiceConfig[]>
}
```

**Características Clave**:
- Análisis y validación de configuración YAML
- Auto-descubrimiento de servicios docker-compose
- Jerarquía de búsqueda de archivos de configuración
- Gestión de configuración de servicios

### 3. Motor de Contenedores (`src/engine/`)

Proporciona interfaz unificada para Docker y Podman:

```typescript
export class ContainerEngineManager {
  // Detección e inicialización de motor
  async initialize(): Promise<void>
  private async detectEngine(): Promise<void>

  // Operaciones de contenedores
  async listContainers(): Promise<ContainerInfo[]>
  async startServices(services: string[], cwd?: string): Promise<void>
  async stopServices(services: string[], cwd?: string): Promise<void>
  async restartServices(services: string[], cwd?: string): Promise<void>

  // Logging y monitoreo
  async getLogs(service?: string, follow?: boolean, cwd?: string): Promise<NodeJS.ReadableStream>
  async getStats(): Promise<string[]>
}
```

**Beneficios de Arquitectura**:
- **Abstracción de Motor**: API única para Docker/Podman
- **Detección Automática**: Descubrimiento de motor en tiempo de ejecución
- **Soporte de Respaldo**: Modo demo cuando no hay motor disponible
- **Mapeo de Comandos**: Traducción de comandos específicos del motor

### 4. Sistema UI (`src/ui/`)

Interfaz de usuario de terminal construida con blessed:

```typescript
export class CronosUI {
  // Ciclo de vida de UI
  async start(): Promise<void>
  destroy(): void

  // Gestión de paneles
  private setFocus(focus: 'services' | 'metrics' | 'logs'): void
  private cycleFocus(): void

  // Manejo de eventos
  private setupKeyBindings(): void
  private setupEventHandlers(): void

  // Gestión de datos
  private async refreshContainers(): Promise<void>
  private async handleServiceAction(action: string, container: ContainerInfo): Promise<void>
}
```

**Arquitectura UI**:
- **Diseño de Tres Paneles**: Servicios, Métricas, Logs
- **Actualizaciones Dirigidas por Eventos**: Actualización de datos en tiempo real
- **Navegación por Teclado**: Sistema eficiente de teclas de acceso rápido
- **Diseño Responsivo**: Se adapta al tamaño del terminal

### 5. Integración Git (`src/git/`)

Gestión de repositorios y descubrimiento de servicios:

```typescript
export class GitManager {
  // Operaciones de repositorio
  async cloneRepository(options: GitCloneOptions): Promise<void>
  async updateRepository(repositoryPath: string): Promise<GitUpdateResult>
  async removeRepository(repositoryPath: string, force?: boolean): Promise<void>

  // Información de repositorio
  async getRepositoryStatus(repositoryPath: string): Promise<GitStatus>
  async listRepositories(): Promise<GitStatus[]>

  // Descubrimiento de servicios
  async autoDiscoverServices(repositoryPath?: string): Promise<ServiceConfig[]>
}
```

**Características Git**:
- **Clonación de Repositorios**: Soporte HTTPS y SSH
- **Gestión de Ramas**: Clonación de ramas específicas
- **Auto-Descubrimiento**: Encontrar servicios docker-compose en repos
- **Seguimiento de Estado**: Adelante/atrás, archivos modificados

### 6. Sistema de Plantillas (`src/templates/`)

Plantillas de contenedores pre-configuradas:

```typescript
export class TemplateManager {
  // Gestión de plantillas
  getTemplate(name: string): ContainerTemplate | undefined
  listTemplates(): ContainerTemplate[]
  searchTemplates(query: string): ContainerTemplate[]
  getTemplatesByCategory(): Record<string, ContainerTemplate[]>

  // Validación de plantillas
  validateTemplate(template: ContainerTemplate): string[]
}
```

**Arquitectura de Plantillas**:
- **Organización por Categorías**: Bases de Datos, Servidores Web, Caché
- **Validación de Configuración**: Variables de entorno requeridas/opcionales
- **Integración de Documentación**: Instrucciones de uso integradas
- **Diseño Extensible**: Fácil agregar nuevas plantillas

### 7. Integración de Registro (`src/registry/`)

Operaciones de registro de contenedores:

```typescript
export class ContainerRegistry {
  // Operaciones de imagen
  async pullImage(image: string, options?: PullOptions): Promise<void>
  async runContainer(options: ContainerRunOptions): Promise<string>
  async searchImages(query: string, limit?: number): Promise<SearchResult[]>
  async listLocalImages(): Promise<ImageInfo[]>

  // Gestión de registro
  addRegistry(name: string, config: RegistryConfig): void
  removeRegistry(name: string): void
}
```

**Características de Registro**:
- **Soporte Multi-Registro**: Docker Hub, GHCR, Quay
- **Búsqueda de Imágenes**: Búsqueda en registro público
- **Integración de Plantillas**: Despliegue de imágenes pre-configuradas
- **Gestión de Imágenes Locales**: Listar y gestionar imágenes locales

### 8. Sistema de Métricas (`src/metrics/`)

Monitoreo de sistema y contenedores:

```typescript
export class MetricsCollector {
  // Recolección de métricas
  async start(): Promise<void>
  stop(): void

  // Acceso a datos
  getSystemMetrics(): SystemMetrics
  getContainerMetrics(): ContainerMetrics[]

  // Sistema de eventos
  onMetricsUpdate(callback: (system: SystemMetrics, containers: ContainerMetrics[]) => void): void
}
```

**Arquitectura de Métricas**:
- **Recolección en Tiempo Real**: Monitoreo continuo
- **Actualizaciones Dirigidas por Eventos**: Patrón observador para actualizaciones de UI
- **Múltiples Fuentes de Datos**: Info del sistema + estadísticas de contenedores
- **Optimización de Rendimiento**: Recolección eficiente de datos

## 🔄 Arquitectura de Flujo de Datos

### 1. Inicio de Aplicación

```
Entrada Usuario → Analizador CLI → Gestor Config → Detección Motor → Inicialización UI
```

1. **Análisis CLI**: Commander.js procesa argumentos
2. **Carga Config**: Configuración YAML cargada y validada
3. **Detección Motor**: Auto-descubrimiento Docker/Podman
4. **Configuración UI**: Inicialización de interfaz Blessed
5. **Carga Datos**: Datos iniciales de contenedores y métricas

### 2. Operaciones Interactivas

```
Entrada Usuario → Evento UI → Manejador Acción → Motor/Gestor → Actualización Datos → Actualización UI
```

1. **Entrada Teclado**: Blessed captura y rutea eventos de teclas
2. **Mapeo Acción**: Eventos de teclas mapeados a acciones de aplicación
3. **Lógica Negocio**: Gestor apropiado maneja la operación
4. **Comandos Externos**: Comandos Docker/Podman/Git ejecutados
5. **Actualizaciones UI**: Interfaz refrescada con nuevos datos

### 3. Actualizaciones en Tiempo Real

```
Temporizador → Recolección Métricas → Emisión Evento → Actualización UI
Proceso Segundo Plano → Stream Log → Emisión Evento → Actualización UI
```

1. **Actualizaciones Programadas**: Refresco periódico de datos
2. **Procesamiento Stream**: Streams de log y métricas en tiempo real
3. **Sistema Eventos**: Patrón observador para comunicación de componentes
4. **Renderizado UI**: Blessed re-renderiza componentes afectados

## 🎛️ Arquitectura del Sistema de Eventos

Dockronos usa una arquitectura dirigida por eventos para acoplamiento débil:

### Eventos Centrales

```typescript
// Eventos del sistema
interface SystemEvents {
  'metrics-update': (system: SystemMetrics, containers: ContainerMetrics[]) => void
  'container-state-change': (container: ContainerInfo) => void
  'config-reload': (config: ProjectConfig) => void
}

// Eventos UI
interface UIEvents {
  'service-select': (container: ContainerInfo) => void
  'service-action': (action: string, container: ContainerInfo) => void
  'panel-focus': (panel: string) => void
}

// Eventos Git
interface GitEvents {
  'repository-cloned': (path: string) => void
  'repository-updated': (result: GitUpdateResult) => void
  'services-discovered': (services: ServiceConfig[]) => void
}
```

### Ejemplo de Flujo de Eventos

```
Usuario presiona 'S' → UI captura tecla → Emite evento 'service-action' →
ContainerEngine recibe evento → Ejecuta docker compose up →
Emite 'container-state-change' → UI recibe evento → Actualiza pantalla
```

## 🔧 Puntos de Extensión

La arquitectura proporciona varios puntos de extensión para personalización:

### 1. Plantillas Personalizadas

```typescript
// Agregar plantilla personalizada
const customTemplate: ContainerTemplate = {
  name: 'mi-servicio-personalizado',
  description: 'Plantilla de servicio personalizada',
  category: 'personalizada',
  image: 'micompania/miservicio:latest',
  // ... configuración
}

templateManager.addTemplate(customTemplate)
```

### 2. Comandos Personalizados

```typescript
// Agregar comando CLI personalizado
program
  .command('accion-personalizada')
  .description('Mi acción personalizada')
  .action(async () => {
    // Lógica personalizada
  })
```

### 3. Extensiones UI

```typescript
// Panel UI personalizado
class CustomPanel extends blessed.Box {
  constructor(options: any) {
    super(options)
    this.setupCustomPanel()
  }

  private setupCustomPanel() {
    // Lógica de panel personalizada
  }
}
```

### 4. Soporte de Motor Personalizado

```typescript
// Motor de contenedores personalizado
class CustomEngine implements ContainerEngineInterface {
  async initialize(): Promise<void> { /* */ }
  async listContainers(): Promise<ContainerInfo[]> { /* */ }
  // ... implementar interfaz
}
```

## 🧪 Arquitectura de Pruebas

### Estructura de Pruebas

```
test/
├── unit/                       # Pruebas unitarias
│   ├── config/
│   ├── engine/
│   ├── git/
│   └── templates/
├── integration/                # Pruebas de integración
│   ├── container-operations/
│   ├── git-workflows/
│   └── ui-interactions/
└── e2e/                       # Pruebas de extremo a extremo
    ├── full-workflows/
    └── cross-platform/
```

### Patrones de Prueba

1. **Pruebas Unitarias**: Mock de dependencias externas
2. **Pruebas de Integración**: Probar interacciones de componentes
3. **Pruebas E2E**: Flujos de trabajo de aplicación completa
4. **Pruebas UI**: Pruebas de interfaz de terminal

## 🔒 Consideraciones de Seguridad

### 1. Prevención de Inyección de Comandos

```typescript
// Ejecución segura de comandos
const sanitizeInput = (input: string): string => {
  return input.replace(/[;&|`$]/g, '')
}

// Comandos parametrizados
const { stdout } = await execAsync(`docker ps --format "${format}"`)
```

### 2. Protección contra Path Traversal

```typescript
// Resolución segura de rutas
const safePath = path.resolve(path.join(basePath, userInput))
if (!safePath.startsWith(basePath)) {
  throw new Error('Ruta inválida')
}
```

### 3. Sanitización de Variables de Entorno

```typescript
// Sanitizar variables de entorno
const sanitizeEnvVar = (value: string): string => {
  return value.replace(/[\n\r\0]/g, '')
}
```

## 🚀 Optimizaciones de Rendimiento

### 1. Carga Perezosa

```typescript
// Inicialización perezosa de componentes
class LazyComponent {
  private _component?: RealComponent

  get component(): RealComponent {
    if (!this._component) {
      this._component = new RealComponent()
    }
    return this._component
  }
}
```

### 2. Actualizaciones con Debounce

```typescript
// Debounce de actualizaciones frecuentes
const debouncedRefresh = debounce(async () => {
  await this.refreshContainers()
}, 1000)
```

### 3. Estructuras de Datos Eficientes

```typescript
// Usar Maps para búsquedas O(1)
const containerMap = new Map<string, ContainerInfo>()

// Usar Sets para colecciones únicas
const runningContainers = new Set<string>()
```

### 4. Procesamiento de Streams

```typescript
// Procesar logs como streams
const logStream = await containerEngine.getLogs(serviceName, true)
logStream.on('data', (chunk: Buffer) => {
  // Procesar chunk incrementalmente
})
```

## 🔮 Consideraciones de Arquitectura Futura

### 1. Sistema de Plugins

```typescript
interface Plugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy(): Promise<void>
}

class PluginManager {
  loadPlugin(plugin: Plugin): void
  unloadPlugin(name: string): void
}
```

### 2. Operaciones Remotas

```typescript
interface RemoteEngine {
  connect(host: string, credentials: Credentials): Promise<void>
  disconnect(): Promise<void>
}
```

### 3. Plantillas de Configuración

```typescript
interface ConfigTemplate {
  name: string
  variables: VariableDefinition[]
  generate(values: Record<string, any>): ProjectConfig
}
```

### 4. Métricas Avanzadas

```typescript
interface MetricsStore {
  saveMetrics(metrics: SystemMetrics): Promise<void>
  queryMetrics(timeRange: TimeRange): Promise<SystemMetrics[]>
  getAlerts(): Promise<Alert[]>
}
```

## 📚 Recursos Adicionales

### Patrones de Arquitectura Utilizados

1. **Patrón MVC**: Separación de UI, lógica y datos
2. **Patrón Observador**: Comunicación dirigida por eventos
3. **Patrón Estrategia**: Soporte de múltiples motores de contenedores
4. **Patrón Factory**: Creación de plantillas y componentes
5. **Patrón Singleton**: Gestores globales y configuración

### Dependencias Externas

| Dependencia | Propósito | Impacto en Arquitectura |
|-------------|-----------|------------------------|
| blessed | Framework UI de terminal | Fundación de capa UI |
| blessed-contrib | Componentes UI adicionales | Componentes UI mejorados |
| commander | Análisis CLI | Enrutamiento de comandos |
| yaml | Análisis de configuración | Soporte de formato config |
| systeminformation | Métricas del sistema | Fuente de datos de métricas |
| chalk | Colores de terminal | Formato de salida |

### Decisiones de Diseño

1. **TypeScript sobre JavaScript**: Seguridad de tipos y mejor soporte IDE
2. **blessed sobre alternativas**: Framework UI de terminal maduro y estable
3. **YAML sobre JSON**: Formato de configuración legible por humanos
4. **Arquitectura dirigida por eventos**: Acoplamiento débil y actualizaciones en tiempo real
5. **Diseño modular**: Mantenibilidad y facilidad de prueba

---

*Esta documentación de arquitectura se mantiene junto con la base de código. Para detalles de implementación, consulte la sección [Documentación de Componentes](../components/).*