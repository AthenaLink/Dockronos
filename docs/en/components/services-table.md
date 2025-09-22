# Services Table Component

The Services Table is the primary interface for container management in Dockronos. Built using blessed.js table widget, it provides real-time container status display and interactive service control functionality.

## 🏗️ Component Architecture

### Core Structure

```typescript
export class ServicesTable {
  public widget: blessed.Widgets.TableElement;
  private containers: ContainerInfo[] = [];
  private selectedIndex = 0;

  // Event handlers (callback pattern)
  onServiceSelect?: (container: ContainerInfo) => void;
  onServiceAction?: (action: string, container: ContainerInfo) => void;
}
```

### Table Configuration

```typescript
this.widget = blessed.table({
  parent: options.parent,
  top: options.top,
  left: options.left,
  width: options.width,
  height: options.height,
  label: ' Services ',
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'default',
    border: { fg: '#00ff00' },         // Green border for active state
    header: { fg: 'blue', bold: true }, // Blue bold headers
    cell: {
      fg: 'magenta',                    // Magenta cell text
      selected: { bg: 'blue' }          // Blue selection background
    }
  },
  align: 'left',
  pad: 1,                              // Cell padding
  shrink: true,                        // Shrink to content
  alwaysScroll: true,                  // Enable scrolling
  scrollable: true,                    // Scrollable content
  keys: true,                          // Enable keyboard navigation
  vi: true,                            // Vi-style navigation
  mouse: true                          // Mouse interaction support
});
```

## 📊 Data Structure and Display

### Table Schema

The services table displays container information in a structured format:

| Column | Width | Type | Description |
|--------|-------|------|-------------|
| **Name** | 20-30% | String | Container/service name |
| **Status** | 10-15% | Color-coded | Current container state |
| **Image** | 25-30% | Truncated | Container image name |
| **Ports** | 15-20% | Formatted | Port mappings |
| **CPU** | 8-10% | Percentage | CPU usage |
| **Memory** | 10-12% | Formatted | Memory consumption |

### Container Status Display

```typescript
private getStatusColor(status: ContainerInfo['status']): string {
  switch (status) {
    case 'running': return 'green';      // ● Active and healthy
    case 'stopped': return 'red';        // ● Inactive/shutdown
    case 'paused': return 'yellow';      // ● Suspended
    case 'restarting': return 'cyan';    // ● In transition
    case 'dead': return 'magenta';       // ● Failed/error state
    default: return 'white';             // ● Unknown state
  }
}
```

### Data Formatting Logic

#### Port Display
```typescript
private formatPorts(ports: string[]): string {
  if (ports.length === 0) return 'None';

  // Show first 2 ports, truncate if more
  const displayPorts = ports.slice(0, 2).join(', ');
  return ports.length > 2 ? `${displayPorts}...` : displayPorts;
}
```

#### Memory Formatting
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

#### Text Truncation
```typescript
private truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
```

## ⌨️ Keyboard Navigation System

### Primary Action Keys

```typescript
private setupKeyBindings(): void {
  // Service lifecycle management
  this.widget.key(['s', 'S'], () => this.startSelected());    // Start service
  this.widget.key(['x', 'X'], () => this.stopSelected());     // Stop service
  this.widget.key(['r', 'R'], () => this.restartSelected());  // Restart service

  // Information and debugging
  this.widget.key(['d', 'D'], () => this.showLogsSelected()); // Show logs
  this.widget.key(['i', 'I'], () => this.showInfoSelected()); // Service info

  // Configuration management
  this.widget.key(['e', 'E'], () => this.editEnvSelected());  // Edit environment
  this.widget.key(['c', 'C'], () => this.editConfigSelected()); // Edit config
}
```

### Navigation Keys

| Key | Action | Description |
|-----|--------|-------------|
| `↑` / `K` | Move up | Navigate to previous service |
| `↓` / `J` | Move down | Navigate to next service |
| `Home` / `G` | Go to top | Jump to first service |
| `End` / `Shift+G` | Go to bottom | Jump to last service |
| `Page Up` | Page up | Scroll up one screen |
| `Page Down` | Page down | Scroll down one screen |
| `Enter` | Select | Select current service |
| `Space` | Toggle | Toggle service selection |

### Vi-Style Navigation

The component supports Vi-style navigation for power users:

```typescript
// Additional Vi bindings
this.widget.key(['j'], () => this.moveDown());
this.widget.key(['k'], () => this.moveUp());
this.widget.key(['gg'], () => this.goToTop());
this.widget.key(['G'], () => this.goToBottom());
this.widget.key(['/'], () => this.searchServices());
```

## 🔄 Real-Time Updates

### Container Data Updates

```typescript
updateContainers(containers: ContainerInfo[]): void {
  this.containers = containers;
  this.updateTable();
}

private updateTable(): void {
  // Rebuild table data
  const rows = [
    ['Name', 'Status', 'Image', 'Ports', 'CPU', 'Memory'] // Header row
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

  // Update table and trigger render
  this.widget.setData(rows);
  this.widget.screen?.render();
}
```

### Performance Optimizations

#### Efficient Updates
```typescript
private shouldUpdate(newContainers: ContainerInfo[]): boolean {
  // Skip update if data hasn't changed
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

#### Debounced Updates
```typescript
private debouncedUpdate = debounce(() => {
  this.updateTable();
}, 250); // Update at most 4 times per second
```

## 🎛️ Service Action System

### Action Execution Flow

```
User Input → Key Handler → Action Method → Event Emission → Parent Handler
     ↓            ↓            ↓              ↓               ↓
   Key 'S' → startSelected() → getSelected() → onServiceAction → Container Engine
```

### Action Implementation

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

### Action Validation

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
      return true; // Allow informational actions
  }
}
```

## 🔍 Selection Management

### Selection State

```typescript
getSelectedContainer(): ContainerInfo | undefined {
  if (this.selectedIndex >= 0 && this.selectedIndex < this.containers.length) {
    return this.containers[this.selectedIndex];
  }
  return undefined;
}
```

### Multi-Selection Support

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

### Bulk Operations

```typescript
private executeActionOnSelected(action: string): void {
  const selected = this.getSelectedContainers();

  for (const container of selected) {
    if (this.validateAction(action, container)) {
      this.onServiceAction?.(action, container);
    }
  }
}

// Keyboard shortcuts for bulk operations
this.widget.key(['C-a'], () => this.selectAll());        // Ctrl+A
this.widget.key(['C-d'], () => this.deselectAll());      // Ctrl+D
this.widget.key(['A'], () => this.toggleMultiSelect());  // Toggle mode
```

## 🎨 Visual Styling and Themes

### Status Indicators

```typescript
private renderStatusIndicator(status: ContainerInfo['status']): string {
  const symbols = {
    running: '●',     // Solid circle (active)
    stopped: '○',     // Empty circle (inactive)
    paused: '◐',      // Half circle (suspended)
    restarting: '◔',  // Loading circle (transitioning)
    dead: '✗'         // X mark (failed)
  };

  const color = this.getStatusColor(status);
  const symbol = symbols[status] || '?';

  return `{${color}-fg}${symbol}{/${color}-fg}`;
}
```

### Row Highlighting

```typescript
private updateRowHighlight(): void {
  // Clear previous highlights
  this.widget.rows.forEach(row => row.style.bg = 'default');

  // Highlight selected row
  if (this.selectedIndex >= 0) {
    const row = this.widget.rows[this.selectedIndex + 1]; // +1 for header
    if (row) {
      row.style.bg = 'blue';
    }
  }

  // Highlight multi-selected rows
  this.selectedIndices.forEach(index => {
    const row = this.widget.rows[index + 1];
    if (row) {
      row.style.bg = 'cyan';
    }
  });
}
```

### Responsive Column Widths

```typescript
private calculateColumnWidths(): number[] {
  const totalWidth = this.widget.width as number;
  const minWidths = [15, 10, 20, 15, 8, 10]; // Minimum column widths

  // Calculate proportional widths
  const proportions = [0.25, 0.15, 0.30, 0.15, 0.08, 0.12];

  return proportions.map((prop, index) =>
    Math.max(minWidths[index], Math.floor(totalWidth * prop))
  );
}
```

## 📊 Context Menu System

### Right-Click Actions

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
  const items = ['View Logs', 'Edit Environment', 'View Config'];

  switch (container.status) {
    case 'running':
      items.unshift('Stop', 'Restart', 'Pause');
      break;
    case 'stopped':
      items.unshift('Start');
      break;
    case 'paused':
      items.unshift('Unpause', 'Stop');
      break;
  }

  return items;
}
```

## 🔧 Advanced Features

### Search and Filtering

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

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(container =>
        container.name.toLowerCase().includes(this.searchTerm) ||
        container.image.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply status filter
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

### Service Grouping

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
      const composeProject = container.labels?.['com.docker.compose.project'] || 'ungrouped';
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

## 🚨 Error Handling

### Action Error Display

```typescript
private handleActionError(action: string, container: ContainerInfo, error: Error): void {
  // Log error for debugging
  console.error(`Failed to ${action} ${container.name}:`, error);

  // Show user-friendly error message
  const errorMsg = `Failed to ${action} ${container.name}: ${error.message}`;
  this.showInlineError(errorMsg);

  // Emit error event for parent handling
  this.onServiceError?.(action, container, error);
}

private showInlineError(message: string): void {
  // Temporarily show error in status column
  const selectedRow = this.selectedIndex + 1;
  if (selectedRow < this.widget.rows.length) {
    const row = this.widget.rows[selectedRow];
    const originalStatus = row[1]; // Store original status

    row[1] = `{red-fg}ERROR{/red-fg}`;
    this.widget.setData(this.widget.rows);
    this.widget.screen?.render();

    // Restore original status after 3 seconds
    setTimeout(() => {
      row[1] = originalStatus;
      this.widget.setData(this.widget.rows);
      this.widget.screen?.render();
    }, 3000);
  }
}
```

### Connection State Handling

```typescript
private handleConnectionLoss(): void {
  // Show disconnected state
  this.widget.setLabel(' Services (Disconnected) ');
  this.widget.style.border.fg = 'red';

  // Disable actions
  this.actionsEnabled = false;

  // Show reconnection message
  this.showReconnectingMessage();
}

private handleConnectionRestore(): void {
  // Restore normal state
  this.widget.setLabel(' Services ');
  this.widget.style.border.fg = '#00ff00';

  // Re-enable actions
  this.actionsEnabled = true;

  // Refresh data
  this.onServiceAction?.('refresh', null);
}
```

## 🔄 Component Lifecycle

### Initialization

```typescript
constructor(options: ServicesTableOptions) {
  this.createWidget(options);
  this.setupKeyBindings();
  this.setupEventHandlers();
  this.initializeData();
}
```

### Updates

```typescript
updateContainers(containers: ContainerInfo[]): void {
  const previousSelection = this.getSelectedContainer();

  this.containers = containers;
  this.updateTable();

  // Restore selection if possible
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

### Cleanup

```typescript
destroy(): void {
  // Clear timers
  if (this.updateTimer) {
    clearInterval(this.updateTimer);
  }

  // Remove event listeners
  this.widget.removeAllListeners();

  // Destroy widget
  this.widget.destroy();

  // Clear references
  this.containers = [];
  this.onServiceSelect = undefined;
  this.onServiceAction = undefined;
}
```

---

*The Services Table component provides the core interface for container management, combining real-time data display with intuitive keyboard-driven controls. Its robust architecture ensures reliable operation while maintaining excellent performance and user experience.*