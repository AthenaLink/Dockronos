# Arquitectura del Sistema UI

La interfaz de usuario de Dockronos está construida sobre el framework de UI de terminal blessed.js, proporcionando una experiencia rica e interactiva en la terminal. Este documento detalla la arquitectura completa de UI, sistema de componentes y patrones de implementación.

## 🏗️ Arquitectura General

### Sistema de Diseño de Tres Paneles

Dockronos utiliza un sofisticado diseño de tres paneles que maximiza la eficiencia del espacio del terminal:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Diseño UI Dockronos                    │
├─────────────────────────────────────────────────────────────────┤
│ Panel Servicios (60%)        │ Panel Métricas (40%)             │
│ ┌─ Gestión Contenedores ───┐ │ ┌─ Métricas Sistema ─────────────┐ │
│ │ ▶ web-frontend   [UP]    │ │ │ CPU:  [████████░░] 85%       │ │
│ │   api-backend   [UP]     │ │ │ RAM:  [██████░░░░] 65%       │ │
│ │   database    [DOWN]     │ │ │ DISCO:[███░░░░░░░] 32%       │ │
│ │ ▶ redis-cache   [UP]     │ │ └─────────────────────────────────┘ │
│ │                          │ │ ┌─ Recursos Contenedores ─────┐ │
│ │ Acciones:                │ │ │ web-frontend:               │ │
│ │ S-Iniciar  X-Detener     │ │ │   CPU: 15%  RAM: 128MB      │ │
│ │ R-Reiniciar D-Logs       │ │ │ api-backend:                │ │
│ │ E-Editar Entorno         │ │ │   CPU: 8%   RAM: 96MB       │ │
│ └───────────────────────────┘ │ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Panel Logs (25% altura)                                       │
│ ┌─ Logs: web-frontend ────────────────────────────────────────┐ │
│ │ 2024-01-15 10:30:15 [INFO] Servidor iniciando en puerto 3000│ │
│ │ 2024-01-15 10:30:16 [INFO] Conectado a base de datos       │ │
│ │ 2024-01-15 10:30:17 [INFO] Aplicación lista ▼             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Barra Estado: Listo | Motor: Docker | Presiona ? para ayuda   │
└─────────────────────────────────────────────────────────────────┘
```

### Especificaciones de Diseño

| Panel | Dimensiones | Propósito |
|-------|-------------|-----------|
| **Panel Servicios** | 60% ancho, 70% altura | Gestión y control de contenedores |
| **Panel Métricas** | 40% ancho, 70% altura | Monitoreo de sistema y contenedores |
| **Panel Logs** | 100% ancho, 25% altura | Streaming y análisis de logs |
| **Barra Estado** | 100% ancho, 5% altura | Estado de aplicación y ayuda |

## 🎛️ Arquitectura de Componentes

### Controlador Principal UI (`CronosUI`)

El orquestador central que gestiona todos los componentes UI y sus interacciones:

```typescript
export class CronosUI {
  private screen: blessed.Widgets.Screen;
  private servicesTable: ServicesTable;
  private metricsPanel: MetricsPanel;
  private logsPanel: LogsPanel;
  private statusBar: blessed.Widgets.BoxElement;
  private helpText: blessed.Widgets.BoxElement;

  private currentFocus: 'services' | 'metrics' | 'logs' = 'services';
  private containers: ContainerInfo[] = [];
  private refreshInterval: NodeJS.Timeout | undefined;
}
```

**Responsabilidades Clave**:
- **Ciclo de Vida de Componentes**: Inicializar, actualizar y destruir componentes UI
- **Coordinación de Eventos**: Gestionar comunicación entre componentes
- **Gestión de Foco**: Controlar qué panel recibe entrada de teclado
- **Orquestación de Datos**: Coordinar flujo de datos entre backend y UI
- **Acciones Globales**: Manejar operaciones a nivel de aplicación (salir, refrescar, ayuda)

### Gestión de Pantalla

#### Configuración de Pantalla Blessed
```typescript
this.screen = blessed.screen({
  smartCSR: true,              // Guardado/restauración inteligente del cursor
  title: 'Dockronos - Gestión de Contenedores',
  cursor: {
    artificial: true,          // Cursor artificial para mejor control
    shape: 'line',            // Estilo de cursor de línea
    blink: true,              // Cursor parpadeante
    color: 'white',           // Color del cursor
  },
  debug: false,               // Deshabilitar modo debug para producción
});
```

**Características de Pantalla**:
- **Smart CSR**: Renderizado optimizado con guardado/restauración de cursor
- **Diseño Responsivo**: Adaptación automática al redimensionamiento del terminal
- **Multiplataforma**: Funciona en terminales Linux, macOS, Windows
- **Soporte de Color**: Compatibilidad con terminal de 256 colores

### Flujo de Inicialización de Componentes

```
1. Creación Pantalla → 2. Configuración Diseño → 3. Instanciación Componentes
       ↓                    ↓                     ↓
4. Enlace Eventos → 5. Carga Datos → 6. Renderizado y Foco
```

#### Proceso Detallado de Inicialización

```typescript
async start(): Promise<void> {
  try {
    // 1. Inicializar configuración
    await configManager.loadConfig();

    // 2. Inicializar motor de contenedores
    await containerEngine.initialize();

    // 3. Iniciar recolección de métricas
    await metricsCollector.start();

    // 4. Carga inicial de datos
    await this.refreshContainers();

    // 5. Configurar intervalo de refresco
    this.refreshInterval = setInterval(() => {
      this.refreshContainers();
    }, 5000);

    // 6. Establecer foco inicial y renderizar
    this.setFocus('services');
    this.screen.render();
  } catch (error) {
    this.handleStartupError(error);
  }
}
```

## ⌨️ Arquitectura del Sistema de Eventos

### Enlace de Teclas Global

La UI implementa un sistema jerárquico de enlace de teclas:

```typescript
private setupKeyBindings(): void {
  // Controles globales de aplicación
  this.screen.key(['q', 'C-c'], () => this.quit());
  this.screen.key(['?'], () => this.toggleHelp());
  this.screen.key(['tab'], () => this.cycleFocus());
  this.screen.key(['F5', 'r'], () => this.refreshData());

  // Atajos de navegación de paneles
  this.screen.key(['1'], () => this.setFocus('services'));
  this.screen.key(['2'], () => this.setFocus('metrics'));
  this.screen.key(['3'], () => this.setFocus('logs'));

  // Acciones sensibles al contexto
  this.screen.key(['escape'], () => this.handleEscape());
}
```

### Arquitectura de Flujo de Eventos

```
Entrada Usuario → Captura Tecla → Enrutador Evento → Manejador Componente → Ejecución Acción
     ↓            ↓            ↓               ↓                ↓
Terminal → Blessed.js → CronosUI → Componente Panel → Servicio Backend
```

#### Sistema de Prioridad de Eventos

1. **Eventos Globales**: Atajos a nivel de aplicación (salir, ayuda, refrescar)
2. **Eventos de Navegación**: Cambio de paneles y gestión de foco
3. **Eventos de Componentes**: Acciones específicas de panel (iniciar servicio, desplazar logs)
4. **Eventos Contextuales**: Atajos sensibles al contexto basados en estado actual

### Comunicación Entre Componentes

#### Implementación del Patrón Observador

```typescript
// Eventos de selección de servicios
this.servicesTable.onServiceSelect = (container: ContainerInfo) => {
  this.updateStatusBar(`Seleccionado: ${container.name} (${container.status})`);
  this.metricsPanel.highlightContainer(container.id);
};

// Eventos de acción de servicios
this.servicesTable.onServiceAction = async (action: string, container: ContainerInfo) => {
  await this.handleServiceAction(action, container);
  this.logsPanel.addLogEntry({
    timestamp: new Date(),
    service: container.name,
    message: `Acción de servicio ${action} completada`,
    level: 'info'
  });
};

// Eventos de actualización de métricas
metricsCollector.onMetricsUpdate((system: SystemMetrics, containers: ContainerMetrics[]) => {
  this.metricsPanel.updateSystemMetrics(system);
  this.metricsPanel.updateContainerMetrics(containers);
});
```

## 🔄 Sistema de Actualización en Tiempo Real

### Arquitectura de Flujo de Datos

```
Sistemas Externos → Recolectores Datos → Emisores Eventos → Componentes UI → Renderizado
      ↓                ↓                ↓               ↓            ↓
Docker/Podman → Motor Contenedores → Eventos Servicio → Tabla Servicios → Pantalla
Info Sistema → Recolector Métricas → Eventos Métricas → Panel Métricas → Pantalla
Streams Log → Procesador Log → Eventos Log → Panel Logs → Pantalla
```

### Coordinación de Actualizaciones

#### Gestor de Actualización Centralizado

```typescript
private async refreshContainers(): Promise<void> {
  try {
    // Obtener datos más recientes de contenedores
    this.containers = await containerEngine.listContainers();

    // Actualizar tabla de servicios
    this.servicesTable.updateContainers(this.containers);

    // Actualizar barra de estado
    const runningCount = this.containers.filter(c => c.status === 'running').length;
    this.updateStatusBar(`${runningCount}/${this.containers.length} contenedores ejecutándose`);

    // Disparar renderizado de pantalla
    this.screen.render();
  } catch (error) {
    this.handleRefreshError(error);
  }
}
```

#### Estrategia de Renderizado Optimizada

- **Actualizaciones Selectivas**: Solo re-renderizar componentes cambiados
- **Renderizado por Lotes**: Agrupar múltiples actualizaciones en un ciclo de renderizado único
- **Actualizaciones Limitadas**: Limitar frecuencia de actualización para prevenir lag de UI
- **Gestión de Memoria**: Limpiar datos antiguos para prevenir fugas de memoria

### Optimizaciones de Rendimiento

#### Limitación de Actualizaciones
```typescript
private debouncedRefresh = debounce(async () => {
  await this.refreshContainers();
}, 1000);
```

#### Renderizado Perezoso
```typescript
private renderIfVisible(component: UIComponent): void {
  if (component.isVisible() && component.isDirty()) {
    component.render();
    component.markClean();
  }
}
```

## 🎨 Sistema de Diseño Visual

### Esquema de Colores

#### Mapeo de Colores de Estado
```typescript
private getStatusColor(status: ContainerInfo['status']): string {
  switch (status) {
    case 'running': return 'green';      // Servicios activos
    case 'stopped': return 'red';        // Servicios inactivos
    case 'paused': return 'yellow';      // Servicios suspendidos
    case 'restarting': return 'cyan';    // Servicios en transición
    case 'dead': return 'magenta';       // Servicios fallidos
    default: return 'white';             // Estado desconocido
  }
}
```

#### Colores de Elementos UI
- **Bordes**: Verde (#00ff00) para paneles activos
- **Encabezados**: Azul para títulos de sección
- **Texto**: Blanco para contenido primario
- **Resaltados**: Fondo azul para selecciones
- **Estado**: Codificado por colores basado en estado del servicio

### Tipografía y Diseño

#### Formato de Texto
```typescript
// Encabezados en negrita
`{bold}Nombre Servicio{/bold}`

// Estado codificado por colores
`{${statusColor}-fg}${status}{/${statusColor}-fg}`

// Texto truncado con puntos suspensivos
private truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
```

#### Diseño Responsivo

La UI se adapta automáticamente a diferentes tamaños de terminal:

```typescript
// Anchos de columna dinámicos
const nameWidth = Math.floor(this.widget.width * 0.3);
const statusWidth = Math.floor(this.widget.width * 0.15);
const imageWidth = Math.floor(this.widget.width * 0.25);

// Restricciones de tamaño mínimo
const minWidth = 80;  // Ancho mínimo de terminal
const minHeight = 24; // Altura mínima de terminal
```

## 🔧 Sistema de Gestión de Foco

### Estados de Foco

```typescript
type FocusState = 'services' | 'metrics' | 'logs';

private setFocus(focus: FocusState): void {
  // Limpiar foco anterior
  this.clearAllFocus();

  // Establecer nuevo foco
  switch (focus) {
    case 'services':
      this.servicesTable.focus();
      this.highlightPanel(this.servicesTable.widget);
      break;
    case 'metrics':
      this.metricsPanel.focus();
      this.highlightPanel(this.metricsPanel.widget);
      break;
    case 'logs':
      this.logsPanel.focus();
      this.highlightPanel(this.logsPanel.widget);
      break;
  }

  this.currentFocus = focus;
  this.updateStatusBar(`Foco: ${focus.charAt(0).toUpperCase() + focus.slice(1)}`);
}
```

### Navegación de Foco

#### Ciclado por Tab
```typescript
private cycleFocus(): void {
  const focusOrder: FocusState[] = ['services', 'metrics', 'logs'];
  const currentIndex = focusOrder.indexOf(this.currentFocus);
  const nextIndex = (currentIndex + 1) % focusOrder.length;
  this.setFocus(focusOrder[nextIndex]);
}
```

#### Navegación Directa
- **Teclado**: Teclas numéricas (1, 2, 3) para acceso directo a paneles
- **Ratón**: Clic para enfocar (cuando soporte de ratón está habilitado)
- **Contexto**: Tecla Escape regresa al panel de servicios

### Indicadores Visuales de Foco

```typescript
private highlightPanel(widget: blessed.Widgets.BoxElement): void {
  // Resaltar borde del panel activo
  widget.style.border.fg = '#00ff00';  // Verde brillante

  // Atenuar paneles inactivos
  this.dimInactivePanels(widget);

  // Actualizar posición del cursor
  widget.focus();
}
```

## 📱 Características de Accesibilidad

### Navegación por Teclado

#### Navegación Estilo Vi
```typescript
// Teclas de movimiento estilo Vi
this.widget.key(['j'], () => this.moveDown());
this.widget.key(['k'], () => this.moveUp());
this.widget.key(['h'], () => this.moveLeft());
this.widget.key(['l'], () => this.moveRight());

// Navegación de página
this.widget.key(['g'], () => this.goToTop());
this.widget.key(['G'], () => this.goToBottom());
```

#### Soporte para Lector de Pantalla
- **Texto Alternativo**: Etiquetas descriptivas para todos los elementos interactivos
- **Anuncios de Estado**: Cambios importantes de estado anunciados
- **Orden de Tab Lógico**: Flujo de navegación consistente
- **Alto Contraste**: Modo de alto contraste opcional

### Manejo de Errores y Retroalimentación del Usuario

#### Indicadores Visuales de Error
```typescript
private showError(message: string): void {
  const errorBox = blessed.box({
    parent: this.screen,
    top: 'center',
    left: 'center',
    width: 60,
    height: 10,
    content: `{red-fg}Error: ${message}{/red-fg}`,
    border: { type: 'line', fg: 'red' },
    style: { bg: 'black' },
    tags: true
  });

  // Auto-ocultar después de 5 segundos
  setTimeout(() => errorBox.destroy(), 5000);
}
```

#### Estados de Carga
```typescript
private showLoading(message: string): void {
  this.statusBar.setContent(` ${message}... | Presiona Esc para cancelar`);
  this.screen.render();
}
```

## 🔍 Herramientas de Debug y Desarrollo

### Modo Debug

```typescript
export class CronosUI {
  private debugMode = process.env.DOCKRONOS_DEBUG === 'true';

  private debug(message: string, data?: any): void {
    if (this.debugMode) {
      console.error(`[UI Debug] ${message}`, data);
    }
  }
}
```

### Monitoreo de Rendimiento

#### Seguimiento de Tiempo de Renderizado
```typescript
private measureRenderTime(component: string, renderFn: () => void): void {
  const start = performance.now();
  renderFn();
  const end = performance.now();

  if (end - start > 16) { // > 60fps
    console.warn(`Renderizado lento detectado en ${component}: ${end - start}ms`);
  }
}
```

#### Monitoreo de Uso de Memoria
```typescript
private checkMemoryUsage(): void {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('Alto uso de memoria detectado:', usage);
  }
}
```

## 🎯 Mejores Prácticas y Patrones

### Principios de Diseño de Componentes

1. **Responsabilidad Única**: Cada componente tiene un propósito claro
2. **Composición sobre Herencia**: Construir UIs complejas desde componentes simples
3. **Actualizaciones Dirigidas por Eventos**: Usar observadores para acoplamiento débil
4. **Estado Inmutable**: Evitar mutación directa de estado
5. **Degradación Elegante**: Manejar limitaciones de terminal con gracia

### Guías de Rendimiento

1. **Minimizar Renderizados**: Solo renderizar cuando los datos cambian
2. **Actualizaciones por Lotes**: Agrupar múltiples cambios en un solo renderizado
3. **Carga Perezosa**: Cargar datos solo cuando sea necesario
4. **Limpieza de Memoria**: Disponer apropiadamente de componentes y listeners
5. **Eventos Limitados**: Prevenir inundación de UI por eventos rápidos

### Estrategias de Manejo de Errores

1. **Fallos Elegantes**: Continuar operación cuando sea posible
2. **Retroalimentación del Usuario**: Proporcionar mensajes de error claros
3. **Logging**: Logging completo de errores para debugging
4. **Recuperación**: Reintento automático para fallos transitorios
5. **Respaldos**: Modos UI alternativos para funcionalidad degradada

---

*Este sistema UI proporciona una interfaz de terminal robusta, eficiente y amigable para el usuario para gestión de contenedores. La arquitectura enfatiza rendimiento, accesibilidad y mantenibilidad mientras entrega una experiencia interactiva rica.*