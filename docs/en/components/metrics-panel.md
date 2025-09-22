# Metrics Panel Component

The Metrics Panel provides real-time system and container performance monitoring in Dockronos. Built using blessed.js and blessed-contrib, it displays CPU, memory, and network metrics with visual progress indicators and live data updates.

## 🏗️ Component Architecture

### Core Structure

```typescript
export class MetricsPanel {
  public widget: blessed.Widgets.BoxElement;
  private systemMetricsBox: blessed.Widgets.BoxElement;
  private cpuGauge: blessed.Widgets.BoxElement;
  private memoryGauge: blessed.Widgets.BoxElement;
  private containersList: blessed.Widgets.ListElement;
}
```

### Layout Organization

```
┌─ System Metrics (40% width) ──────────────────┐
│ ┌─ System Info ─────────────────────────────┐ │
│ │ CPU Usage: 45.2%                         │ │
│ │ Memory: 8.2GB / 16GB (51.2%)             │ │
│ │ Load Avg: 1.23, 1.45, 1.67              │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─ CPU Usage ──┐ ┌─ Memory Usage ──────────┐ │
│ │ CPU: 45.2%   │ │ Memory: 51.2%          │ │
│ │ [████████░░] │ │ [█████░░░░░]           │ │
│ └──────────────┘ └────────────────────────────┘ │
│ ┌─ Container Resources ─────────────────────┐ │
│ │ web-frontend                             │ │
│ │   CPU: 15.2%  Memory: 256MB/1GB (25%)   │ │
│ │   Network: ↓2.1MB ↑875KB                │ │
│ │                                         │ │
│ │ api-backend                             │ │
│ │   CPU: 8.7%   Memory: 128MB/512MB (25%) │ │
│ │   Network: ↓1.8MB ↑654KB                │ │
│ └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Widget Configuration

```typescript
constructor(options: MetricsPanelOptions) {
  this.widget = blessed.box({
    parent: options.parent,
    top: options.top,
    left: options.left,
    width: options.width,
    height: options.height,
    label: ' System Metrics ',
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

## 📊 System Metrics Display

### System Information Box

```typescript
private setupSystemMetrics(): void {
  this.systemMetricsBox = blessed.box({
    parent: this.widget,
    top: 0,
    left: 0,
    width: '100%',
    height: 8,
    content: 'Loading system metrics...',
    style: { fg: 'white' },
    padding: { left: 1, right: 1 }
  });
}
```

### CPU and Memory Gauges

```typescript
// CPU Progress Indicator
this.cpuGauge = blessed.box({
  parent: this.widget,
  top: 8,
  left: 0,
  width: '50%',
  height: 6,
  label: ' CPU Usage ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'green' }
  },
  content: 'CPU: 0%'
});

// Memory Progress Indicator
this.memoryGauge = blessed.box({
  parent: this.widget,
  top: 8,
  left: '50%',
  width: '50%',
  height: 6,
  label: ' Memory Usage ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: 'cyan' }
  },
  content: 'Memory: 0%'
});
```

### Progress Bar Implementation

```typescript
private createProgressBar(percentage: number, label: string): string {
  const width = 20;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  // Use Unicode block characters for smooth progress bars
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}]`;
}
```

#### Color-Coded Progress Bars

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

## 🔄 Real-Time Data Updates

### System Metrics Update

```typescript
updateSystemMetrics(metrics: SystemMetrics): void {
  // Format system information
  const systemInfo = [
    `CPU Usage: ${metrics.cpu.toFixed(1)}%`,
    `Memory: ${this.formatBytes(metrics.memory.used)} / ${this.formatBytes(metrics.memory.total)} (${metrics.memory.percentage.toFixed(1)}%)`,
    `Load Avg: ${metrics.loadAvg.map(load => load.toFixed(2)).join(', ')}`
  ].join('\n');

  this.systemMetricsBox.setContent(systemInfo);

  // Update progress indicators
  const cpuBar = this.createColoredProgressBar(metrics.cpu);
  const memBar = this.createColoredProgressBar(metrics.memory.percentage);

  this.cpuGauge.setContent(`CPU: ${metrics.cpu.toFixed(1)}%\n${cpuBar}`);
  this.memoryGauge.setContent(`Memory: ${metrics.memory.percentage.toFixed(1)}%\n${memBar}`);

  this.widget.screen?.render();
}
```

### Container Metrics Update

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
      `  Memory: ${memUsage}/${memLimit} (${container.memory.percentage.toFixed(1)}%)`,
      `  Network: ↓${netRx} ↑${netTx}`
    ].join('\n');
  });

  if (items.length === 0) {
    this.containersList.setItems(['No containers running']);
  } else {
    this.containersList.setItems(items);
  }

  this.widget.screen?.render();
}
```

## 🎨 Data Formatting

### Memory Formatting

```typescript
private formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
```

### CPU Usage Formatting

```typescript
private formatCpuUsage(cpu: number): string {
  const percentage = cpu.toFixed(1);

  // Color-code based on usage
  if (cpu > 80) return `{red-fg}${percentage}%{/red-fg}`;
  if (cpu > 60) return `{yellow-fg}${percentage}%{/yellow-fg}`;
  return `{green-fg}${percentage}%{/green-fg}`;
}
```

### Network Traffic Formatting

```typescript
private formatNetworkTraffic(bytes: number): string {
  const formatted = this.formatBytes(bytes);

  // Add rate indicators for high traffic
  if (bytes > 1024 * 1024) { // > 1MB
    return `{red-fg}${formatted}{/red-fg}`; // High traffic
  } else if (bytes > 1024 * 100) { // > 100KB
    return `{yellow-fg}${formatted}{/yellow-fg}`; // Medium traffic
  }
  return formatted; // Normal traffic
}
```

## 📊 Container Resource Monitoring

### Container List Configuration

```typescript
private setupContainerMetrics(): void {
  this.containersList = blessed.list({
    parent: this.widget,
    top: 14,
    left: 0,
    width: '100%',
    height: '100%-14',
    label: ' Container Resources ',
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

### Resource Alert System

```typescript
private checkResourceAlerts(containers: ContainerMetrics[]): void {
  for (const container of containers) {
    // CPU alert
    if (container.cpu > 90) {
      this.showAlert(`High CPU usage in ${container.name}: ${container.cpu.toFixed(1)}%`);
    }

    // Memory alert
    if (container.memory.percentage > 95) {
      this.showAlert(`High memory usage in ${container.name}: ${container.memory.percentage.toFixed(1)}%`);
    }

    // Memory limit approaching
    const memoryRatio = container.memory.used / container.memory.limit;
    if (memoryRatio > 0.9) {
      this.showAlert(`Memory limit approaching in ${container.name}`);
    }
  }
}

private showAlert(message: string): void {
  // Flash the border color to red briefly
  const originalColor = this.widget.style.border.fg;
  this.widget.style.border.fg = 'red';
  this.widget.screen?.render();

  setTimeout(() => {
    this.widget.style.border.fg = originalColor;
    this.widget.screen?.render();
  }, 1000);

  // Log alert for debugging
  console.warn(`[Metrics Alert] ${message}`);
}
```

## 🎯 Interactive Features

### Container Selection and Details

```typescript
focus(): void {
  this.containersList.focus();

  // Set up selection handler
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
    label: ` ${container.name} Details `,
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

### Metrics History Tracking

```typescript
class MetricsPanel {
  private metricsHistory: Map<string, number[]> = new Map();
  private maxHistoryLength = 60; // Keep 60 data points

  private updateHistory(containerId: string, cpu: number): void {
    if (!this.metricsHistory.has(containerId)) {
      this.metricsHistory.set(containerId, []);
    }

    const history = this.metricsHistory.get(containerId)!;
    history.push(cpu);

    // Keep only recent data
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

## 🔄 Advanced Visualization

### Sparkline Charts

```typescript
private createSparkline(data: number[]): string {
  if (data.length < 2) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Unicode block characters for sparklines
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  return data.map(value => {
    const normalized = (value - min) / range;
    const index = Math.floor(normalized * (chars.length - 1));
    return chars[index];
  }).join('');
}

private updateContainerWithSparkline(container: ContainerMetrics): string {
  const cpuHistory = this.metricsHistory.get(container.id) || [];
  const sparkline = this.createSparkline(cpuHistory.slice(-20)); // Last 20 data points

  return [
    `{bold}${container.name}{/bold}`,
    `  CPU: ${container.cpu.toFixed(1)}% ${sparkline}`,
    `  Memory: ${this.formatBytes(container.memory.used)}/${this.formatBytes(container.memory.limit)}`,
    `  Network: ↓${this.formatBytes(container.network.rx)} ↑${this.formatBytes(container.network.tx)}`
  ].join('\n');
}
```

### Graph View Toggle

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
    // Replace list with line graph
    this.containersList.hide();

    if (!this.cpuGraph) {
      this.cpuGraph = contrib.line({
        parent: this.widget,
        top: 14,
        left: 0,
        width: '100%',
        height: '100%-14',
        label: 'CPU Usage Over Time',
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

## ⚡ Performance Optimizations

### Efficient Updates

```typescript
class MetricsPanel {
  private lastUpdateTime = 0;
  private updateThreshold = 1000; // Update at most once per second

  updateSystemMetrics(metrics: SystemMetrics): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThreshold) {
      return; // Skip update if too frequent
    }

    this.lastUpdateTime = now;
    this.performUpdate(metrics);
  }

  private performUpdate(metrics: SystemMetrics): void {
    // Batch DOM updates
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

### Memory Management

```typescript
private cleanupOldData(): void {
  // Clean up old metrics history
  for (const [containerId, history] of this.metricsHistory) {
    if (history.length > this.maxHistoryLength * 2) {
      this.metricsHistory.set(containerId, history.slice(-this.maxHistoryLength));
    }
  }

  // Remove metrics for non-existent containers
  const currentIds = new Set(this.currentContainers.map(c => c.id));
  for (const id of this.metricsHistory.keys()) {
    if (!currentIds.has(id)) {
      this.metricsHistory.delete(id);
    }
  }
}
```

## 🚨 Error Handling

### Metrics Collection Errors

```typescript
private handleMetricsError(error: Error): void {
  // Show error state in metrics panel
  this.systemMetricsBox.setContent(`{red-fg}Error loading metrics: ${error.message}{/red-fg}`);

  // Disable progress bars
  this.cpuGauge.setContent('CPU: N/A');
  this.memoryGauge.setContent('Memory: N/A');

  // Show empty container list
  this.containersList.setItems(['Unable to load container metrics']);

  this.widget.screen?.render();
}
```

### Graceful Degradation

```typescript
private renderWithFallback(metrics?: SystemMetrics): void {
  if (!metrics) {
    // Show placeholder data
    this.showPlaceholderMetrics();
    return;
  }

  try {
    this.updateSystemMetrics(metrics);
  } catch (error) {
    console.error('Error rendering metrics:', error);
    this.showErrorState(error);
  }
}

private showPlaceholderMetrics(): void {
  this.systemMetricsBox.setContent([
    'CPU Usage: Loading...',
    'Memory: Loading...',
    'Load Avg: Loading...'
  ].join('\n'));

  this.cpuGauge.setContent('CPU: ---%');
  this.memoryGauge.setContent('Memory: ---%');
  this.containersList.setItems(['Loading container metrics...']);

  this.widget.screen?.render();
}
```

## 🔧 Component Lifecycle

### Initialization

```typescript
constructor(options: MetricsPanelOptions) {
  this.setupWidget(options);
  this.setupSystemMetrics();
  this.setupContainerMetrics();
  this.initializeMetricsHistory();
  this.startPerformanceMonitoring();
}
```

### Cleanup

```typescript
destroy(): void {
  // Stop any running timers
  if (this.updateTimer) {
    clearInterval(this.updateTimer);
  }

  // Clear metrics history
  this.metricsHistory.clear();

  // Remove event listeners
  this.containersList.removeAllListeners();

  // Destroy child widgets
  this.systemMetricsBox.destroy();
  this.cpuGauge.destroy();
  this.memoryGauge.destroy();
  this.containersList.destroy();

  // Destroy main widget
  this.widget.destroy();
}
```

### Update Cycle

```typescript
private setupUpdateCycle(): void {
  // Subscribe to metrics updates
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

*The Metrics Panel provides comprehensive system monitoring with real-time updates, visual progress indicators, and intelligent alerting. Its efficient architecture ensures smooth performance while delivering detailed insights into system and container resource usage.*