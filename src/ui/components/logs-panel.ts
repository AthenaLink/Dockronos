import * as blessed from 'neo-blessed';
import type { LogEntry } from '../../types/index.js';

export interface LogsPanelOptions {
  parent: blessed.Widgets.Node;
  top: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
}

export class LogsPanel {
  public widget: blessed.Widgets.BoxElement;
  private isFollowing = true;
  private maxLines = 1000;

  constructor(options: LogsPanelOptions) {
    this.widget = blessed.box({
      parent: options.parent,
      top: options.top,
      left: options.left,
      width: options.width,
      height: options.height,
      label: ' Logs ',
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
      scrollable: true,
      alwaysScroll: this.isFollowing,
      scrollbar: {
        ch: ' ',
      },
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
    });

    this.setupKeyBindings();
    this.addWelcomeMessage();
  }

  private setupKeyBindings(): void {
    this.widget.key(['f', 'F'], () => {
      this.toggleFollow();
    });

    this.widget.key(['c', 'C'], () => {
      this.clear();
    });

    this.widget.key(['pageup'], () => {
      this.scrollUp();
    });

    this.widget.key(['pagedown'], () => {
      this.scrollDown();
    });

    this.widget.key(['home'], () => {
      this.scrollToTop();
    });

    this.widget.key(['end'], () => {
      this.scrollToBottom();
    });
  }

  private addWelcomeMessage(): void {
    this.addLogEntry({
      timestamp: new Date(),
      service: 'cronos',
      message: 'Logs panel initialized. Use F to toggle follow mode, C to clear logs.',
      level: 'info',
    });
  }

  addLogEntry(entry: LogEntry): void {
    const timestamp = entry.timestamp.toLocaleTimeString();
    const levelColor = this.getLevelColor(entry.level);
    const serviceColor = 'cyan';

    const formattedMessage = [
      `{gray-fg}${timestamp}{/gray-fg}`,
      `{${serviceColor}-fg}[${entry.service}]{/${serviceColor}-fg}`,
      entry.level ? `{${levelColor}-fg}${entry.level.toUpperCase()}{/${levelColor}-fg}` : '',
      entry.message,
    ].filter(Boolean).join(' ');

    // Add log entry to widget content
    const currentContent = this.widget.getContent();
    const newContent = currentContent + (currentContent ? '\n' : '') + formattedMessage;
    this.widget.setContent(newContent);

    // Limit number of lines to prevent memory issues
    const lines = this.widget.getScreenLines();
    if (lines.length > this.maxLines) {
      // Remove old lines (this is a simplified approach)
      this.widget.setContent(
        lines.slice(-this.maxLines + 1).join('\n')
      );
    }

    if (this.isFollowing) {
      this.scrollToBottom();
    }

    this.widget.screen?.render();
  }

  addRawLog(message: string, service = 'unknown'): void {
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        this.addLogEntry({
          timestamp: new Date(),
          service,
          message: line.trim(),
        });
      }
    }
  }

  private getLevelColor(level?: LogEntry['level']): string {
    switch (level) {
      case 'error': return 'red';
      case 'warn': return 'yellow';
      case 'info': return 'green';
      case 'debug': return 'blue';
      default: return 'white';
    }
  }

  private toggleFollow(): void {
    this.isFollowing = !this.isFollowing;

    const statusMessage = this.isFollowing ? 'Follow mode enabled' : 'Follow mode disabled';
    this.addLogEntry({
      timestamp: new Date(),
      service: 'cronos',
      message: statusMessage,
      level: 'info',
    });

    if (this.isFollowing) {
      this.scrollToBottom();
    }
  }

  clear(): void {
    this.widget.setContent('');
    this.addWelcomeMessage();
    this.widget.screen?.render();
  }

  private scrollUp(): void {
    this.isFollowing = false;
    this.widget.scroll(-5);
    this.widget.screen?.render();
  }

  private scrollDown(): void {
    this.widget.scroll(5);
    this.widget.screen?.render();
  }

  private scrollToTop(): void {
    this.isFollowing = false;
    this.widget.setScrollPerc(0);
    this.widget.screen?.render();
  }

  private scrollToBottom(): void {
    this.widget.setScrollPerc(100);
    this.widget.screen?.render();
  }

  setService(serviceName: string): void {
    this.widget.setLabel(` Logs - ${serviceName} `);
    this.clear();
    this.addLogEntry({
      timestamp: new Date(),
      service: 'cronos',
      message: `Showing logs for service: ${serviceName}`,
      level: 'info',
    });
  }

  showAllServices(): void {
    this.widget.setLabel(' Logs - All Services ');
    this.clear();
    this.addLogEntry({
      timestamp: new Date(),
      service: 'cronos',
      message: 'Showing logs for all services',
      level: 'info',
    });
  }

  focus(): void {
    this.widget.focus();
  }

  destroy(): void {
    this.widget.destroy();
  }
}