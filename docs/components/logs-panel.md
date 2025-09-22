# Logs Panel Component

The Logs Panel provides real-time log streaming and management in Dockronos. Built with blessed.js, it offers live log viewing, follow mode, search capabilities, and intelligent log formatting with color-coded output.

## 🏗️ Component Architecture

### Core Structure

```typescript
export class LogsPanel {
  public widget: blessed.Widgets.BoxElement;
  private isFollowing = true;
  private maxLines = 1000;
  private currentService?: string;
  private logBuffer: LogEntry[] = [];
}
```

### Widget Configuration

```typescript
constructor(options: LogsPanelOptions) {
  this.widget = blessed.box({
    parent: options.parent,
    top: options.top,
    left: options.left,
    width: options.width,
    height: options.height,
    label: ' Logs ',
    border: { type: 'line' },
    style: {
      fg: 'white',
      bg: 'default',
      border: { fg: '#00ff00' }
    },
    scrollable: true,           // Enable scrolling
    alwaysScroll: this.isFollowing, // Auto-scroll when following
    scrollbar: { ch: ' ' },     // Scrollbar character
    keys: true,                 // Enable keyboard navigation
    vi: true,                   // Vi-style navigation
    mouse: true,                // Mouse support
    tags: true                  // Enable color tags
  });

  this.setupKeyBindings();
  this.addWelcomeMessage();
}
```

## 📝 Log Entry Management

### Log Entry Structure

```typescript
interface LogEntry {
  timestamp: Date;
  service: string;
  message: string;
  level?: 'error' | 'warn' | 'info' | 'debug';
}
```

### Log Entry Processing

```typescript
addLogEntry(entry: LogEntry): void {
  // Add to buffer for search and history
  this.logBuffer.push(entry);

  // Limit buffer size to prevent memory issues
  if (this.logBuffer.length > this.maxLines) {
    this.logBuffer.shift();
  }

  // Format and display log entry
  const formattedMessage = this.formatLogEntry(entry);
  this.appendToWidget(formattedMessage);

  // Auto-scroll if following
  if (this.isFollowing) {
    this.scrollToBottom();
  }

  this.widget.screen?.render();
}

private formatLogEntry(entry: LogEntry): string {
  const timestamp = this.formatTimestamp(entry.timestamp);
  const levelColor = this.getLevelColor(entry.level);
  const serviceColor = 'cyan';

  const parts = [
    `{gray-fg}${timestamp}{/gray-fg}`,
    `{${serviceColor}-fg}[${entry.service}]{/${serviceColor}-fg}`,
    entry.level ? `{${levelColor}-fg}${entry.level.toUpperCase()}{/${levelColor}-fg}` : '',
    entry.message
  ].filter(Boolean);

  return parts.join(' ');
}
```

### Raw Log Processing

```typescript
addRawLog(message: string, service = 'unknown'): void {
  const lines = message.split('\n');

  for (const line of lines) {
    if (line.trim()) {
      // Parse log level from message
      const level = this.detectLogLevel(line);

      this.addLogEntry({
        timestamp: new Date(),
        service,
        message: line.trim(),
        level
      });
    }
  }
}

private detectLogLevel(message: string): LogEntry['level'] {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('error') || lowerMessage.includes('err')) return 'error';
  if (lowerMessage.includes('warn') || lowerMessage.includes('warning')) return 'warn';
  if (lowerMessage.includes('info')) return 'info';
  if (lowerMessage.includes('debug') || lowerMessage.includes('trace')) return 'debug';

  return undefined;
}
```

## 🎨 Visual Formatting

### Color-Coded Log Levels

```typescript
private getLevelColor(level?: LogEntry['level']): string {
  switch (level) {
    case 'error': return 'red';       // Critical errors
    case 'warn': return 'yellow';     // Warnings
    case 'info': return 'green';      // Informational
    case 'debug': return 'blue';      // Debug information
    default: return 'white';          // Default/unknown
  }
}
```

### Timestamp Formatting

```typescript
private formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

// Alternative: ISO format
private formatTimestampISO(date: Date): string {
  return date.toISOString().substring(11, 19); // HH:MM:SS
}

// Alternative: Relative time
private formatTimestampRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
```

### Log Level Icons

```typescript
private getLevelIcon(level?: LogEntry['level']): string {
  switch (level) {
    case 'error': return '✗';  // Error symbol
    case 'warn': return '⚠';   // Warning symbol
    case 'info': return 'ℹ';   // Info symbol
    case 'debug': return '🐛'; // Debug symbol
    default: return '○';       // Default symbol
  }
}
```

## ⌨️ Keyboard Navigation

### Primary Controls

```typescript
private setupKeyBindings(): void {
  // Follow mode toggle
  this.widget.key(['f', 'F'], () => {
    this.toggleFollow();
  });

  // Clear logs
  this.widget.key(['c', 'C'], () => {
    this.clear();
  });

  // Scrolling controls
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

  // Search functionality
  this.widget.key(['/'], () => {
    this.startSearch();
  });

  this.widget.key(['n'], () => {
    this.findNext();
  });

  this.widget.key(['N'], () => {
    this.findPrevious();
  });
}
```

### Scroll Management

```typescript
private scrollUp(): void {
  this.isFollowing = false; // Disable follow when manually scrolling
  this.widget.scroll(-5);   // Scroll up 5 lines
  this.updateFollowStatus();
  this.widget.screen?.render();
}

private scrollDown(): void {
  this.widget.scroll(5);    // Scroll down 5 lines

  // Re-enable follow if scrolled to bottom
  if (this.isAtBottom()) {
    this.isFollowing = true;
    this.updateFollowStatus();
  }

  this.widget.screen?.render();
}

private isAtBottom(): boolean {
  const lines = this.widget.getScreenLines();
  const visibleHeight = this.widget.height as number - 2; // Subtract border
  return this.widget.getScroll() >= lines.length - visibleHeight;
}
```

### Follow Mode Management

```typescript
private toggleFollow(): void {
  this.isFollowing = !this.isFollowing;

  const statusMessage = this.isFollowing ? 'Follow mode enabled' : 'Follow mode disabled';
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: statusMessage,
    level: 'info'
  });

  if (this.isFollowing) {
    this.scrollToBottom();
  }

  this.updateFollowStatus();
}

private updateFollowStatus(): void {
  const followIndicator = this.isFollowing ? ' [FOLLOWING]' : '';
  const currentLabel = this.currentService ?
    ` Logs - ${this.currentService}${followIndicator} ` :
    ` Logs${followIndicator} `;

  this.widget.setLabel(currentLabel);
}
```

## 🔍 Search and Filtering

### Search Implementation

```typescript
class LogsPanel {
  private searchTerm = '';
  private searchResults: number[] = [];
  private currentSearchIndex = 0;

  private startSearch(): void {
    const searchBox = blessed.textbox({
      parent: this.widget.screen,
      top: 'center',
      left: 'center',
      width: 40,
      height: 3,
      label: ' Search Logs ',
      border: { type: 'line' },
      style: { border: { fg: 'yellow' } },
      inputOnFocus: true
    });

    searchBox.readInput((err, value) => {
      if (!err && value) {
        this.performSearch(value);
      }
      searchBox.destroy();
      this.widget.focus();
      this.widget.screen?.render();
    });

    searchBox.focus();
  }

  private performSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.searchResults = [];

    // Search through log buffer
    this.logBuffer.forEach((entry, index) => {
      if (entry.message.toLowerCase().includes(this.searchTerm) ||
          entry.service.toLowerCase().includes(this.searchTerm)) {
        this.searchResults.push(index);
      }
    });

    if (this.searchResults.length > 0) {
      this.currentSearchIndex = 0;
      this.highlightSearchResult();
      this.showSearchStatus();
    } else {
      this.showNoResultsMessage();
    }
  }

  private highlightSearchResult(): void {
    if (this.searchResults.length === 0) return;

    const resultIndex = this.searchResults[this.currentSearchIndex];
    const logEntry = this.logBuffer[resultIndex];

    // Scroll to show the result
    this.scrollToLogEntry(resultIndex);

    // Highlight the term in the message
    this.highlightTermInLogs(this.searchTerm);
  }
}
```

### Filtering by Log Level

```typescript
class LogsPanel {
  private activeFilters: Set<LogEntry['level']> = new Set();

  filterByLevel(level: LogEntry['level']): void {
    if (this.activeFilters.has(level)) {
      this.activeFilters.delete(level);
    } else {
      this.activeFilters.add(level);
    }

    this.applyFilters();
  }

  private applyFilters(): void {
    if (this.activeFilters.size === 0) {
      this.showAllLogs();
      return;
    }

    const filteredEntries = this.logBuffer.filter(entry =>
      entry.level && this.activeFilters.has(entry.level)
    );

    this.renderFilteredLogs(filteredEntries);
  }

  private showFilterStatus(): void {
    if (this.activeFilters.size > 0) {
      const filterList = Array.from(this.activeFilters).join(', ');
      this.widget.setLabel(` Logs - Filtered: ${filterList} `);
    } else {
      this.widget.setLabel(' Logs ');
    }
  }
}
```

## 🔄 Service-Specific Logging

### Service Selection

```typescript
setService(serviceName: string): void {
  this.currentService = serviceName;
  this.widget.setLabel(` Logs - ${serviceName} `);

  this.clear();
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: `Showing logs for service: ${serviceName}`,
    level: 'info'
  });

  // Start streaming logs for this service
  this.startLogStreaming(serviceName);
}

showAllServices(): void {
  this.currentService = undefined;
  this.widget.setLabel(' Logs - All Services ');

  this.clear();
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: 'Showing logs for all services',
    level: 'info'
  });

  // Start streaming logs for all services
  this.startLogStreaming();
}
```

### Multi-Service Log Aggregation

```typescript
class LogsPanel {
  private serviceStreams: Map<string, NodeJS.ReadableStream> = new Map();

  private startLogStreaming(serviceName?: string): void {
    if (serviceName) {
      this.startSingleServiceStream(serviceName);
    } else {
      this.startAllServicesStream();
    }
  }

  private async startSingleServiceStream(serviceName: string): Promise<void> {
    try {
      const logStream = await containerEngine.getLogs(serviceName, true);

      logStream.on('data', (chunk: Buffer) => {
        this.processLogChunk(chunk, serviceName);
      });

      logStream.on('error', (error: Error) => {
        this.addLogEntry({
          timestamp: new Date(),
          service: serviceName,
          message: `Log stream error: ${error.message}`,
          level: 'error'
        });
      });

      this.serviceStreams.set(serviceName, logStream);
    } catch (error) {
      this.addLogEntry({
        timestamp: new Date(),
        service: serviceName,
        message: `Failed to start log stream: ${(error as Error).message}`,
        level: 'error'
      });
    }
  }

  private processLogChunk(chunk: Buffer, serviceName: string): void {
    const lines = chunk.toString().split('\n');

    for (const line of lines) {
      if (line.trim()) {
        // Parse Docker/Podman log format
        const parsed = this.parseDockerLogLine(line);
        this.addRawLog(parsed.message, parsed.service || serviceName);
      }
    }
  }
}
```

## 📊 Log Analysis Features

### Log Statistics

```typescript
class LogsPanel {
  private logStats: Map<string, number> = new Map();

  private updateLogStats(entry: LogEntry): void {
    const key = `${entry.service}-${entry.level || 'unknown'}`;
    this.logStats.set(key, (this.logStats.get(key) || 0) + 1);
  }

  getLogStatistics(): Record<string, any> {
    const stats: Record<string, any> = {
      total: this.logBuffer.length,
      byLevel: {},
      byService: {},
      timeRange: this.getTimeRange()
    };

    // Count by level
    for (const entry of this.logBuffer) {
      const level = entry.level || 'unknown';
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
    }

    // Count by service
    for (const entry of this.logBuffer) {
      stats.byService[entry.service] = (stats.byService[entry.service] || 0) + 1;
    }

    return stats;
  }

  private getTimeRange(): { start: Date; end: Date } | null {
    if (this.logBuffer.length === 0) return null;

    return {
      start: this.logBuffer[0].timestamp,
      end: this.logBuffer[this.logBuffer.length - 1].timestamp
    };
  }
}
```

### Error Detection and Highlighting

```typescript
private detectErrors(entry: LogEntry): boolean {
  const errorPatterns = [
    /error/i,
    /exception/i,
    /failed/i,
    /fatal/i,
    /critical/i,
    /panic/i,
    /\b5\d{2}\b/, // 5xx HTTP status codes
    /exit code: [1-9]/, // Non-zero exit codes
    /connection refused/i,
    /timeout/i
  ];

  return errorPatterns.some(pattern => pattern.test(entry.message));
}

private highlightErrors(message: string): string {
  // Highlight specific error patterns
  return message
    .replace(/(error|ERROR)/g, '{red-fg}$1{/red-fg}')
    .replace(/(failed|FAILED)/g, '{red-fg}$1{/red-fg}')
    .replace(/(warning|WARNING)/g, '{yellow-fg}$1{/yellow-fg}')
    .replace(/(\b5\d{2}\b)/g, '{red-fg}$1{/red-fg}'); // HTTP 5xx
}
```

## ⚡ Performance Optimizations

### Buffer Management

```typescript
class LogsPanel {
  private maxLines = 1000;
  private bufferHighWaterMark = 1200;

  private manageBuffer(): void {
    if (this.logBuffer.length > this.bufferHighWaterMark) {
      // Remove old entries
      const toRemove = this.logBuffer.length - this.maxLines;
      this.logBuffer.splice(0, toRemove);

      // Update display
      this.rebuildDisplay();
    }
  }

  private rebuildDisplay(): void {
    // Clear current content
    this.widget.setContent('');

    // Re-render visible entries
    const visibleEntries = this.getVisibleEntries();
    for (const entry of visibleEntries) {
      const formatted = this.formatLogEntry(entry);
      this.appendToWidget(formatted);
    }

    this.widget.screen?.render();
  }
}
```

### Throttled Updates

```typescript
class LogsPanel {
  private updateQueue: string[] = [];
  private updateTimer?: NodeJS.Timeout;
  private updateBatchSize = 10;

  private appendToWidget(message: string): void {
    this.updateQueue.push(message);

    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        this.flushUpdateQueue();
      }, 100); // Batch updates every 100ms
    }
  }

  private flushUpdateQueue(): void {
    const batch = this.updateQueue.splice(0, this.updateBatchSize);

    for (const message of batch) {
      const currentContent = this.widget.getContent();
      const newContent = currentContent + (currentContent ? '\n' : '') + message;
      this.widget.setContent(newContent);
    }

    // Continue processing if queue not empty
    if (this.updateQueue.length > 0) {
      this.updateTimer = setTimeout(() => {
        this.flushUpdateQueue();
      }, 50);
    } else {
      this.updateTimer = undefined;
    }

    this.widget.screen?.render();
  }
}
```

## 🎯 Advanced Features

### Log Export

```typescript
class LogsPanel {
  exportLogs(format: 'txt' | 'json' | 'csv' = 'txt'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logBuffer, null, 2);

      case 'csv':
        return this.exportAsCSV();

      case 'txt':
      default:
        return this.exportAsText();
    }
  }

  private exportAsText(): string {
    return this.logBuffer.map(entry => {
      const timestamp = entry.timestamp.toISOString();
      const level = entry.level ? `[${entry.level.toUpperCase()}]` : '';
      return `${timestamp} [${entry.service}] ${level} ${entry.message}`;
    }).join('\n');
  }

  private exportAsCSV(): string {
    const headers = ['timestamp', 'service', 'level', 'message'];
    const rows = this.logBuffer.map(entry => [
      entry.timestamp.toISOString(),
      entry.service,
      entry.level || '',
      entry.message.replace(/"/g, '""') // Escape quotes
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
```

### Context Menu

```typescript
private setupContextMenu(): void {
  this.widget.on('click', (data: any) => {
    if (data.button === 'right') {
      this.showContextMenu(data.x, data.y);
    }
  });
}

private showContextMenu(x: number, y: number): void {
  const menu = blessed.list({
    parent: this.widget.screen,
    top: y,
    left: x,
    width: 25,
    height: 12,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' } },
    items: [
      'Copy Selected',
      'Export Logs',
      'Clear Logs',
      'Toggle Follow',
      'Search Logs',
      'Filter by Level',
      'Show Statistics',
      'Scroll to Top',
      'Scroll to Bottom'
    ],
    keys: true,
    mouse: true
  });

  menu.on('select', (item: any, index: number) => {
    this.handleContextMenuAction(index);
    menu.destroy();
    this.widget.focus();
    this.widget.screen?.render();
  });

  menu.focus();
}
```

## 🔧 Component Lifecycle

### Initialization

```typescript
constructor(options: LogsPanelOptions) {
  this.setupWidget(options);
  this.setupKeyBindings();
  this.initializeBuffer();
  this.addWelcomeMessage();
}

private addWelcomeMessage(): void {
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: 'Logs panel initialized. Use F to toggle follow mode, C to clear logs.',
    level: 'info'
  });
}
```

### Cleanup

```typescript
destroy(): void {
  // Stop any running timers
  if (this.updateTimer) {
    clearTimeout(this.updateTimer);
  }

  // Close log streams
  for (const stream of this.serviceStreams.values()) {
    if (stream.readable) {
      stream.destroy();
    }
  }
  this.serviceStreams.clear();

  // Clear log buffer
  this.logBuffer = [];
  this.updateQueue = [];

  // Remove event listeners
  this.widget.removeAllListeners();

  // Destroy widget
  this.widget.destroy();
}
```

### State Management

```typescript
getState(): LogsPanelState {
  return {
    isFollowing: this.isFollowing,
    currentService: this.currentService,
    searchTerm: this.searchTerm,
    activeFilters: Array.from(this.activeFilters),
    scrollPosition: this.widget.getScroll(),
    logCount: this.logBuffer.length
  };
}

setState(state: LogsPanelState): void {
  this.isFollowing = state.isFollowing;
  this.currentService = state.currentService;
  this.searchTerm = state.searchTerm;
  this.activeFilters = new Set(state.activeFilters);

  // Restore scroll position
  this.widget.scrollTo(state.scrollPosition);

  this.updateFollowStatus();
  this.applyFilters();
}
```

---

*The Logs Panel provides comprehensive log management with real-time streaming, intelligent formatting, search capabilities, and performance optimizations. Its robust architecture ensures efficient handling of high-volume log data while maintaining excellent user experience and powerful debugging capabilities.*