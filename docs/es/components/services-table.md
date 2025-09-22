# Componente Tabla de Servicios

La Tabla de Servicios es la interfaz principal para la gestión de contenedores en Dockronos. Construida usando el widget de tabla blessed.js, proporciona visualización de estado de contenedores en tiempo real y funcionalidad de control de servicios interactiva.

## 🏗️ Arquitectura del Componente

### Estructura Central

```typescript
export class ServicesTable {
  public widget: blessed.Widgets.TableElement;
  private containers: ContainerInfo[] = [];
  private selectedIndex = 0;

  // Manejadores de eventos (patrón callback)
  onServiceSelect?: (container: ContainerInfo) => void;
  onServiceAction?: (action: string, container: ContainerInfo) => void;
}
```

### Configuración de Tabla

```typescript
this.widget = blessed.table({
  parent: options.parent,
  top: options.top,
  left: options.left,
  width: options.width,
  height: options.height,
  label: ' Servicios ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'default',
    border: { fg: '#00ff00' },         // Borde verde para estado activo
    header: { fg: 'blue', bold: true }, // Encabezados azules en negrita
    cell: {
      fg: 'magenta',                    // Texto de celda magenta
      selected: { bg: 'blue' }          // Fondo azul de selección
    }
  },
  align: 'left',
  pad: 1,                              // Padding de celda
  shrink: true,                        // Encoger al contenido
  alwaysScroll: true,                  // Habilitar desplazamiento
  scrollable: true,                    // Contenido desplazable
  keys: true,                          // Habilitar navegación por teclado
  vi: true,                            // Navegación estilo Vi
  mouse: true                          // Soporte de interacción con ratón
});
```

## 📊 Estructura de Datos y Visualización

### Esquema de Tabla

La tabla de servicios muestra información de contenedores en formato estructurado:

| Columna | Ancho | Tipo | Descripción |
|---------|-------|------|-------------|
| **Nombre** | 20-30% | String | Nombre del contenedor/servicio |
| **Estado** | 10-15% | Codificado por color | Estado actual del contenedor |
| **Imagen** | 25-30% | Truncado | Nombre de imagen del contenedor |
| **Puertos** | 15-20% | Formateado | Mapeos de puertos |
| **CPU** | 8-10% | Porcentaje | Uso de CPU |
| **Memoria** | 10-12% | Formateado | Consumo de memoria |

### Visualización de Estado de Contenedor

```typescript
private getStatusColor(status: ContainerInfo['status']): string {
  switch (status) {
    case 'running': return 'green';      // ● Activo y saludable
    case 'stopped': return 'red';        // ● Inactivo/apagado
    case 'paused': return 'yellow';      // ● Suspendido
    case 'restarting': return 'cyan';    // ● En transición
    case 'dead': return 'magenta';       // ● Estado fallido/error
    default: return 'white';             // ● Estado desconocido
  }
}
```

### Lógica de Formato de Datos

#### Visualización de Puertos
```typescript
private formatPorts(ports: string[]): string {
  if (ports.length === 0) return 'Ninguno';

  // Mostrar primeros 2 puertos, truncar si hay más
  const displayPorts = ports.slice(0, 2).join(', ');
  return ports.length > 2 ? `${displayPorts}...` : displayPorts;
}
```

#### Formato de Memoria
```typescript
private formatMemory(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < sizes.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(1)}${sizes[i]}`;
}
```

#### Truncamiento de Texto
```typescript
private truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
```

## ⌨️ Sistema de Navegación por Teclado

### Teclas de Acción Primaria

```typescript
private setupKeyBindings(): void {
  // Gestión del ciclo de vida de servicios
  this.widget.key(['s', 'S'], () => this.startSelected());    // Iniciar servicio
  this.widget.key(['x', 'X'], () => this.stopSelected());     // Detener servicio
  this.widget.key(['r', 'R'], () => this.restartSelected());  // Reiniciar servicio

  // Información y debugging
  this.widget.key(['d', 'D'], () => this.showLogsSelected()); // Mostrar logs
  this.widget.key(['i', 'I'], () => this.showInfoSelected()); // Info del servicio

  // Gestión de configuración
  this.widget.key(['e', 'E'], () => this.editEnvSelected());  // Editar entorno
  this.widget.key(['c', 'C'], () => this.editConfigSelected()); // Editar config
}
```

### Teclas de Navegación

| Tecla | Acción | Descripción |
|-------|--------|-------------|
| `↑` / `K` | Mover arriba | Navegar al servicio anterior |
| `↓` / `J` | Mover abajo | Navegar al siguiente servicio |
| `Inicio` / `G` | Ir al inicio | Saltar al primer servicio |
| `Fin` / `Shift+G` | Ir al final | Saltar al último servicio |
| `Re Pág` | Página arriba | Desplazar arriba una pantalla |
| `Av Pág` | Página abajo | Desplazar abajo una pantalla |
| `Enter` | Seleccionar | Seleccionar servicio actual |
| `Espacio` | Alternar | Alternar selección de servicio |

### Navegación Estilo Vi

El componente soporta navegación estilo Vi para usuarios avanzados:

```typescript
// Enlaces Vi adicionales
this.widget.key(['j'], () => this.moveDown());
this.widget.key(['k'], () => this.moveUp());
this.widget.key(['gg'], () => this.goToTop());
this.widget.key(['G'], () => this.goToBottom());
this.widget.key(['/'], () => this.searchServices());
```

## 🔄 Actualizaciones en Tiempo Real

### Actualizaciones de Datos de Contenedores

```typescript
updateContainers(containers: ContainerInfo[]): void {
  this.containers = containers;
  this.updateTable();
}

private updateTable(): void {
  // Reconstruir datos de tabla
  const rows = [
    ['Nombre', 'Estado', 'Imagen', 'Puertos', 'CPU', 'Memoria'] // Fila de encabezado
  ];

  for (const container of this.containers) {
    const statusColor = this.getStatusColor(container.status);
    const cpuText = container.cpu !== undefined ?
      `${container.cpu.toFixed(1)}%` : 'N/A';
    const memoryText = container.memory !== undefined ?
      this.formatMemory(container.memory) : 'N/A';

    rows.push([
      container.name,
      `{${statusColor}-fg}${container.status}{/${statusColor}-fg}`,
      this.truncateText(container.image, 30),
      this.formatPorts(container.ports),
      cpuText,
      memoryText
    ]);
  }

  // Actualizar tabla y disparar renderizado
  this.widget.setData(rows);
  this.widget.screen?.render();
}
```

### Optimizaciones de Rendimiento

#### Actualizaciones Eficientes
```typescript
private shouldUpdate(newContainers: ContainerInfo[]): boolean {
  // Omitir actualización si los datos no han cambiado
  if (this.containers.length !== newContainers.length) return true;

  return this.containers.some((container, index) =>
    !this.containersEqual(container, newContainers[index])
  );
}

private containersEqual(a: ContainerInfo, b: ContainerInfo): boolean {
  return a.id === b.id &&
         a.status === b.status &&
         a.cpu === b.cpu &&
         a.memory === b.memory;
}
```

#### Actualizaciones con Debounce
```typescript
private debouncedUpdate = debounce(() => {
  this.updateTable();
}, 250); // Actualizar máximo 4 veces por segundo
```

## 🎛️ Sistema de Acción de Servicios

### Flujo de Ejecución de Acciones

```
Entrada Usuario → Manejador Tecla → Método Acción → Emisión Evento → Manejador Padre
     ↓            ↓            ↓              ↓               ↓
   Tecla 'S' → startSelected() → getSelected() → onServiceAction → Motor Contenedores
```

### Implementación de Acciones

```typescript
private startSelected(): void {
  const container = this.getSelectedContainer();
  if (container && container.status !== 'running') {
    this.onServiceAction?.('start', container);
  }
}

private stopSelected(): void {
  const container = this.getSelectedContainer();
  if (container && container.status === 'running') {
    this.onServiceAction?.('stop', container);
  }
}

private restartSelected(): void {
  const container = this.getSelectedContainer();
  if (container) {
    this.onServiceAction?.('restart', container);
  }
}
```

### Validación de Acciones

```typescript
private validateAction(action: string, container: ContainerInfo): boolean {
  switch (action) {
    case 'start':
      return container.status === 'stopped' || container.status === 'dead';
    case 'stop':
      return container.status === 'running' || container.status === 'paused';
    case 'restart':
      return container.status === 'running';
    case 'pause':
      return container.status === 'running';
    case 'unpause':
      return container.status === 'paused';
    default:
      return true; // Permitir acciones informativas
  }
}
```

## 🔍 Gestión de Selección

### Estado de Selección

```typescript
getSelectedContainer(): ContainerInfo | undefined {
  if (this.selectedIndex >= 0 && this.selectedIndex < this.containers.length) {
    return this.containers[this.selectedIndex];
  }
  return undefined;
}
```

### Soporte de Multi-Selección

```typescript
class ServicesTable {
  private selectedIndices: Set<number> = new Set();
  private multiSelectMode = false;

  toggleMultiSelect(): void {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) {
      this.selectedIndices.clear();
    }
  }

  getSelectedContainers(): ContainerInfo[] {
    if (this.multiSelectMode) {
      return Array.from(this.selectedIndices)
        .map(index => this.containers[index])
        .filter(Boolean);
    }

    const single = this.getSelectedContainer();
    return single ? [single] : [];
  }
}
```

### Operaciones en Lote

```typescript
private executeActionOnSelected(action: string): void {
  const selected = this.getSelectedContainers();

  for (const container of selected) {
    if (this.validateAction(action, container)) {
      this.onServiceAction?.(action, container);
    }
  }
}

// Atajos de teclado para operaciones en lote
this.widget.key(['C-a'], () => this.selectAll());        // Ctrl+A
this.widget.key(['C-d'], () => this.deselectAll());      // Ctrl+D
this.widget.key(['A'], () => this.toggleMultiSelect());  // Alternar modo
```

## 🎨 Estilo Visual y Temas

### Indicadores de Estado

```typescript
private renderStatusIndicator(status: ContainerInfo['status']): string {
  const symbols = {
    running: '●',     // Círculo sólido (activo)
    stopped: '○',     // Círculo vacío (inactivo)
    paused: '◐',      // Medio círculo (suspendido)
    restarting: '◔',  // Círculo de carga (en transición)
    dead: '✗'         // Marca X (fallido)
  };

  const color = this.getStatusColor(status);
  const symbol = symbols[status] || '?';

  return `{${color}-fg}${symbol}{/${color}-fg}`;
}
```

### Resaltado de Filas

```typescript
private updateRowHighlight(): void {
  // Limpiar resaltados anteriores
  this.widget.rows.forEach(row => row.style.bg = 'default');

  // Resaltar fila seleccionada
  if (this.selectedIndex >= 0) {
    const row = this.widget.rows[this.selectedIndex + 1]; // +1 para encabezado
    if (row) {
      row.style.bg = 'blue';
    }
  }

  // Resaltar filas multi-seleccionadas
  this.selectedIndices.forEach(index => {
    const row = this.widget.rows[index + 1];
    if (row) {
      row.style.bg = 'cyan';
    }
  });
}
```

### Anchos de Columna Responsivos

```typescript
private calculateColumnWidths(): number[] {
  const totalWidth = this.widget.width as number;
  const minWidths = [15, 10, 20, 15, 8, 10]; // Anchos mínimos de columna

  // Calcular anchos proporcionales
  const proportions = [0.25, 0.15, 0.30, 0.15, 0.08, 0.12];

  return proportions.map((prop, index) =>
    Math.max(minWidths[index], Math.floor(totalWidth * prop))
  );
}
```

## 📊 Sistema de Menú Contextual

### Acciones de Clic Derecho

```typescript
private setupContextMenu(): void {
  this.widget.on('click', (data: any) => {
    if (data.button === 'right') {
      this.showContextMenu(data.x, data.y);
    }
  });
}

private showContextMenu(x: number, y: number): void {
  const container = this.getSelectedContainer();
  if (!container) return;

  const menu = blessed.list({
    parent: this.widget.screen,
    top: y,
    left: x,
    width: 20,
    height: 10,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    items: this.getContextMenuItems(container),
    keys: true,
    mouse: true
  });

  menu.focus();
}

private getContextMenuItems(container: ContainerInfo): string[] {
  const items = ['Ver Logs', 'Editar Entorno', 'Ver Config'];

  switch (container.status) {
    case 'running':
      items.unshift('Detener', 'Reiniciar', 'Pausar');
      break;
    case 'stopped':
      items.unshift('Iniciar');
      break;
    case 'paused':
      items.unshift('Despausar', 'Detener');
      break;
  }

  return items;
}
```

## 🔧 Características Avanzadas

### Búsqueda y Filtrado

```typescript
class ServicesTable {
  private searchTerm = '';
  private filterStatus?: ContainerInfo['status'];

  search(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.applyFilters();
  }

  filterByStatus(status?: ContainerInfo['status']): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.allContainers];

    // Aplicar filtro de búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(container =>
        container.name.toLowerCase().includes(this.searchTerm) ||
        container.image.toLowerCase().includes(this.searchTerm)
      );
    }

    // Aplicar filtro de estado
    if (this.filterStatus) {
      filtered = filtered.filter(container =>
        container.status === this.filterStatus
      );
    }

    this.containers = filtered;
    this.updateTable();
  }
}
```

### Agrupación de Servicios

```typescript
interface ServiceGroup {
  name: string;
  containers: ContainerInfo[];
  expanded: boolean;
}

class ServicesTable {
  private groups: ServiceGroup[] = [];
  private groupingEnabled = false;

  groupByCompose(): void {
    const groups = new Map<string, ContainerInfo[]>();

    for (const container of this.allContainers) {
      const composeProject = container.labels?.['com.docker.compose.project'] || 'sin-agrupar';
      if (!groups.has(composeProject)) {
        groups.set(composeProject, []);
      }
      groups.get(composeProject)!.push(container);
    }

    this.groups = Array.from(groups.entries()).map(([name, containers]) => ({
      name,
      containers,
      expanded: true
    }));

    this.renderGrouped();
  }
}
```

## 🚨 Manejo de Errores

### Visualización de Errores de Acción

```typescript
private handleActionError(action: string, container: ContainerInfo, error: Error): void {
  // Registrar error para debugging
  console.error(`Falló al ${action} ${container.name}:`, error);

  // Mostrar mensaje de error amigable para el usuario
  const errorMsg = `Falló al ${action} ${container.name}: ${error.message}`;
  this.showInlineError(errorMsg);

  // Emitir evento de error para manejo padre
  this.onServiceError?.(action, container, error);
}

private showInlineError(message: string): void {
  // Mostrar temporalmente error en columna de estado
  const selectedRow = this.selectedIndex + 1;
  if (selectedRow < this.widget.rows.length) {
    const row = this.widget.rows[selectedRow];
    const originalStatus = row[1]; // Almacenar estado original

    row[1] = `{red-fg}ERROR{/red-fg}`;
    this.widget.setData(this.widget.rows);
    this.widget.screen?.render();

    // Restaurar estado original después de 3 segundos
    setTimeout(() => {
      row[1] = originalStatus;
      this.widget.setData(this.widget.rows);
      this.widget.screen?.render();
    }, 3000);
  }
}
```

### Manejo de Estado de Conexión

```typescript
private handleConnectionLoss(): void {
  // Mostrar estado desconectado
  this.widget.setLabel(' Servicios (Desconectado) ');
  this.widget.style.border.fg = 'red';

  // Deshabilitar acciones
  this.actionsEnabled = false;

  // Mostrar mensaje de reconexión
  this.showReconnectingMessage();
}

private handleConnectionRestore(): void {
  // Restaurar estado normal
  this.widget.setLabel(' Servicios ');
  this.widget.style.border.fg = '#00ff00';

  // Re-habilitar acciones
  this.actionsEnabled = true;

  // Refrescar datos
  this.onServiceAction?.('refresh', null);
}
```

## 🔄 Ciclo de Vida del Componente

### Inicialización

```typescript
constructor(options: ServicesTableOptions) {
  this.createWidget(options);
  this.setupKeyBindings();
  this.setupEventHandlers();
  this.initializeData();
}
```

### Actualizaciones

```typescript
updateContainers(containers: ContainerInfo[]): void {
  const previousSelection = this.getSelectedContainer();

  this.containers = containers;
  this.updateTable();

  // Restaurar selección si es posible
  this.restoreSelection(previousSelection);
}

private restoreSelection(previousContainer?: ContainerInfo): void {
  if (previousContainer) {
    const newIndex = this.containers.findIndex(c => c.id === previousContainer.id);
    if (newIndex >= 0) {
      this.selectedIndex = newIndex;
      this.updateSelection();
    }
  }
}
```

### Limpieza

```typescript
destroy(): void {
  // Limpiar temporizadores
  if (this.updateTimer) {
    clearInterval(this.updateTimer);
  }

  // Remover event listeners
  this.widget.removeAllListeners();

  // Destruir widget
  this.widget.destroy();

  // Limpiar referencias
  this.containers = [];
  this.onServiceSelect = undefined;
  this.onServiceAction = undefined;
}
```

---

*El componente Tabla de Servicios proporciona la interfaz central para gestión de contenedores, combinando visualización de datos en tiempo real con controles intuitivos dirigidos por teclado. Su arquitectura robusta asegura operación confiable mientras mantiene excelente rendimiento y experiencia de usuario.*