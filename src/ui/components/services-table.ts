import blessed from 'blessed';
import type { ContainerInfo } from '../../types/index.js';

export interface ServicesTableOptions {
  parent: blessed.Widgets.Node;
  top: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
}

export class ServicesTable {
  public widget: blessed.Widgets.TableElement;
  private containers: ContainerInfo[] = [];
  private selectedIndex = 0;

  constructor(options: ServicesTableOptions) {
    this.widget = blessed.table({
      parent: options.parent,
      top: options.top,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' Services ',
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'default',
        border: {
          fg: '#00ff00',
        },
        header: {
          fg: 'blue',
          bold: true,
        },
        cell: {
          fg: 'magenta',
          selected: {
            bg: 'blue',
          },
        },
      },
      align: 'left',
      pad: 1,
      shrink: true,
      alwaysScroll: true,
      scrollable: true,
      keys: true,
      vi: true,
      mouse: true,
      data: [
        ['Name', 'Status', 'Image', 'Ports', 'CPU', 'Memory'],
      ],
    });

    this.setupKeyBindings();
  }

  private setupKeyBindings(): void {
    this.widget.key(['s', 'S'], () => {
      this.startSelected();
    });

    this.widget.key(['x', 'X'], () => {
      this.stopSelected();
    });

    this.widget.key(['r', 'R'], () => {
      this.restartSelected();
    });

    this.widget.key(['d', 'D'], () => {
      this.showLogsSelected();
    });

    this.widget.key(['e', 'E'], () => {
      this.editEnvSelected();
    });

    this.widget.on('select', (_item: any, index: number) => {
      this.selectedIndex = index - 1; // Subtract 1 for header
      const selectedContainer = this.containers[this.selectedIndex];
      if (selectedContainer && this.onServiceSelect) {
        this.onServiceSelect(selectedContainer);
      }
    });
  }

  updateContainers(containers: ContainerInfo[]): void {
    this.containers = containers;
    this.updateTable();
  }

  private updateTable(): void {
    const rows = [
      ['Name', 'Status', 'Image', 'Ports', 'CPU', 'Memory'],
    ];

    for (const container of this.containers) {
      const statusColor = this.getStatusColor(container.status);
      const cpuText = container.cpu !== undefined ? `${container.cpu.toFixed(1)}%` : 'N/A';
      const memoryText = container.memory !== undefined ? this.formatMemory(container.memory) : 'N/A';

      rows.push([
        container.name,
        `{${statusColor}-fg}${container.status}{/${statusColor}-fg}`,
        this.truncateText(container.image, 30),
        this.formatPorts(container.ports),
        cpuText,
        memoryText,
      ]);
    }

    this.widget.setData(rows);
    this.widget.screen?.render();
  }

  private getStatusColor(status: ContainerInfo['status']): string {
    switch (status) {
      case 'running': return 'green';
      case 'stopped': return 'red';
      case 'paused': return 'yellow';
      case 'restarting': return 'cyan';
      case 'dead': return 'magenta';
      default: return 'white';
    }
  }

  private formatPorts(ports: string[]): string {
    if (ports.length === 0) return 'None';
    return ports.slice(0, 2).join(', ') + (ports.length > 2 ? '...' : '');
  }

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

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  getSelectedContainer(): ContainerInfo | undefined {
    return this.containers[this.selectedIndex];
  }

  private startSelected(): void {
    const container = this.getSelectedContainer();
    if (container) {
      this.onServiceAction?.('start', container);
    }
  }

  private stopSelected(): void {
    const container = this.getSelectedContainer();
    if (container) {
      this.onServiceAction?.('stop', container);
    }
  }

  private restartSelected(): void {
    const container = this.getSelectedContainer();
    if (container) {
      this.onServiceAction?.('restart', container);
    }
  }

  private showLogsSelected(): void {
    const container = this.getSelectedContainer();
    if (container) {
      this.onServiceAction?.('logs', container);
    }
  }

  private editEnvSelected(): void {
    const container = this.getSelectedContainer();
    if (container) {
      this.onServiceAction?.('edit-env', container);
    }
  }

  // Event handlers (to be set by parent)
  onServiceSelect?: (container: ContainerInfo) => void;
  onServiceAction?: (action: string, container: ContainerInfo) => void;

  focus(): void {
    this.widget.focus();
  }

  destroy(): void {
    this.widget.destroy();
  }
}