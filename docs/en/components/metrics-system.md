# Metrics System

The Metrics System provides comprehensive real-time monitoring of system resources and container performance in Dockronos. It collects, processes, and visualizes performance data to give users insights into their containerized applications.

## 🏗️ Architecture Overview

### Core Components

```typescript
export class MetricsCollector {
  private static instance: MetricsCollector;
  private collecting = false;
  private intervalId: NodeJS.Timeout | null = null;
  private metricsHistory: MetricsHistory = new Map();
  private eventEmitter = new EventEmitter();

  // Data collection modules
  private systemCollector: SystemMetricsCollector;
  private containerCollector: ContainerMetricsCollector;
  private networkCollector: NetworkMetricsCollector;
}
```

**Key Responsibilities**:
- **System Monitoring**: CPU, memory, disk, network utilization
- **Container Metrics**: Resource usage per container
- **Performance Tracking**: Historical data and trend analysis
- **Real-time Updates**: Live data streaming to UI components
- **Alerting**: Threshold-based notifications and warnings

## 📊 Metrics Collection System

### System Metrics Collection

```typescript
interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;           // Overall CPU usage percentage
    cores: number;           // Number of CPU cores
    temperature?: number;    // CPU temperature (if available)
    load: {
      current: number;       // Current load average
      1min: number;          // 1-minute load average
      5min: number;          // 5-minute load average
      15min: number;         // 15-minute load average
    };
  };
  memory: {
    total: number;           // Total RAM in bytes
    used: number;            // Used RAM in bytes
    free: number;            // Free RAM in bytes
    available: number;       // Available RAM in bytes
    usage: number;           // Usage percentage
    swap: {
      total: number;
      used: number;
      free: number;
    };
  };
  disk: {
    total: number;           // Total disk space in bytes
    used: number;            // Used disk space in bytes
    free: number;            // Free disk space in bytes
    usage: number;           // Usage percentage
    io: {
      readSpeed: number;     // Read speed in bytes/sec
      writeSpeed: number;    // Write speed in bytes/sec
      readOps: number;       // Read operations per second
      writeOps: number;      // Write operations per second
    };
  };
  network: {
    interfaces: NetworkInterface[];
    totalDownload: number;   // Total download speed
    totalUpload: number;     // Total upload speed
  };
}

class SystemMetricsCollector {
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const [cpuInfo, memInfo, diskInfo, networkInfo] = await Promise.all([
      this.collectCPUMetrics(),
      this.collectMemoryMetrics(),
      this.collectDiskMetrics(),
      this.collectNetworkMetrics()
    ]);

    return {
      timestamp: new Date(),
      cpu: cpuInfo,
      memory: memInfo,
      disk: diskInfo,
      network: networkInfo
    };
  }

  private async collectCPUMetrics(): Promise<SystemMetrics['cpu']> {
    const cpuData = await si.cpu();
    const currentLoad = await si.currentLoad();
    const cpuTemperature = await si.cpuTemperature();

    return {
      usage: Math.round(currentLoad.currentLoad * 100) / 100,
      cores: cpuData.cores,
      temperature: cpuTemperature.main,
      load: {
        current: currentLoad.currentLoad,
        1min: currentLoad.avgLoad1,
        5min: currentLoad.avgLoad5,
        15min: currentLoad.avgLoad15
      }
    };
  }

  private async collectMemoryMetrics(): Promise<SystemMetrics['memory']> {
    const memData = await si.mem();

    return {
      total: memData.total,
      used: memData.used,
      free: memData.free,
      available: memData.available,
      usage: Math.round((memData.used / memData.total) * 100 * 100) / 100,
      swap: {
        total: memData.swaptotal,
        used: memData.swapused,
        free: memData.swapfree
      }
    };
  }

  private async collectDiskMetrics(): Promise<SystemMetrics['disk']> {
    const diskLayout = await si.diskLayout();
    const fsSize = await si.fsSize();
    const diskIO = await si.disksIO();

    const totalSpace = fsSize.reduce((acc, fs) => acc + fs.size, 0);
    const usedSpace = fsSize.reduce((acc, fs) => acc + fs.used, 0);
    const freeSpace = totalSpace - usedSpace;

    return {
      total: totalSpace,
      used: usedSpace,
      free: freeSpace,
      usage: Math.round((usedSpace / totalSpace) * 100 * 100) / 100,
      io: {
        readSpeed: diskIO.rIO_sec || 0,
        writeSpeed: diskIO.wIO_sec || 0,
        readOps: diskIO.rIO || 0,
        writeOps: diskIO.wIO || 0
      }
    };
  }
}
```

### Container Metrics Collection

```typescript
interface ContainerMetrics {
  containerId: string;
  name: string;
  timestamp: Date;
  cpu: {
    usage: number;           // CPU usage percentage
    limit?: number;          // CPU limit (if set)
    throttling: {
      periods: number;
      throttled: number;
    };
  };
  memory: {
    usage: number;           // Memory usage in bytes
    limit?: number;          // Memory limit in bytes
    percentage: number;      // Usage percentage
    cache: number;           // Cache memory
    rss: number;             // Resident set size
    swap?: number;           // Swap usage
  };
  network: {
    rxBytes: number;         // Received bytes
    txBytes: number;         // Transmitted bytes
    rxPackets: number;       // Received packets
    txPackets: number;       // Transmitted packets
    rxErrors: number;        // Receive errors
    txErrors: number;        // Transmit errors
  };
  disk: {
    readBytes: number;       // Disk read bytes
    writeBytes: number;      // Disk write bytes
    readOps: number;         // Read operations
    writeOps: number;        // Write operations
  };
  processes: number;         // Number of processes
  status: ContainerStatus;
}

class ContainerMetricsCollector {
  async collectContainerMetrics(containers: ContainerInfo[]): Promise<ContainerMetrics[]> {
    const metrics: ContainerMetrics[] = [];

    for (const container of containers) {
      if (container.status === 'running') {
        try {
          const containerMetrics = await this.getContainerStats(container);
          metrics.push(containerMetrics);
        } catch (error) {
          logger.warn(`Failed to collect metrics for ${container.name}:`, error);
        }
      }
    }

    return metrics;
  }

  private async getContainerStats(container: ContainerInfo): Promise<ContainerMetrics> {
    const statsCommand = containerEngine.getStatsCommand(container.id);
    const statsOutput = await execAsync(statsCommand);
    const stats = this.parseStatsOutput(statsOutput, container);

    return {
      containerId: container.id,
      name: container.name,
      timestamp: new Date(),
      cpu: {
        usage: stats.cpuUsage,
        limit: stats.cpuLimit,
        throttling: {
          periods: stats.cpuThrottling?.periods || 0,
          throttled: stats.cpuThrottling?.throttled || 0
        }
      },
      memory: {
        usage: stats.memoryUsage,
        limit: stats.memoryLimit,
        percentage: stats.memoryPercentage,
        cache: stats.memoryCache,
        rss: stats.memoryRSS,
        swap: stats.memorySwap
      },
      network: {
        rxBytes: stats.networkRxBytes,
        txBytes: stats.networkTxBytes,
        rxPackets: stats.networkRxPackets,
        txPackets: stats.networkTxPackets,
        rxErrors: stats.networkRxErrors,
        txErrors: stats.networkTxErrors
      },
      disk: {
        readBytes: stats.diskReadBytes,
        writeBytes: stats.diskWriteBytes,
        readOps: stats.diskReadOps,
        writeOps: stats.diskWriteOps
      },
      processes: stats.processes,
      status: container.status
    };
  }

  private parseStatsOutput(output: string, container: ContainerInfo): ParsedStats {
    // Docker stats output parsing
    if (containerEngine.getCurrentEngine() === 'docker') {
      return this.parseDockerStats(output);
    }
    // Podman stats output parsing
    else if (containerEngine.getCurrentEngine() === 'podman') {
      return this.parsePodmanStats(output);
    }

    throw new Error('Unsupported container engine for stats parsing');
  }
}
```

## 📈 Data Processing and History

### Metrics History Management

```typescript
class MetricsHistory {
  private systemHistory: TimeSeries<SystemMetrics> = [];
  private containerHistory: Map<string, TimeSeries<ContainerMetrics>> = new Map();
  private maxHistorySize = 1000;
  private retentionPeriod = 24 * 60 * 60 * 1000; // 24 hours

  addSystemMetrics(metrics: SystemMetrics): void {
    this.systemHistory.push({
      timestamp: metrics.timestamp,
      data: metrics
    });

    this.trimHistory(this.systemHistory);
  }

  addContainerMetrics(metrics: ContainerMetrics): void {
    if (!this.containerHistory.has(metrics.containerId)) {
      this.containerHistory.set(metrics.containerId, []);
    }

    const history = this.containerHistory.get(metrics.containerId)!;
    history.push({
      timestamp: metrics.timestamp,
      data: metrics
    });

    this.trimHistory(history);
  }

  private trimHistory<T>(history: TimeSeries<T>): void {
    // Remove old entries beyond retention period
    const cutoffTime = new Date(Date.now() - this.retentionPeriod);

    while (history.length > 0 && history[0].timestamp < cutoffTime) {
      history.shift();
    }

    // Limit total number of entries
    while (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  getSystemTrend(duration: number = 300000): MetricsTrend {
    const cutoffTime = new Date(Date.now() - duration);
    const recentData = this.systemHistory.filter(entry =>
      entry.timestamp >= cutoffTime
    );

    return this.calculateTrend(recentData);
  }

  getContainerTrend(containerId: string, duration: number = 300000): MetricsTrend {
    const history = this.containerHistory.get(containerId);
    if (!history) return { direction: 'stable', change: 0 };

    const cutoffTime = new Date(Date.now() - duration);
    const recentData = history.filter(entry =>
      entry.timestamp >= cutoffTime
    );

    return this.calculateTrend(recentData);
  }

  private calculateTrend<T>(data: TimeSeries<T>): MetricsTrend {
    if (data.length < 2) return { direction: 'stable', change: 0 };

    const first = data[0];
    const last = data[data.length - 1];

    // Calculate percentage change for key metrics
    const change = this.calculatePercentageChange(first.data, last.data);

    return {
      direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.abs(change)
    };
  }
}
```

### Real-time Data Streaming

```typescript
class MetricsStreamer extends EventEmitter {
  private streamingInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<MetricsSubscriber> = new Set();

  startStreaming(interval: number = 5000): void {
    if (this.streamingInterval) {
      this.stopStreaming();
    }

    this.streamingInterval = setInterval(async () => {
      await this.collectAndBroadcast();
    }, interval);

    logger.info(`Metrics streaming started with ${interval}ms interval`);
  }

  stopStreaming(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
  }

  subscribe(subscriber: MetricsSubscriber): void {
    this.subscribers.add(subscriber);
  }

  unsubscribe(subscriber: MetricsSubscriber): void {
    this.subscribers.delete(subscriber);
  }

  private async collectAndBroadcast(): Promise<void> {
    try {
      // Collect latest metrics
      const systemMetrics = await this.systemCollector.collectSystemMetrics();
      const containerMetrics = await this.containerCollector.collectContainerMetrics(
        containerEngine.getRunningContainers()
      );

      // Store in history
      this.metricsHistory.addSystemMetrics(systemMetrics);
      containerMetrics.forEach(metrics =>
        this.metricsHistory.addContainerMetrics(metrics)
      );

      // Broadcast to subscribers
      const metricsUpdate: MetricsUpdate = {
        timestamp: new Date(),
        system: systemMetrics,
        containers: containerMetrics,
        trends: this.calculateTrends()
      };

      this.emit('metricsUpdate', metricsUpdate);

      // Notify individual subscribers
      this.subscribers.forEach(subscriber => {
        subscriber.onMetricsUpdate(metricsUpdate);
      });

    } catch (error) {
      logger.error('Failed to collect and broadcast metrics:', error);
      this.emit('metricsError', error);
    }
  }
}
```

## 🎨 Data Visualization Components

### Progress Bar Visualization

```typescript
class MetricsProgressBar {
  private widget: blessed.Widgets.ProgressBarElement;
  private label: string;
  private warningThreshold: number;
  private criticalThreshold: number;

  constructor(options: ProgressBarOptions) {
    this.label = options.label;
    this.warningThreshold = options.warningThreshold || 80;
    this.criticalThreshold = options.criticalThreshold || 95;

    this.widget = blessed.progressbar({
      parent: options.parent,
      top: options.top,
      left: options.left,
      width: options.width,
      height: 1,
      border: { type: 'line' },
      style: {
        bar: { bg: 'green' },
        border: { fg: 'cyan' }
      },
      filled: 0,
      keys: false,
      mouse: false
    });
  }

  update(value: number, max: number = 100): void {
    const percentage = Math.min((value / max) * 100, 100);

    // Update progress bar
    this.widget.setProgress(percentage);

    // Update color based on threshold
    const color = this.getColorForValue(percentage);
    this.widget.style.bar.bg = color;

    // Update label with current value
    const displayValue = this.formatValue(value, max);
    this.widget.setContent(`${this.label}: ${displayValue} (${percentage.toFixed(1)}%)`);
  }

  private getColorForValue(percentage: number): string {
    if (percentage >= this.criticalThreshold) return 'red';
    if (percentage >= this.warningThreshold) return 'yellow';
    return 'green';
  }

  private formatValue(value: number, max: number): string {
    // Format based on value type (bytes, percentage, etc.)
    if (max > 1024 * 1024 * 1024) {
      return `${this.formatBytes(value)} / ${this.formatBytes(max)}`;
    }
    return `${value.toFixed(1)} / ${max.toFixed(1)}`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
```

### Sparkline Charts

```typescript
class MetricsSparkline {
  private widget: blessed.Widgets.LineElement;
  private dataPoints: number[] = [];
  private maxDataPoints: number;
  private minValue: number = 0;
  private maxValue: number = 100;

  constructor(options: SparklineOptions) {
    this.maxDataPoints = options.maxDataPoints || 50;

    this.widget = blessed.line({
      parent: options.parent,
      top: options.top,
      left: options.left,
      width: options.width,
      height: options.height,
      border: { type: 'line' },
      style: {
        line: options.color || 'cyan',
        border: { fg: 'white' }
      },
      label: options.label,
      showLegend: false,
      xLabelPadding: 1,
      xPadding: 1
    });
  }

  addDataPoint(value: number): void {
    this.dataPoints.push(value);

    // Trim to max data points
    while (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints.shift();
    }

    // Update min/max for scaling
    this.updateScale();

    // Render updated chart
    this.render();
  }

  private updateScale(): void {
    if (this.dataPoints.length === 0) return;

    this.minValue = Math.min(...this.dataPoints);
    this.maxValue = Math.max(...this.dataPoints);

    // Add some padding
    const range = this.maxValue - this.minValue;
    this.minValue = Math.max(0, this.minValue - range * 0.1);
    this.maxValue = this.maxValue + range * 0.1;
  }

  private render(): void {
    if (this.dataPoints.length < 2) return;

    const chartData = this.dataPoints.map((value, index) => ({
      x: index,
      y: value
    }));

    this.widget.setData([{
      title: 'Metrics',
      x: chartData.map(point => point.x),
      y: chartData.map(point => point.y),
      style: { line: 'cyan' }
    }]);
  }
}
```

## ⚠️ Alerting and Threshold Management

### Alert System

```typescript
interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  duration: number;          // How long condition must persist
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  targets: AlertTarget[];
}

class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Alert rule added: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.activeAlerts.delete(ruleId);
    logger.info(`Alert rule removed: ${ruleId}`);
  }

  startEvaluation(interval: number = 30000): void {
    this.evaluationInterval = setInterval(() => {
      this.evaluateRules();
    }, interval);
  }

  stopEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  private async evaluateRules(): Promise<void> {
    const currentMetrics = await metricsCollector.getCurrentMetrics();

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      const metricValue = this.extractMetricValue(currentMetrics, rule.metric);
      const conditionMet = this.evaluateCondition(metricValue, rule);

      if (conditionMet) {
        await this.handleAlertCondition(rule, metricValue);
      } else {
        await this.handleAlertResolution(rule);
      }
    }
  }

  private evaluateCondition(value: number, rule: AlertRule): boolean {
    switch (rule.condition) {
      case 'greater_than':
        return value > rule.threshold;
      case 'less_than':
        return value < rule.threshold;
      case 'equals':
        return Math.abs(value - rule.threshold) < 0.01;
      default:
        return false;
    }
  }

  private async handleAlertCondition(rule: AlertRule, value: number): Promise<void> {
    const existingAlert = this.activeAlerts.get(rule.id);

    if (existingAlert) {
      // Update existing alert
      existingAlert.lastSeen = new Date();
      existingAlert.currentValue = value;
    } else {
      // Create new alert
      const alert: ActiveAlert = {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: new Date(),
        lastSeen: new Date(),
        currentValue: value,
        severity: rule.severity,
        acknowledged: false
      };

      this.activeAlerts.set(rule.id, alert);
      await this.sendAlert(alert, rule);
    }
  }

  private async sendAlert(alert: ActiveAlert, rule: AlertRule): Promise<void> {
    const message = `Alert: ${alert.ruleName} - Current value: ${alert.currentValue}, Threshold: ${rule.threshold}`;

    // Send to UI
    this.emit('alert', {
      type: 'triggered',
      alert,
      message
    });

    // Send to configured targets
    for (const target of rule.targets) {
      await this.sendToTarget(target, message, alert.severity);
    }

    logger.warn(`Alert triggered: ${alert.ruleName}`);
  }
}
```

### Default Alert Rules

```typescript
const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'high-cpu-usage',
    name: 'High CPU Usage',
    metric: 'system.cpu.usage',
    condition: 'greater_than',
    threshold: 90,
    duration: 300000, // 5 minutes
    severity: 'warning',
    enabled: true,
    targets: [{ type: 'ui' }]
  },
  {
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    metric: 'system.memory.usage',
    condition: 'greater_than',
    threshold: 85,
    duration: 300000,
    severity: 'warning',
    enabled: true,
    targets: [{ type: 'ui' }]
  },
  {
    id: 'disk-space-critical',
    name: 'Critical Disk Space',
    metric: 'system.disk.usage',
    condition: 'greater_than',
    threshold: 95,
    duration: 60000, // 1 minute
    severity: 'critical',
    enabled: true,
    targets: [{ type: 'ui' }, { type: 'log' }]
  },
  {
    id: 'container-high-cpu',
    name: 'Container High CPU',
    metric: 'container.cpu.usage',
    condition: 'greater_than',
    threshold: 80,
    duration: 600000, // 10 minutes
    severity: 'info',
    enabled: true,
    targets: [{ type: 'ui' }]
  }
];
```

## 🔧 Performance Optimization

### Data Collection Optimization

```typescript
class OptimizedMetricsCollector {
  private collectionStrategies: Map<string, CollectionStrategy> = new Map();
  private performanceMonitor = new PerformanceMonitor();

  constructor() {
    this.setupCollectionStrategies();
  }

  private setupCollectionStrategies(): void {
    // High-frequency metrics (system overview)
    this.collectionStrategies.set('system-overview', {
      interval: 1000,
      metrics: ['cpu.usage', 'memory.usage', 'network.total'],
      priority: 'high'
    });

    // Medium-frequency metrics (detailed system)
    this.collectionStrategies.set('system-detailed', {
      interval: 5000,
      metrics: ['cpu.temperature', 'disk.io', 'network.interfaces'],
      priority: 'medium'
    });

    // Low-frequency metrics (container details)
    this.collectionStrategies.set('container-detailed', {
      interval: 10000,
      metrics: ['container.processes', 'container.disk', 'container.network'],
      priority: 'low'
    });
  }

  async collectOptimized(): Promise<OptimizedMetrics> {
    const startTime = performance.now();

    try {
      // Parallel collection of different metric types
      const [systemMetrics, containerMetrics] = await Promise.all([
        this.collectSystemMetricsOptimized(),
        this.collectContainerMetricsOptimized()
      ]);

      const endTime = performance.now();
      this.performanceMonitor.recordCollectionTime(endTime - startTime);

      return { system: systemMetrics, containers: containerMetrics };
    } catch (error) {
      logger.error('Optimized metrics collection failed:', error);
      throw error;
    }
  }

  private async collectSystemMetricsOptimized(): Promise<SystemMetrics> {
    // Use cached values for expensive operations
    const cachedCPU = this.getCachedMetric('cpu.detailed');
    const cachedDisk = this.getCachedMetric('disk.detailed');

    const [currentLoad, memInfo] = await Promise.all([
      si.currentLoad(),
      si.mem()
    ]);

    return {
      timestamp: new Date(),
      cpu: {
        usage: currentLoad.currentLoad,
        cores: cachedCPU?.cores || await this.getCPUCores(),
        load: {
          current: currentLoad.currentLoad,
          1min: currentLoad.avgLoad1,
          5min: currentLoad.avgLoad5,
          15min: currentLoad.avgLoad15
        }
      },
      memory: {
        total: memInfo.total,
        used: memInfo.used,
        free: memInfo.free,
        available: memInfo.available,
        usage: (memInfo.used / memInfo.total) * 100,
        swap: {
          total: memInfo.swaptotal,
          used: memInfo.swapused,
          free: memInfo.swapfree
        }
      },
      disk: cachedDisk || await this.collectDiskMetrics(),
      network: await this.collectNetworkSummary()
    };
  }
}
```

## 🎯 Best Practices

### Metrics Collection Guidelines

1. **Sampling Strategy**: Use different collection intervals for different metric types
2. **Caching**: Cache expensive operations and update them less frequently
3. **Batch Processing**: Collect multiple metrics in parallel when possible
4. **Error Handling**: Gracefully handle missing or unavailable metrics
5. **Resource Management**: Monitor the overhead of metrics collection itself

### Data Storage Optimization

1. **Ring Buffers**: Use fixed-size circular buffers for historical data
2. **Data Compression**: Compress older historical data
3. **Selective Storage**: Store only relevant metrics based on usage patterns
4. **Memory Management**: Regular cleanup of old data and unused references
5. **Persistence**: Optional persistence for important historical trends

### Visualization Best Practices

1. **Responsive Design**: Adapt visualizations to terminal size
2. **Color Coding**: Use consistent colors for different severity levels
3. **Progressive Detail**: Show overview first, details on demand
4. **Performance**: Minimize rendering overhead for real-time updates
5. **Accessibility**: Provide text alternatives to visual elements

---

*The Metrics System provides comprehensive, real-time monitoring capabilities that help users understand and optimize their containerized applications. The system balances detailed insights with performance efficiency, ensuring minimal overhead while delivering valuable operational intelligence.*