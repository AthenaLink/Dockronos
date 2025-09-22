# UI System Architecture

The Dockronos user interface is built on the blessed.js terminal UI framework, providing a rich, interactive experience in the terminal. This document details the complete UI architecture, component system, and implementation patterns.

## 🏗️ Overall Architecture

### Three-Panel Layout System

Dockronos uses a sophisticated three-panel layout that maximizes terminal space efficiency:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dockronos UI Layout                     │
├─────────────────────────────────────────────────────────────────┤
│ Services Panel (60%)      │ Metrics Panel (40%)               │
│ ┌─ Container Management ┐ │ ┌─ System Metrics ─────────────┐ │
│ │ ▶ web-frontend   [UP] │ │ │ CPU:  [████████░░] 85%       │ │
│ │   api-backend   [UP]  │ │ │ RAM:  [██████░░░░] 65%       │ │
│ │   database    [DOWN]  │ │ │ DISK: [███░░░░░░░] 32%       │ │
│ │ ▶ redis-cache   [UP]  │ │ └─────────────────────────────────┘ │
│ │                       │ │ ┌─ Container Resources ────────┐ │
│ │ Actions:              │ │ │ web-frontend:               │ │
│ │ S-Start  X-Stop       │ │ │   CPU: 15%  RAM: 128MB      │ │
│ │ R-Restart D-Logs      │ │ │ api-backend:                │ │
│ │ E-Edit Environment    │ │ │   CPU: 8%   RAM: 96MB       │ │
│ └───────────────────────┘ │ └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Logs Panel (25% height)                                        │
│ ┌─ Logs: web-frontend ────────────────────────────────────────┐ │
│ │ 2024-01-15 10:30:15 [INFO] Server starting on port 3000    │ │
│ │ 2024-01-15 10:30:16 [INFO] Connected to database           │ │
│ │ 2024-01-15 10:30:17 [INFO] Application ready ▼             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Status Bar: Ready | Engine: Docker | Press ? for help         │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Specifications

| Panel | Dimensions | Purpose |
|-------|------------|---------|
| **Services Panel** | 60% width, 70% height | Container management and control |
| **Metrics Panel** | 40% width, 70% height | System and container monitoring |
| **Logs Panel** | 100% width, 25% height | Log streaming and analysis |
| **Status Bar** | 100% width, 5% height | Application status and help |

## 🎛️ Component Architecture

### Main UI Controller (`CronosUI`)

The central orchestrator managing all UI components and their interactions:

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

**Key Responsibilities**:
- **Component Lifecycle**: Initialize, update, and destroy UI components
- **Event Coordination**: Manage inter-component communication
- **Focus Management**: Control which panel receives keyboard input
- **Data Orchestration**: Coordinate data flow between backend and UI
- **Global Actions**: Handle application-wide operations (quit, refresh, help)

### Screen Management

#### Blessed Screen Configuration
```typescript
this.screen = blessed.screen({
  smartCSR: true,              // Smart cursor save/restore
  title: 'Dockronos - Container Management',
  cursor: {
    artificial: true,          // Artificial cursor for better control
    shape: 'line',            // Line cursor style
    blink: true,              // Blinking cursor
    color: 'white',           // Cursor color
  },
  debug: false,               // Disable debug mode for production
});
```

**Screen Features**:
- **Smart CSR**: Optimized rendering with cursor save/restore
- **Responsive Design**: Automatic adaptation to terminal resize
- **Cross-platform**: Works on Linux, macOS, Windows terminals
- **Color Support**: 256-color terminal compatibility

### Component Initialization Flow

```
1. Screen Creation → 2. Layout Setup → 3. Component Instantiation
       ↓                    ↓                     ↓
4. Event Binding → 5. Data Loading → 6. Render & Focus
```

#### Detailed Initialization Process

```typescript
async start(): Promise<void> {
  try {
    // 1. Initialize configuration
    await configManager.loadConfig();

    // 2. Initialize container engine
    await containerEngine.initialize();

    // 3. Start metrics collection
    await metricsCollector.start();

    // 4. Initial data load
    await this.refreshContainers();

    // 5. Set up refresh interval
    this.refreshInterval = setInterval(() => {
      this.refreshContainers();
    }, 5000);

    // 6. Set initial focus and render
    this.setFocus('services');
    this.screen.render();
  } catch (error) {
    this.handleStartupError(error);
  }
}
```

## ⌨️ Event System Architecture

### Global Key Bindings

The UI implements a hierarchical key binding system:

```typescript
private setupKeyBindings(): void {
  // Global application controls
  this.screen.key(['q', 'C-c'], () => this.quit());
  this.screen.key(['?'], () => this.toggleHelp());
  this.screen.key(['tab'], () => this.cycleFocus());
  this.screen.key(['F5', 'r'], () => this.refreshData());

  // Panel navigation shortcuts
  this.screen.key(['1'], () => this.setFocus('services'));
  this.screen.key(['2'], () => this.setFocus('metrics'));
  this.screen.key(['3'], () => this.setFocus('logs'));

  // Context-sensitive actions
  this.screen.key(['escape'], () => this.handleEscape());
}
```

### Event Flow Architecture

```
User Input → Key Capture → Event Router → Component Handler → Action Execution
     ↓            ↓            ↓               ↓                ↓
Terminal → Blessed.js → CronosUI → Panel Component → Backend Service
```

#### Event Priority System

1. **Global Events**: Application-wide shortcuts (quit, help, refresh)
2. **Navigation Events**: Panel switching and focus management
3. **Component Events**: Panel-specific actions (start service, scroll logs)
4. **Contextual Events**: Context-sensitive shortcuts based on current state

### Inter-Component Communication

#### Observer Pattern Implementation

```typescript
// Service selection events
this.servicesTable.onServiceSelect = (container: ContainerInfo) => {
  this.updateStatusBar(`Selected: ${container.name} (${container.status})`);
  this.metricsPanel.highlightContainer(container.id);
};

// Service action events
this.servicesTable.onServiceAction = async (action: string, container: ContainerInfo) => {
  await this.handleServiceAction(action, container);
  this.logsPanel.addLogEntry({
    timestamp: new Date(),
    service: container.name,
    message: `Service ${action} completed`,
    level: 'info'
  });
};

// Metrics update events
metricsCollector.onMetricsUpdate((system: SystemMetrics, containers: ContainerMetrics[]) => {
  this.metricsPanel.updateSystemMetrics(system);
  this.metricsPanel.updateContainerMetrics(containers);
});
```

## 🔄 Real-Time Update System

### Data Flow Architecture

```
External Systems → Data Collectors → Event Emitters → UI Components → Rendering
      ↓                ↓                ↓               ↓            ↓
Docker/Podman → Container Engine → Service Events → Services Table → Screen
System Info → Metrics Collector → Metrics Events → Metrics Panel → Screen
Log Streams → Log Processor → Log Events → Logs Panel → Screen
```

### Update Coordination

#### Centralized Update Manager

```typescript
private async refreshContainers(): Promise<void> {
  try {
    // Fetch latest container data
    this.containers = await containerEngine.listContainers();

    // Update services table
    this.servicesTable.updateContainers(this.containers);

    // Update status bar
    const runningCount = this.containers.filter(c => c.status === 'running').length;
    this.updateStatusBar(`${runningCount}/${this.containers.length} containers running`);

    // Trigger screen render
    this.screen.render();
  } catch (error) {
    this.handleRefreshError(error);
  }
}
```

#### Optimized Rendering Strategy

- **Selective Updates**: Only re-render changed components
- **Batched Rendering**: Group multiple updates into single render cycle
- **Throttled Updates**: Limit update frequency to prevent UI lag
- **Memory Management**: Clean up old data to prevent memory leaks

### Performance Optimizations

#### Update Throttling
```typescript
private debouncedRefresh = debounce(async () => {
  await this.refreshContainers();
}, 1000);
```

#### Lazy Rendering
```typescript
private renderIfVisible(component: UIComponent): void {
  if (component.isVisible() && component.isDirty()) {
    component.render();
    component.markClean();
  }
}
```

## 🎨 Visual Design System

### Color Scheme

#### Status Color Mapping
```typescript
private getStatusColor(status: ContainerInfo['status']): string {
  switch (status) {
    case 'running': return 'green';      // Active services
    case 'stopped': return 'red';        // Inactive services
    case 'paused': return 'yellow';      // Suspended services
    case 'restarting': return 'cyan';    // Transitioning services
    case 'dead': return 'magenta';       // Failed services
    default: return 'white';             // Unknown state
  }
}
```

#### UI Element Colors
- **Borders**: Green (#00ff00) for active panels
- **Headers**: Blue for section titles
- **Text**: White for primary content
- **Highlights**: Blue background for selections
- **Status**: Color-coded based on service state

### Typography and Layout

#### Text Formatting
```typescript
// Bold headers
`{bold}Service Name{/bold}`

// Color-coded status
`{${statusColor}-fg}${status}{/${statusColor}-fg}`

// Truncated text with ellipsis
private truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
```

#### Responsive Layout

The UI automatically adapts to different terminal sizes:

```typescript
// Dynamic column widths
const nameWidth = Math.floor(this.widget.width * 0.3);
const statusWidth = Math.floor(this.widget.width * 0.15);
const imageWidth = Math.floor(this.widget.width * 0.25);

// Minimum size constraints
const minWidth = 80;  // Minimum terminal width
const minHeight = 24; // Minimum terminal height
```

## 🔧 Focus Management System

### Focus States

```typescript
type FocusState = 'services' | 'metrics' | 'logs';

private setFocus(focus: FocusState): void {
  // Clear previous focus
  this.clearAllFocus();

  // Set new focus
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
  this.updateStatusBar(`Focus: ${focus.charAt(0).toUpperCase() + focus.slice(1)}`);
}
```

### Focus Navigation

#### Tab Cycling
```typescript
private cycleFocus(): void {
  const focusOrder: FocusState[] = ['services', 'metrics', 'logs'];
  const currentIndex = focusOrder.indexOf(this.currentFocus);
  const nextIndex = (currentIndex + 1) % focusOrder.length;
  this.setFocus(focusOrder[nextIndex]);
}
```

#### Direct Navigation
- **Keyboard**: Number keys (1, 2, 3) for direct panel access
- **Mouse**: Click to focus (when mouse support enabled)
- **Context**: Escape key returns to services panel

### Visual Focus Indicators

```typescript
private highlightPanel(widget: blessed.Widgets.BoxElement): void {
  // Highlight active panel border
  widget.style.border.fg = '#00ff00';  // Bright green

  // Dim inactive panels
  this.dimInactivePanels(widget);

  // Update cursor position
  widget.focus();
}
```

## 📱 Accessibility Features

### Keyboard Navigation

#### Vi-Style Navigation
```typescript
// Vi-style movement keys
this.widget.key(['j'], () => this.moveDown());
this.widget.key(['k'], () => this.moveUp());
this.widget.key(['h'], () => this.moveLeft());
this.widget.key(['l'], () => this.moveRight());

// Page navigation
this.widget.key(['g'], () => this.goToTop());
this.widget.key(['G'], () => this.goToBottom());
```

#### Screen Reader Support
- **Alt Text**: Descriptive labels for all interactive elements
- **Status Announcements**: Important state changes announced
- **Logical Tab Order**: Consistent navigation flow
- **High Contrast**: Optional high contrast mode

### Error Handling and User Feedback

#### Visual Error Indicators
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

  // Auto-hide after 5 seconds
  setTimeout(() => errorBox.destroy(), 5000);
}
```

#### Loading States
```typescript
private showLoading(message: string): void {
  this.statusBar.setContent(` ${message}... | Press Esc to cancel`);
  this.screen.render();
}
```

## 🔍 Debugging and Development Tools

### Debug Mode

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

### Performance Monitoring

#### Render Time Tracking
```typescript
private measureRenderTime(component: string, renderFn: () => void): void {
  const start = performance.now();
  renderFn();
  const end = performance.now();

  if (end - start > 16) { // > 60fps
    console.warn(`Slow render detected in ${component}: ${end - start}ms`);
  }
}
```

#### Memory Usage Monitoring
```typescript
private checkMemoryUsage(): void {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage detected:', usage);
  }
}
```

## 🎯 Best Practices and Patterns

### Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Event-Driven Updates**: Use observers for loose coupling
4. **Immutable State**: Avoid direct state mutation
5. **Graceful Degradation**: Handle terminal limitations gracefully

### Performance Guidelines

1. **Minimize Renders**: Only render when data changes
2. **Batch Updates**: Group multiple changes into single render
3. **Lazy Loading**: Load data only when needed
4. **Memory Cleanup**: Properly dispose of components and listeners
5. **Throttle Events**: Prevent UI flooding from rapid events

### Error Handling Strategies

1. **Graceful Failures**: Continue operation when possible
2. **User Feedback**: Provide clear error messages
3. **Logging**: Comprehensive error logging for debugging
4. **Recovery**: Automatic retry for transient failures
5. **Fallbacks**: Alternative UI modes for degraded functionality

---

*This UI system provides a robust, efficient, and user-friendly terminal interface for container management. The architecture emphasizes performance, accessibility, and maintainability while delivering a rich interactive experience.*