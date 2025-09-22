# Componente Panel de Métricas

El Panel de Métricas proporciona monitoreo de rendimiento del sistema y contenedores en tiempo real en Dockronos. Construido usando blessed.js y blessed-contrib, muestra métricas de CPU, memoria y red con indicadores de progreso visuales y actualizaciones de datos en vivo.

## 🏗️ Arquitectura del Componente

### Estructura Central

```typescript
export class MetricsPanel {
  public widget: blessed.Widgets.BoxElement;
  private systemMetricsBox: blessed.Widgets.BoxElement;
  private cpuGauge: blessed.Widgets.BoxElement;
  private memoryGauge: blessed.Widgets.BoxElement;
  private containersList: blessed.Widgets.ListElement;
}
```

### Organización de Diseño

```
┌─ Métricas Sistema (40% ancho) ────────────────┐
│ ┌─ Info Sistema ─────────────────────────────┐ │
│ │ Uso CPU: 45.2%                             │ │
│ │ Memoria: 8.2GB / 16GB (51.2%)              │ │
│ │ Carga Prom: 1.23, 1.45, 1.67               │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─ Uso CPU ────────┐ ┌─ Uso Memoria ─────────┐ │
│ │ CPU: 45.2%       │ │ Memoria: 51.2%        │ │
│ │ [████████░░]     │ │ [█████░░░░░]           │ │
│ └──────────────────┘ └───────────────────────────┘ │
│ ┌─ Recursos Contenedores ───────────────────┐ │
│ │ web-frontend                               │ │
│ │   CPU: 15.2%  Memoria: 256MB/1GB (25%)    │ │
│ │   Red: ↓2.1MB ↑875KB                      │ │
│ │                                           │ │
│ │ api-backend                               │ │
│ │   CPU: 8.7%   Memoria: 128MB/512MB (25%) │ │
│ │   Red: ↓1.8MB ↑654KB                      │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Configuración de Widget

```typescript
constructor(options: MetricsPanelOptions) {
  this.widget = blessed.box({
    parent: options.parent,
    top: options.top,
    left: options.left,
    width: options.width,
    height: options.height,
    label: ' Métricas del Sistema ',
    border: { type: 'line' },
    style: {
      fg: 'white',
      bg: 'default',
      border: { fg: '#00ff00' }
    }
  });

  this.setupSystemMetrics();
  this.setupContainerMetrics();
}
```

## 📊 Visualización de Métricas del Sistema

### Caja de Información del Sistema

```typescript
private setupSystemMetrics(): void {
  this.systemMetricsBox = blessed.box({
    parent: this.widget,
    top: 0,
    left: 0,
    width: '100%',
    height: 8,
    content: 'Cargando métricas del sistema...',
    style: { fg: 'white' },
    padding: { left: 1, right: 1 }
  });
}
```

### Medidores de CPU y Memoria

```typescript
// Indicador de Progreso CPU
this.cpuGauge = blessed.box({
  parent: this.widget,
  top: 8,
  left: 0,
  width: '50%',
  height: 6,
  label: ' Uso CPU ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'green' }
  },
  content: 'CPU: 0%'
});

// Indicador de Progreso Memoria
this.memoryGauge = blessed.box({
  parent: this.widget,
  top: 8,
  left: '50%',
  width: '50%',
  height: 6,
  label: ' Uso Memoria ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' }
  },
  content: 'Memoria: 0%'
});
```

### Implementación de Barra de Progreso

```typescript
private createProgressBar(percentage: number, label: string): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  // Usar caracteres de bloque Unicode para barras de progreso suaves
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}]`;
}
```

#### Barras de Progreso Codificadas por Color

```typescript
private createColoredProgressBar(percentage: number): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  let color = 'green';
  if (percentage > 80) color = 'red';
  else if (percentage > 60) color = 'yellow';

  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);

  return `{${color}-fg}${filledBar}{/${color}-fg}${emptyBar}`;
}
```

## 🔄 Actualizaciones de Datos en Tiempo Real

### Actualización de Métricas del Sistema

```typescript
updateSystemMetrics(metrics: SystemMetrics): void {
  // Formatear información del sistema
  const systemInfo = [
    `Uso CPU: ${metrics.cpu.toFixed(1)}%`,
    `Memoria: ${this.formatBytes(metrics.memory.used)} / ${this.formatBytes(metrics.memory.total)} (${metrics.memory.percentage.toFixed(1)}%)`,
    `Carga Prom: ${metrics.loadAvg.map(load => load.toFixed(2)).join(', ')}`
  ].join('\n');

  this.systemMetricsBox.setContent(systemInfo);

  // Actualizar indicadores de progreso
  const cpuBar = this.createColoredProgressBar(metrics.cpu);
  const memBar = this.createColoredProgressBar(metrics.memory.percentage);

  this.cpuGauge.setContent(`CPU: ${metrics.cpu.toFixed(1)}%\n${cpuBar}`);
  this.memoryGauge.setContent(`Memoria: ${metrics.memory.percentage.toFixed(1)}%\n${memBar}`);

  this.widget.screen?.render();
}
```

### Actualización de Métricas de Contenedores

```typescript
updateContainerMetrics(containers: ContainerMetrics[]): void {
  const items = containers.map(container => {
    const memUsage = this.formatBytes(container.memory.used);
    const memLimit = this.formatBytes(container.memory.limit);
    const netRx = this.formatBytes(container.network.rx);
    const netTx = this.formatBytes(container.network.tx);

    return [
      `{bold}${container.name}{/bold}`,
      `  CPU: ${this.formatCpuUsage(container.cpu)}`,
      `  Memoria: ${memUsage}/${memLimit} (${container.memory.percentage.toFixed(1)}%)`,
      `  Red: ↓${netRx} ↑${netTx}`
    ].join('\n');
  });

  if (items.length === 0) {
    this.containersList.setItems(['No hay contenedores ejecutándose']);
  } else {
    this.containersList.setItems(items);
  }

  this.widget.screen?.render();
}
```

## 🎨 Formato de Datos

### Formato de Memoria

```typescript
private formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
```

### Formato de Uso de CPU

```typescript
private formatCpuUsage(cpu: number): string {
  const percentage = cpu.toFixed(1);

  // Codificar por color basado en uso
  if (cpu > 80) return `{red-fg}${percentage}%{/red-fg}`;
  if (cpu > 60) return `{yellow-fg}${percentage}%{/yellow-fg}`;
  return `{green-fg}${percentage}%{/green-fg}`;
}
```

### Formato de Tráfico de Red

```typescript
private formatNetworkTraffic(bytes: number): string {
  const formatted = this.formatBytes(bytes);

  // Agregar indicadores de velocidad para tráfico alto
  if (bytes > 1024 * 1024) { // > 1MB
    return `{red-fg}${formatted}{/red-fg}`; // Tráfico alto
  } else if (bytes > 1024 * 100) { // > 100KB
    return `{yellow-fg}${formatted}{/yellow-fg}`; // Tráfico medio
  }
  return formatted; // Tráfico normal
}
```

## 📊 Monitoreo de Recursos de Contenedores

### Configuración de Lista de Contenedores

```typescript
private setupContainerMetrics(): void {
  this.containersList = blessed.list({
    parent: this.widget,
    top: 14,
    left: 0,
    width: '100%',
    height: '100%-14',
    label: ' Recursos de Contenedores ',
    border: { type: 'line' },
    style: {
      fg: 'white',
      bg: 'default',
      border: { fg: 'cyan' },
      selected: { bg: 'blue' }
    },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true
  });
}
```

### Sistema de Alertas de Recursos

```typescript
private checkResourceAlerts(containers: ContainerMetrics[]): void {
  for (const container of containers) {
    // Alerta de CPU
    if (container.cpu > 90) {
      this.showAlert(`Alto uso de CPU en ${container.name}: ${container.cpu.toFixed(1)}%`);
    }

    // Alerta de memoria
    if (container.memory.percentage > 95) {
      this.showAlert(`Alto uso de memoria en ${container.name}: ${container.memory.percentage.toFixed(1)}%`);
    }

    // Límite de memoria acercándose
    const memoryRatio = container.memory.used / container.memory.limit;
    if (memoryRatio > 0.9) {
      this.showAlert(`Límite de memoria acercándose en ${container.name}`);
    }
  }
}

private showAlert(message: string): void {
  // Parpadear el color del borde a rojo brevemente
  const originalColor = this.widget.style.border.fg;
  this.widget.style.border.fg = 'red';
  this.widget.screen?.render();

  setTimeout(() => {
    this.widget.style.border.fg = originalColor;
    this.widget.screen?.render();
  }, 1000);

  // Registrar alerta para debugging
  console.warn(`[Alerta Métricas] ${message}`);
}
```

## 🎯 Características Interactivas

### Selección y Detalles de Contenedores

```typescript
focus(): void {
  this.containersList.focus();

  // Configurar manejador de selección
  this.containersList.on('select', (item: any, index: number) => {
    this.showContainerDetails(index);
  });
}

private showContainerDetails(index: number): void {
  const container = this.currentContainers[index];
  if (!container) return;

  const details = blessed.box({
    parent: this.widget.screen,
    top: 'center',
    left: 'center',
    width: 60,
    height: 20,
    label: ` Detalles ${container.name} `,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    content: this.formatContainerDetails(container),
    tags: true,
    keys: true
  });

  details.key(['escape', 'q'], () => {
    details.destroy();
    this.widget.screen?.render();
  });

  details.focus();
  this.widget.screen?.render();
}
```

### Seguimiento de Historial de Métricas

```typescript
class MetricsPanel {
  private metricsHistory: Map<string, number[]> = new Map();
  private maxHistoryLength = 60; // Mantener 60 puntos de datos

  private updateHistory(containerId: string, cpu: number): void {
    if (!this.metricsHistory.has(containerId)) {
      this.metricsHistory.set(containerId, []);
    }

    const history = this.metricsHistory.get(containerId)!;
    history.push(cpu);

    // Mantener solo datos recientes
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  private getCpuTrend(containerId: string): 'up' | 'down' | 'stable' {
    const history = this.metricsHistory.get(containerId);
    if (!history || history.length < 5) return 'stable';

    const recent = history.slice(-5);
    const average = recent.reduce((a, b) => a + b, 0) / recent.length;
    const lastValue = recent[recent.length - 1];

    const difference = lastValue - average;
    if (difference > 5) return 'up';
    if (difference < -5) return 'down';
    return 'stable';
  }
}
```

## 🔄 Visualización Avanzada

### Gráficos Sparkline

```typescript
private createSparkline(data: number[]): string {
  if (data.length < 2) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Caracteres de bloque Unicode para sparklines
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  return data.map(value => {
    const normalized = (value - min) / range;
    const index = Math.floor(normalized * (chars.length - 1));
    return chars[index];
  }).join('');
}

private updateContainerWithSparkline(container: ContainerMetrics): string {
  const cpuHistory = this.metricsHistory.get(container.id) || [];
  const sparkline = this.createSparkline(cpuHistory.slice(-20)); // Últimos 20 puntos de datos

  return [
    `{bold}${container.name}{/bold}`,
    `  CPU: ${container.cpu.toFixed(1)}% ${sparkline}`,
    `  Memoria: ${this.formatBytes(container.memory.used)}/${this.formatBytes(container.memory.limit)}`,
    `  Red: ↓${this.formatBytes(container.network.rx)} ↑${this.formatBytes(container.network.tx)}`
  ].join('\n');
}
```

### Alternador de Vista de Gráfico

```typescript
class MetricsPanel {
  private graphMode = false;

  toggleGraphMode(): void {
    this.graphMode = !this.graphMode;

    if (this.graphMode) {
      this.showGraphView();
    } else {
      this.showListView();
    }
  }

  private showGraphView(): void {
    // Reemplazar lista con gráfico de líneas
    this.containersList.hide();

    if (!this.cpuGraph) {
      this.cpuGraph = contrib.line({
        parent: this.widget,
        top: 14,
        left: 0,
        width: '100%',
        height: '100%-14',
        label: 'Uso CPU a lo Largo del Tiempo',
        style: { line: 'yellow', text: 'green', baseline: 'black' },
        xLabelPadding: 3,
        xPadding: 5
      });
    }

    this.cpuGraph.show();
    this.updateCpuGraph();
  }

  private updateCpuGraph(): void {
    const series = this.currentContainers.map(container => ({
      title: container.name,
      x: Array.from({ length: 20 }, (_, i) => i),
      y: this.metricsHistory.get(container.id)?.slice(-20) || []
    }));

    this.cpuGraph.setData(series);
  }
}
```

## ⚡ Optimizaciones de Rendimiento

### Actualizaciones Eficientes

```typescript
class MetricsPanel {
  private lastUpdateTime = 0;
  private updateThreshold = 1000; // Actualizar máximo una vez por segundo

  updateSystemMetrics(metrics: SystemMetrics): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThreshold) {
      return; // Omitir actualización si es muy frecuente
    }

    this.lastUpdateTime = now;
    this.performUpdate(metrics);
  }

  private performUpdate(metrics: SystemMetrics): void {
    // Agrupar actualizaciones DOM
    this.widget.screen?.program.hideCursor();

    try {
      this.updateSystemInfo(metrics);
      this.updateProgressBars(metrics);
      this.updateContainersList();
    } finally {
      this.widget.screen?.program.showCursor();
      this.widget.screen?.render();
    }
  }
}
```

### Gestión de Memoria

```typescript
private cleanupOldData(): void {
  // Limpiar historial de métricas antiguas
  for (const [containerId, history] of this.metricsHistory) {
    if (history.length > this.maxHistoryLength * 2) {
      this.metricsHistory.set(containerId, history.slice(-this.maxHistoryLength));
    }
  }

  // Remover métricas para contenedores inexistentes
  const currentIds = new Set(this.currentContainers.map(c => c.id));
  for (const id of this.metricsHistory.keys()) {
    if (!currentIds.has(id)) {
      this.metricsHistory.delete(id);
    }
  }
}
```

## 🚨 Manejo de Errores

### Errores de Recolección de Métricas

```typescript
private handleMetricsError(error: Error): void {
  // Mostrar estado de error en panel de métricas
  this.systemMetricsBox.setContent(`{red-fg}Error cargando métricas: ${error.message}{/red-fg}`);

  // Deshabilitar barras de progreso
  this.cpuGauge.setContent('CPU: N/A');
  this.memoryGauge.setContent('Memoria: N/A');

  // Mostrar lista de contenedores vacía
  this.containersList.setItems(['No se pueden cargar métricas de contenedores']);

  this.widget.screen?.render();
}
```

### Degradación Elegante

```typescript
private renderWithFallback(metrics?: SystemMetrics): void {
  if (!metrics) {
    // Mostrar datos de marcador de posición
    this.showPlaceholderMetrics();
    return;
  }

  try {
    this.updateSystemMetrics(metrics);
  } catch (error) {
    console.error('Error renderizando métricas:', error);
    this.showErrorState(error);
  }
}

private showPlaceholderMetrics(): void {
  this.systemMetricsBox.setContent([
    'Uso CPU: Cargando...',
    'Memoria: Cargando...',
    'Carga Prom: Cargando...'
  ].join('\n'));

  this.cpuGauge.setContent('CPU: ---%');
  this.memoryGauge.setContent('Memoria: ---%');
  this.containersList.setItems(['Cargando métricas de contenedores...']);

  this.widget.screen?.render();
}
```

## 🔧 Ciclo de Vida del Componente

### Inicialización

```typescript
constructor(options: MetricsPanelOptions) {
  this.setupWidget(options);
  this.setupSystemMetrics();
  this.setupContainerMetrics();
  this.initializeMetricsHistory();
  this.startPerformanceMonitoring();
}
```

### Limpieza

```typescript
destroy(): void {
  // Detener cualquier temporizador en ejecución
  if (this.updateTimer) {
    clearInterval(this.updateTimer);
  }

  // Limpiar historial de métricas
  this.metricsHistory.clear();

  // Remover event listeners
  this.containersList.removeAllListeners();

  // Destruir widgets hijos
  this.systemMetricsBox.destroy();
  this.cpuGauge.destroy();
  this.memoryGauge.destroy();
  this.containersList.destroy();

  // Destruir widget principal
  this.widget.destroy();
}
```

### Ciclo de Actualización

```typescript
private setupUpdateCycle(): void {
  // Suscribirse a actualizaciones de métricas
  this.metricsSubscription = metricsCollector.onMetricsUpdate(
    (system: SystemMetrics, containers: ContainerMetrics[]) => {
      this.updateSystemMetrics(system);
      this.updateContainerMetrics(containers);
      this.updateMetricsHistory(containers);
      this.checkResourceAlerts(containers);
    }
  );
}
```

---

*El Panel de Métricas proporciona monitoreo completo del sistema con actualizaciones en tiempo real, indicadores de progreso visuales y alertas inteligentes. Su arquitectura eficiente asegura rendimiento suave mientras entrega insights detallados sobre el uso de recursos del sistema y contenedores.*