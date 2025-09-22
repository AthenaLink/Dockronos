import * as blessed from 'neo-blessed';
import * as contrib from 'blessed-contrib';
import type { SystemMetrics, ContainerMetrics } from '../../types/index.js';

export interface MetricsPanelOptions {
  parent: blessed.Widgets.Node;
  top: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
}

export class MetricsPanel {
  public widget: blessed.Widgets.BoxElement;
  private systemMetricsBox!: blessed.Widgets.BoxElement;
  private cpuGauge: any;
  private memoryGauge: any;
  private containersList!: blessed.Widgets.ListElement;

  constructor(options: MetricsPanelOptions) {
    this.widget = blessed.box({
      parent: options.parent,
      top: options.top,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' System Metrics ',
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'default',
        border: {
          fg: '#00ff00',
        },
      },
    });

    this.setupSystemMetrics();
    this.setupContainerMetrics();
  }

  private setupSystemMetrics(): void {
    // System info box
    this.systemMetricsBox = blessed.box({
      parent: this.widget,
      top: 0,
      left: 0,
      width: '100%',
      height: 8,
      content: 'Loading system metrics...',
      style: {
        fg: 'white',
      },
      padding: {
        left: 1,
        right: 1,
      },
    });

    // CPU Gauge
    this.cpuGauge = contrib.gauge({
      parent: this.widget,
      top: 8,
      left: 0,
      width: '50%',
      height: 6,
      label: 'CPU Usage',
      stroke: 'green',
      fill: 'white',
    });

    // Memory Gauge
    this.memoryGauge = contrib.gauge({
      parent: this.widget,
      top: 8,
      left: '50%',
      width: '50%',
      height: 6,
      label: 'Memory Usage',
      stroke: 'cyan',
      fill: 'white',
    });
  }

  private setupContainerMetrics(): void {
    this.containersList = blessed.list({
      parent: this.widget,
      top: 14,
      left: 0,
      width: '100%',
      height: '100%-14',
      label: ' Container Resources ',
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'default',
        border: {
          fg: 'cyan',
        },
        selected: {
          bg: 'blue',
        },
      },
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
    });
  }

  updateSystemMetrics(metrics: SystemMetrics): void {
    // Update system info
    const systemInfo = [
      `CPU Usage: ${metrics.cpu.toFixed(1)}%`,
      `Memory: ${this.formatBytes(metrics.memory.used)} / ${this.formatBytes(metrics.memory.total)} (${metrics.memory.percentage.toFixed(1)}%)`,
      `Load Avg: ${metrics.loadAvg.map(load => load.toFixed(2)).join(', ')}`,
    ].join('\n');

    this.systemMetricsBox.setContent(systemInfo);

    // Update gauges
    this.cpuGauge.setPercent(metrics.cpu);
    this.memoryGauge.setPercent(metrics.memory.percentage);

    this.widget.screen?.render();
  }

  updateContainerMetrics(containers: ContainerMetrics[]): void {
    const items = containers.map(container => {
      const memUsage = this.formatBytes(container.memory.used);
      const memLimit = this.formatBytes(container.memory.limit);
      const netRx = this.formatBytes(container.network.rx);
      const netTx = this.formatBytes(container.network.tx);

      return [
        `{bold}${container.name}{/bold}`,
        `  CPU: ${container.cpu.toFixed(1)}%`,
        `  Memory: ${memUsage}/${memLimit} (${container.memory.percentage.toFixed(1)}%)`,
        `  Network: ↓${netRx} ↑${netTx}`,
      ].join('\n');
    });

    if (items.length === 0) {
      this.containersList.setItems(['No containers running']);
    } else {
      this.containersList.setItems(items);
    }

    this.widget.screen?.render();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  focus(): void {
    this.containersList.focus();
  }

  destroy(): void {
    this.widget.destroy();
  }
}