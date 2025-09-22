import blessed from 'blessed';
import { ServicesTable } from './components/services-table.js';
import { MetricsPanel } from './components/metrics-panel.js';
import { LogsPanel } from './components/logs-panel.js';
import { containerEngine } from '../engine/index.js';
import { metricsCollector } from '../metrics/index.js';
import { configManager } from '../config/index.js';
import type { ContainerInfo, SystemMetrics, ContainerMetrics } from '../types/index.js';

export class CronosUI {
  private screen: blessed.Widgets.Screen;
  private servicesTable!: ServicesTable;
  private metricsPanel!: MetricsPanel;
  private logsPanel!: LogsPanel;
  private statusBar!: blessed.Widgets.BoxElement;
  private helpText!: blessed.Widgets.BoxElement;

  private currentFocus: 'services' | 'metrics' | 'logs' = 'services';
  private containers: ContainerInfo[] = [];
  private refreshInterval: NodeJS.Timeout | undefined;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Cronos - Container Management',
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'white',
      },
      debug: false,
    });

    this.setupLayout();
    this.setupKeyBindings();
    this.setupEventHandlers();
  }

  private setupLayout(): void {
    // Services table (left side, top)
    this.servicesTable = new ServicesTable({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '60%',
      height: '70%',
    });

    // Metrics panel (right side, top)
    this.metricsPanel = new MetricsPanel({
      parent: this.screen,
      top: 0,
      left: '60%',
      width: '40%',
      height: '70%',
    });

    // Logs panel (full width, bottom)
    this.logsPanel = new LogsPanel({
      parent: this.screen,
      top: '70%',
      left: 0,
      width: '100%',
      height: '25%',
    });

    // Status bar
    this.statusBar = blessed.box({
      parent: this.screen,
      top: '95%',
      left: 0,
      width: '100%',
      height: 3,
      content: ' Ready | Engine: Detecting... | Press ? for help',
      style: {
        fg: 'white',
        bg: 'blue',
      },
    });

    // Help text (initially hidden)
    this.helpText = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 20,
      label: ' Help ',
      content: this.getHelpContent(),
      border: {
        type: 'line',
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'yellow',
        },
      },
      hidden: true,
      tags: true,
    });
  }

  private setupKeyBindings(): void {
    // Global key bindings
    this.screen.key(['q', 'C-c'], () => {
      this.quit();
    });

    this.screen.key(['?'], () => {
      this.toggleHelp();
    });

    this.screen.key(['tab'], () => {
      this.cycleFocus();
    });

    this.screen.key(['F5', 'r'], () => {
      this.refreshData();
    });

    // Focus-specific key bindings
    this.screen.key(['1'], () => {
      this.setFocus('services');
    });

    this.screen.key(['2'], () => {
      this.setFocus('metrics');
    });

    this.screen.key(['3'], () => {
      this.setFocus('logs');
    });

    // Escape key to close help or return to services
    this.screen.key(['escape'], () => {
      if (!this.helpText.hidden) {
        this.helpText.hide();
        this.screen.render();
      } else {
        this.setFocus('services');
      }
    });
  }

  private setupEventHandlers(): void {
    // Services table events
    this.servicesTable.onServiceSelect = (container: ContainerInfo) => {
      this.updateStatusBar(`Selected: ${container.name} (${container.status})`);
    };

    this.servicesTable.onServiceAction = async (action: string, container: ContainerInfo) => {
      await this.handleServiceAction(action, container);
    };

    // Metrics updates
    metricsCollector.onMetricsUpdate((system: SystemMetrics, containers: ContainerMetrics[]) => {
      this.metricsPanel.updateSystemMetrics(system);
      this.metricsPanel.updateContainerMetrics(containers);
    });

    // Screen resize
    this.screen.on('resize', () => {
      this.screen.render();
    });
  }

  private async handleServiceAction(action: string, container: ContainerInfo): Promise<void> {
    try {
      this.updateStatusBar(`${action} ${container.name}...`);

      switch (action) {
        case 'start':
          await containerEngine.startServices([container.name]);
          this.logsPanel.addLogEntry({
            timestamp: new Date(),
            service: container.name,
            message: 'Service started',
            level: 'info',
          });
          break;

        case 'stop':
          await containerEngine.stopServices([container.name]);
          this.logsPanel.addLogEntry({
            timestamp: new Date(),
            service: container.name,
            message: 'Service stopped',
            level: 'info',
          });
          break;

        case 'restart':
          await containerEngine.restartServices([container.name]);
          this.logsPanel.addLogEntry({
            timestamp: new Date(),
            service: container.name,
            message: 'Service restarted',
            level: 'info',
          });
          break;

        case 'logs':
          this.logsPanel.setService(container.name);
          this.setFocus('logs');
          this.streamLogs(container.name);
          break;

        case 'edit-env':
          await this.editEnvironment(container.name);
          break;
      }

      await this.refreshContainers();
      this.updateStatusBar(`${action} ${container.name} completed`);
    } catch (error) {
      const errorMessage = `Error ${action} ${container.name}: ${(error as Error).message}`;
      this.updateStatusBar(errorMessage);
      this.logsPanel.addLogEntry({
        timestamp: new Date(),
        service: container.name,
        message: errorMessage,
        level: 'error',
      });
    }
  }

  private async streamLogs(serviceName: string): Promise<void> {
    try {
      const logStream = await containerEngine.getLogs(serviceName, true);

      logStream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            this.logsPanel.addRawLog(line, serviceName);
          }
        }
      });

      logStream.on('error', (error: Error) => {
        this.logsPanel.addLogEntry({
          timestamp: new Date(),
          service: serviceName,
          message: `Log stream error: ${error.message}`,
          level: 'error',
        });
      });
    } catch (error) {
      this.logsPanel.addLogEntry({
        timestamp: new Date(),
        service: serviceName,
        message: `Failed to stream logs: ${(error as Error).message}`,
        level: 'error',
      });
    }
  }

  private async editEnvironment(serviceName: string): Promise<void> {
    // This would open an environment editor modal
    // For now, just show a message
    this.logsPanel.addLogEntry({
      timestamp: new Date(),
      service: 'cronos',
      message: `Environment editor for ${serviceName} - Feature coming soon`,
      level: 'info',
    });
  }

  private cycleFocus(): void {
    switch (this.currentFocus) {
      case 'services':
        this.setFocus('metrics');
        break;
      case 'metrics':
        this.setFocus('logs');
        break;
      case 'logs':
        this.setFocus('services');
        break;
    }
  }

  private setFocus(focus: 'services' | 'metrics' | 'logs'): void {
    this.currentFocus = focus;

    // Update visual focus
    switch (focus) {
      case 'services':
        this.servicesTable.focus();
        break;
      case 'metrics':
        this.metricsPanel.focus();
        break;
      case 'logs':
        this.logsPanel.focus();
        break;
    }

    this.updateStatusBar(`Focus: ${focus.charAt(0).toUpperCase() + focus.slice(1)}`);
  }

  private toggleHelp(): void {
    if (this.helpText.hidden) {
      this.helpText.show();
      this.helpText.setFront();
    } else {
      this.helpText.hide();
    }
    this.screen.render();
  }

  private getHelpContent(): string {
    return [
      '{bold}Cronos Container Management{/bold}',
      '',
      '{underline}Navigation:{/underline}',
      'Tab          - Cycle through panels',
      '1/2/3        - Jump to Services/Metrics/Logs',
      'Escape       - Return to Services panel',
      '',
      '{underline}Services Panel:{/underline}',
      'S            - Start selected service',
      'X            - Stop selected service',
      'R            - Restart selected service',
      'D            - Show logs for service',
      'E            - Edit environment (coming soon)',
      '',
      '{underline}Logs Panel:{/underline}',
      'F            - Toggle follow mode',
      'C            - Clear logs',
      'PageUp/Down  - Scroll logs',
      '',
      '{underline}Global:{/underline}',
      'F5/R         - Refresh data',
      '?            - Show/hide this help',
      'Q/Ctrl+C     - Quit',
    ].join('\n');
  }

  private async refreshData(): Promise<void> {
    this.updateStatusBar('Refreshing data...');
    await this.refreshContainers();
    this.updateStatusBar('Data refreshed');
  }

  private async refreshContainers(): Promise<void> {
    try {
      this.containers = await containerEngine.listContainers();
      this.servicesTable.updateContainers(this.containers);
    } catch (error) {
      this.logsPanel.addLogEntry({
        timestamp: new Date(),
        service: 'cronos',
        message: `Failed to refresh containers: ${(error as Error).message}`,
        level: 'error',
      });
    }
  }

  private updateStatusBar(message: string): void {
    const engine = containerEngine.getEngine();
    const status = ` ${message} | Engine: ${engine} | Press ? for help`;
    this.statusBar.setContent(status);
    this.screen.render();
  }

  async start(): Promise<void> {
    try {
      // Initialize configuration
      await configManager.loadConfig();

      // Update status bar with detected engine
      const engine = containerEngine.getEngine();
      this.updateStatusBar(`Ready | Engine: ${engine} | Press ? for help`);

      // Start metrics collection
      await metricsCollector.start();

      // Initial data load
      await this.refreshContainers();

      // Set up refresh interval
      this.refreshInterval = setInterval(() => {
        this.refreshContainers();
      }, 5000);

      // Set initial focus
      this.setFocus('services');

      // Render screen
      this.screen.render();

      this.logsPanel.addLogEntry({
        timestamp: new Date(),
        service: 'cronos',
        message: `Cronos started with ${engine} engine`,
        level: 'info',
      });

    } catch (error) {
      this.updateStatusBar(`Startup error: ${(error as Error).message}`);
      this.logsPanel.addLogEntry({
        timestamp: new Date(),
        service: 'cronos',
        message: `Startup error: ${(error as Error).message}`,
        level: 'error',
      });
    }
  }

  private quit(): void {
    // Cleanup
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    metricsCollector.stop();

    // Exit
    process.exit(0);
  }

  destroy(): void {
    this.servicesTable.destroy();
    this.metricsPanel.destroy();
    this.logsPanel.destroy();
    this.screen.destroy();
  }
}