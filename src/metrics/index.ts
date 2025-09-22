import * as si from 'systeminformation';
import { containerEngine } from '../engine/index.js';
import type { SystemMetrics, ContainerMetrics } from '../types/index.js';

export class MetricsCollector {
  private updateInterval: NodeJS.Timeout | null = null;
  private systemMetrics: SystemMetrics | null = null;
  private containerMetrics: ContainerMetrics[] = [];
  private listeners: Set<(system: SystemMetrics, containers: ContainerMetrics[]) => void> = new Set();

  constructor(private intervalMs = 2000) {}

  async start(): Promise<void> {
    await this.collectMetrics();
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const [systemData, containerData] = await Promise.all([
        this.collectSystemMetrics(),
        this.collectContainerMetrics(),
      ]);

      this.systemMetrics = systemData;
      this.containerMetrics = containerData;

      this.notifyListeners();
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const [cpu, memory] = await Promise.all([
      si.currentLoad(),
      si.mem(),
    ]);

    // Get load average manually for cross-platform compatibility
    let loadAvg = [0, 0, 0];
    try {
      // Use os module for load average as systeminformation might not have it
      const os = await import('os');
      const osLoadAvg = os.loadavg();
      loadAvg = [osLoadAvg[0] || 0, osLoadAvg[1] || 0, osLoadAvg[2] || 0];
    } catch {
      // Load average not available on this platform
    }

    return {
      cpu: Math.round(cpu.currentLoad),
      memory: {
        used: memory.used,
        total: memory.total,
        percentage: Math.round((memory.used / memory.total) * 100),
      },
      loadAvg,
    };
  }

  private async collectContainerMetrics(): Promise<ContainerMetrics[]> {
    try {
      const statsOutput = await containerEngine.getStats();
      return statsOutput
        .map(line => this.parseContainerStats(line))
        .filter((metric): metric is ContainerMetrics => metric !== null);
    } catch (error) {
      console.error('Error collecting container metrics:', error);
      return [];
    }
  }

  private parseContainerStats(statsLine: string): ContainerMetrics | null {
    try {
      const parts = statsLine.split('\t').map(p => p.trim());
      if (parts.length < 5) return null;

      const [name, cpuPerc, memUsage, memPerc, netIO] = parts;

      // Parse CPU percentage
      const cpu = parseFloat(cpuPerc?.replace('%', '') || '0');

      // Parse memory usage (format: "used / limit")
      const memParts = memUsage?.split(' / ') || [];
      const memUsed = this.parseMemoryValue(memParts[0] || '0');
      const memLimit = this.parseMemoryValue(memParts[1] || '0');
      const memPercentage = parseFloat(memPerc?.replace('%', '') || '0');

      // Parse network I/O (format: "rx / tx")
      const netParts = netIO?.split(' / ') || [];
      const netRx = this.parseMemoryValue(netParts[0] || '0');
      const netTx = this.parseMemoryValue(netParts[1] || '0');

      return {
        id: name || '',
        name: name || '',
        cpu: Math.round(cpu * 100) / 100,
        memory: {
          used: memUsed,
          limit: memLimit,
          percentage: Math.round(memPercentage * 100) / 100,
        },
        network: {
          rx: netRx,
          tx: netTx,
        },
      };
    } catch (error) {
      console.error('Error parsing container stats:', error);
      return null;
    }
  }

  private parseMemoryValue(value: string): number {
    const cleaned = value.trim().toLowerCase();
    const number = parseFloat(cleaned);

    if (cleaned.includes('ki')) return number * 1024;
    if (cleaned.includes('mi')) return number * 1024 * 1024;
    if (cleaned.includes('gi')) return number * 1024 * 1024 * 1024;
    if (cleaned.includes('ti')) return number * 1024 * 1024 * 1024 * 1024;

    // Docker uses different suffixes
    if (cleaned.includes('kb')) return number * 1000;
    if (cleaned.includes('mb')) return number * 1000 * 1000;
    if (cleaned.includes('gb')) return number * 1000 * 1000 * 1000;
    if (cleaned.includes('tb')) return number * 1000 * 1000 * 1000 * 1000;

    return number;
  }

  private notifyListeners(): void {
    if (this.systemMetrics) {
      this.listeners.forEach(listener => {
        try {
          listener(this.systemMetrics!, this.containerMetrics);
        } catch (error) {
          console.error('Error in metrics listener:', error);
        }
      });
    }
  }

  onMetricsUpdate(callback: (system: SystemMetrics, containers: ContainerMetrics[]) => void): () => void {
    this.listeners.add(callback);

    // Send current metrics immediately if available
    if (this.systemMetrics) {
      callback(this.systemMetrics, this.containerMetrics);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  getCurrentMetrics(): { system: SystemMetrics | null; containers: ContainerMetrics[] } {
    return {
      system: this.systemMetrics,
      containers: [...this.containerMetrics],
    };
  }

  formatMemory(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(1)} ${sizes[i]}`;
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}

export const metricsCollector = new MetricsCollector();