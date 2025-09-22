# Componente Panel de Logs

El Panel de Logs proporciona streaming de logs en tiempo real y gestión en Dockronos. Construido con blessed.js, ofrece visualización de logs en vivo, modo seguimiento, capacidades de búsqueda y formato inteligente de logs con salida codificada por colores.

## 🏗️ Arquitectura del Componente

### Estructura Central

```typescript
export class LogsPanel {
  public widget: blessed.Widgets.BoxElement;
  private isFollowing = true;
  private maxLines = 1000;
  private currentService?: string;
  private logBuffer: LogEntry[] = [];
}
```

### Configuración de Widget

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
    scrollable: true,           // Habilitar desplazamiento
    alwaysScroll: this.isFollowing, // Auto-desplazar cuando siguiendo
    scrollbar: { ch: ' ' },     // Carácter de barra de desplazamiento
    keys: true,                 // Habilitar navegación por teclado
    vi: true,                   // Navegación estilo Vi
    mouse: true,                // Soporte de ratón
    tags: true                  // Habilitar etiquetas de color
  });

  this.setupKeyBindings();
  this.addWelcomeMessage();
}
```

## 📝 Gestión de Entradas de Log

### Estructura de Entrada de Log

```typescript
interface LogEntry {
  timestamp: Date;
  service: string;
  message: string;
  level?: 'error' | 'warn' | 'info' | 'debug';
}
```

### Procesamiento de Entradas de Log

```typescript
addLogEntry(entry: LogEntry): void {
  // Agregar al buffer para búsqueda e historial
  this.logBuffer.push(entry);

  // Limitar tamaño del buffer para prevenir problemas de memoria
  if (this.logBuffer.length > this.maxLines) {
    this.logBuffer.shift();
  }

  // Formatear y mostrar entrada de log
  const formattedMessage = this.formatLogEntry(entry);
  this.appendToWidget(formattedMessage);

  // Auto-desplazar si siguiendo
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

### Procesamiento de Log Crudo

```typescript
addRawLog(message: string, service = 'desconocido'): void {
  const lines = message.split('\n');

  for (const line of lines) {
    if (line.trim()) {
      // Parsear nivel de log del mensaje
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

## 🎨 Formato Visual

### Niveles de Log Codificados por Color

```typescript
private getLevelColor(level?: LogEntry['level']): string {
  switch (level) {
    case 'error': return 'red';       // Errores críticos
    case 'warn': return 'yellow';     // Advertencias
    case 'info': return 'green';      // Informativo
    case 'debug': return 'blue';      // Información de debug
    default: return 'white';          // Por defecto/desconocido
  }
}
```

### Formato de Timestamp

```typescript
private formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

// Alternativa: formato ISO
private formatTimestampISO(date: Date): string {
  return date.toISOString().substring(11, 19); // HH:MM:SS
}

// Alternativa: tiempo relativo
private formatTimestampRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `hace ${seconds}s`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
  return `hace ${Math.floor(seconds / 3600)}h`;
}
```

### Iconos de Nivel de Log

```typescript
private getLevelIcon(level?: LogEntry['level']): string {
  switch (level) {
    case 'error': return '✗';  // Símbolo de error
    case 'warn': return '⚠';   // Símbolo de advertencia
    case 'info': return 'ℹ';   // Símbolo de información
    case 'debug': return '🐛'; // Símbolo de debug
    default: return '○';       // Símbolo por defecto
  }
}
```

## ⌨️ Navegación por Teclado

### Controles Primarios

```typescript
private setupKeyBindings(): void {
  // Alternar modo seguimiento
  this.widget.key(['f', 'F'], () => {
    this.toggleFollow();
  });

  // Limpiar logs
  this.widget.key(['c', 'C'], () => {
    this.clear();
  });

  // Controles de desplazamiento
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

  // Funcionalidad de búsqueda
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

### Gestión de Desplazamiento

```typescript
private scrollUp(): void {
  this.isFollowing = false; // Deshabilitar seguimiento al desplazar manualmente
  this.widget.scroll(-5);   // Desplazar arriba 5 líneas
  this.updateFollowStatus();
  this.widget.screen?.render();
}

private scrollDown(): void {
  this.widget.scroll(5);    // Desplazar abajo 5 líneas

  // Re-habilitar seguimiento si se desplazó al final
  if (this.isAtBottom()) {
    this.isFollowing = true;
    this.updateFollowStatus();
  }

  this.widget.screen?.render();
}

private isAtBottom(): boolean {
  const lines = this.widget.getScreenLines();
  const visibleHeight = this.widget.height as number - 2; // Restar borde
  return this.widget.getScroll() >= lines.length - visibleHeight;
}
```

### Gestión de Modo Seguimiento

```typescript
private toggleFollow(): void {
  this.isFollowing = !this.isFollowing;

  const statusMessage = this.isFollowing ? 'Modo seguimiento habilitado' : 'Modo seguimiento deshabilitado';
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
  const followIndicator = this.isFollowing ? ' [SIGUIENDO]' : '';
  const currentLabel = this.currentService ?
    ` Logs - ${this.currentService}${followIndicator} ` :
    ` Logs${followIndicator} `;

  this.widget.setLabel(currentLabel);
}
```

## 🔍 Búsqueda y Filtrado

### Implementación de Búsqueda

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
      label: ' Buscar Logs ',
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

    // Buscar a través del buffer de logs
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

    // Desplazar para mostrar el resultado
    this.scrollToLogEntry(resultIndex);

    // Resaltar el término en el mensaje
    this.highlightTermInLogs(this.searchTerm);
  }
}
```

### Filtrado por Nivel de Log

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
      this.widget.setLabel(` Logs - Filtrado: ${filterList} `);
    } else {
      this.widget.setLabel(' Logs ');
    }
  }
}
```

## 🔄 Logging Específico por Servicio

### Selección de Servicio

```typescript
setService(serviceName: string): void {
  this.currentService = serviceName;
  this.widget.setLabel(` Logs - ${serviceName} `);

  this.clear();
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: `Mostrando logs para servicio: ${serviceName}`,
    level: 'info'
  });

  // Iniciar streaming de logs para este servicio
  this.startLogStreaming(serviceName);
}

showAllServices(): void {
  this.currentService = undefined;
  this.widget.setLabel(' Logs - Todos los Servicios ');

  this.clear();
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: 'Mostrando logs para todos los servicios',
    level: 'info'
  });

  // Iniciar streaming de logs para todos los servicios
  this.startLogStreaming();
}
```

### Agregación de Logs Multi-Servicio

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
          message: `Error en stream de logs: ${error.message}`,
          level: 'error'
        });
      });

      this.serviceStreams.set(serviceName, logStream);
    } catch (error) {
      this.addLogEntry({
        timestamp: new Date(),
        service: serviceName,
        message: `Falló al iniciar stream de logs: ${(error as Error).message}`,
        level: 'error'
      });
    }
  }

  private processLogChunk(chunk: Buffer, serviceName: string): void {
    const lines = chunk.toString().split('\n');

    for (const line of lines) {
      if (line.trim()) {
        // Parsear formato de log Docker/Podman
        const parsedEntry = this.parseDockerLogLine(line, serviceName);
        if (parsedEntry) {
          this.addLogEntry(parsedEntry);
        }
      }
    }
  }

  private parseDockerLogLine(line: string, serviceName: string): LogEntry | null {
    // Formato Docker: timestamp + mensaje
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(.*)$/);

    if (timestampMatch) {
      const [, timestampStr, message] = timestampMatch;
      return {
        timestamp: new Date(timestampStr),
        service: serviceName,
        message: message.trim(),
        level: this.detectLogLevel(message)
      };
    }

    // Formato sin timestamp
    return {
      timestamp: new Date(),
      service: serviceName,
      message: line.trim(),
      level: this.detectLogLevel(line)
    };
  }
}
```

## 🎨 Características Visuales Avanzadas

### Resaltado de Texto

```typescript
private highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, '{yellow-bg}{black-fg}$1{/black-fg}{/yellow-bg}');
}

private escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### Agrupación por Tiempo

```typescript
private shouldShowTimestamp(currentEntry: LogEntry, previousEntry?: LogEntry): boolean {
  if (!previousEntry) return true;

  const timeDiff = currentEntry.timestamp.getTime() - previousEntry.timestamp.getTime();
  return timeDiff > 60000; // Mostrar timestamp si > 1 minuto de diferencia
}

private addTimeGroupSeparator(timestamp: Date): void {
  const timeGroup = this.formatTimeGroup(timestamp);
  this.appendToWidget(`{gray-fg}─── ${timeGroup} ───{/gray-fg}`);
}

private formatTimeGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const logDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (logDate.getTime() === today.getTime()) {
    return 'Hoy';
  } else if (logDate.getTime() === today.getTime() - 86400000) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-ES');
  }
}
```

## 🚨 Manejo de Errores

### Recuperación de Stream de Logs

```typescript
private handleStreamError(serviceName: string, error: Error): void {
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: `Error en stream de logs para ${serviceName}: ${error.message}`,
    level: 'error'
  });

  // Intentar reconectar después de un retraso
  setTimeout(() => {
    this.reconnectLogStream(serviceName);
  }, 5000);
}

private async reconnectLogStream(serviceName: string): Promise<void> {
  try {
    this.addLogEntry({
      timestamp: new Date(),
      service: 'dockronos',
      message: `Reintentando conexión a logs de ${serviceName}...`,
      level: 'info'
    });

    await this.startSingleServiceStream(serviceName);
  } catch (error) {
    this.addLogEntry({
      timestamp: new Date(),
      service: 'dockronos',
      message: `Falló reconexión para ${serviceName}: ${(error as Error).message}`,
      level: 'error'
    });
  }
}
```

### Estados de Carga y Error

```typescript
private showLoadingState(serviceName: string): void {
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: `Cargando logs para ${serviceName}...`,
    level: 'info'
  });
}

private showEmptyState(): void {
  this.widget.setContent('No hay logs disponibles. Selecciona un servicio para ver sus logs.');
  this.widget.screen?.render();
}

private showConnectionError(): void {
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: 'Error de conexión con el motor de contenedores',
    level: 'error'
  });
}
```

## 🔧 Ciclo de Vida del Componente

### Inicialización

```typescript
constructor(options: LogsPanelOptions) {
  this.setupWidget(options);
  this.setupKeyBindings();
  this.initializeLogBuffer();
  this.addWelcomeMessage();
}

private addWelcomeMessage(): void {
  this.addLogEntry({
    timestamp: new Date(),
    service: 'dockronos',
    message: 'Panel de logs inicializado. Presiona ? para ayuda.',
    level: 'info'
  });
}
```

### Limpieza

```typescript
destroy(): void {
  // Detener todos los streams de logs
  for (const [serviceName, stream] of this.serviceStreams) {
    stream.destroy();
  }
  this.serviceStreams.clear();

  // Limpiar buffer de logs
  this.logBuffer = [];

  // Limpiar temporizadores
  if (this.searchTimer) {
    clearTimeout(this.searchTimer);
  }

  // Remover event listeners
  this.widget.removeAllListeners();

  // Destruir widget
  this.widget.destroy();
}
```

### Persistencia de Logs

```typescript
async saveLogsToFile(filePath: string): Promise<void> {
  const logLines = this.logBuffer.map(entry => {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level ? `[${entry.level.toUpperCase()}]` : '';
    return `${timestamp} [${entry.service}] ${level} ${entry.message}`;
  });

  await writeFile(filePath, logLines.join('\n'), 'utf-8');
}

async exportLogs(format: 'txt' | 'json' | 'csv' = 'txt'): Promise<string> {
  switch (format) {
    case 'json':
      return JSON.stringify(this.logBuffer, null, 2);
    case 'csv':
      return this.exportToCSV();
    default:
      return this.logBuffer.map(entry =>
        `${entry.timestamp.toISOString()} [${entry.service}] ${entry.level || ''} ${entry.message}`
      ).join('\n');
  }
}
```

---

*El componente Panel de Logs proporciona una interfaz completa para visualización y gestión de logs en tiempo real. Su arquitectura robusta soporta múltiples servicios, búsqueda avanzada y formato inteligente mientras mantiene excelente rendimiento y experiencia de usuario.*