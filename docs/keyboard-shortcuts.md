# Keyboard Shortcuts Reference

Master Dockronos with efficient keyboard navigation. This guide covers all keyboard shortcuts available in the interactive Terminal User Interface (TUI).

## 🎯 Quick Reference Card

### Essential Shortcuts
| Key | Action | Context |
|-----|--------|---------|
| `?` | Show/hide help | Global |
| `Tab` | Cycle panels | Global |
| `Q` / `Ctrl+C` | Quit application | Global |
| `F5` / `R` | Refresh data | Global |
| `Escape` | Return to Services | Global |

### Panel Navigation
| Key | Action | Description |
|-----|--------|-------------|
| `1` | Jump to Services panel | Direct access to container management |
| `2` | Jump to Metrics panel | Direct access to monitoring |
| `3` | Jump to Logs panel | Direct access to log streaming |

## 🖼️ Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Services Panel (1)        │ Metrics Panel (2)                  │
│ ┌─ Service List ────────┐  │ ┌─ System Metrics ──────────────┐ │
│ │ ▶ web-frontend  [UP] │  │ │ CPU:  [████░░░░] 45%          │ │
│ │   api-backend   [UP] │  │ │ RAM:  [██████░░] 72%          │ │
│ │   database    [DOWN] │  │ │ DISK: [███░░░░░] 38%          │ │
│ │ ▶ redis-cache   [UP] │  │ │                               │ │
│ └─────────────────────┘  │ │ Container Metrics             │ │
│                          │ │ ┌─────────────────────────────┐ │ │
│ Actions:                 │ │ │ web-frontend:               │ │ │
│ S - Start    R - Restart │ │ │   CPU: 12%  RAM: 45MB      │ │ │
│ X - Stop     D - Logs    │ │ │ api-backend:                │ │ │
│ E - Edit Env             │ │ │   CPU: 8%   RAM: 32MB      │ │ │
│                          │ │ └─────────────────────────────┘ │ │
│                          │ └───────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Logs Panel (3)                                                  │
│ ┌─ Logs: web-frontend ────────────────────────────────────────┐ │
│ │ 2024-01-15 10:30:15 [INFO] Server starting on port 3000    │ │
│ │ 2024-01-15 10:30:16 [INFO] Connected to database           │ │
│ │ 2024-01-15 10:30:17 [INFO] Application ready               │ │
│ │ 2024-01-15 10:30:18 [INFO] GET /api/health → 200           │ │
│ │ ▼                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Status: Ready | Engine: Docker | Press ? for help              │
└─────────────────────────────────────────────────────────────────┘
```

## 🌍 Global Shortcuts

These shortcuts work from any panel in the interface:

### Navigation
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Tab` | Cycle panels | Move focus: Services → Metrics → Logs → Services |
| `Shift+Tab` | Reverse cycle | Move focus: Logs → Metrics → Services → Logs |
| `1` | Services panel | Jump directly to Services panel |
| `2` | Metrics panel | Jump directly to Metrics panel |
| `3` | Logs panel | Jump directly to Logs panel |
| `Escape` | Return to Services | Always return to Services panel |

### Application Control
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Q` | Quit application | Exit Dockronos |
| `Ctrl+C` | Force quit | Force exit (same as Q) |
| `Ctrl+Z` | Suspend | Suspend to background (Linux/macOS) |
| `Ctrl+L` | Clear screen | Refresh the entire display |

### Information & Help
| Shortcut | Action | Description |
|----------|--------|-------------|
| `?` | Toggle help | Show/hide help overlay |
| `F1` | Show help | Alternative help key |
| `H` | Show help | Alternative help key |

### Data Refresh
| Shortcut | Action | Description |
|----------|--------|-------------|
| `F5` | Refresh all | Refresh containers, metrics, and logs |
| `R` | Refresh all | Alternative refresh key |
| `Ctrl+R` | Hard refresh | Force refresh all data |

## 🚀 Services Panel Shortcuts

The Services panel is the main control center for container management:

### Navigation
| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `K` | Move up | Navigate up in service list |
| `↓` / `J` | Move down | Navigate down in service list |
| `Home` | First item | Jump to first service |
| `End` | Last item | Jump to last service |
| `Page Up` | Page up | Move up one page |
| `Page Down` | Page down | Move down one page |
| `G` | Go to top | Jump to first service |
| `Shift+G` | Go to bottom | Jump to last service |

### Service Management
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | Select service | Select/highlight the current service |
| `Space` | Toggle selection | Toggle service selection |
| `S` | Start service | Start the selected service |
| `X` | Stop service | Stop the selected service |
| `R` | Restart service | Restart the selected service |
| `P` | Pause service | Pause the selected service |
| `U` | Unpause service | Unpause the selected service |

### Service Information
| Shortcut | Action | Description |
|----------|--------|-------------|
| `D` | Show logs | Switch to logs for selected service |
| `I` | Service info | Show detailed service information |
| `Enter` | Service details | Show service details modal |
| `L` | List containers | Show containers for this service |

### Environment & Configuration
| Shortcut | Action | Description |
|----------|--------|-------------|
| `E` | Edit environment | Open environment editor |
| `C` | Edit config | Edit service configuration |
| `V` | View compose | View docker-compose file |
| `O` | Open directory | Open service directory (if supported) |

### Bulk Operations
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+A` | Select all | Select all services |
| `Ctrl+D` | Deselect all | Deselect all services |
| `Shift+S` | Start selected | Start all selected services |
| `Shift+X` | Stop selected | Stop all selected services |
| `Shift+R` | Restart selected | Restart all selected services |

## 📊 Metrics Panel Shortcuts

Monitor system and container performance:

### Navigation
| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `K` | Previous metric | Navigate up in metrics list |
| `↓` / `J` | Next metric | Navigate down in metrics list |
| `Tab` | Next section | Move between System/Container metrics |
| `Shift+Tab` | Previous section | Move to previous metrics section |

### Display Options
| Shortcut | Action | Description |
|----------|--------|-------------|
| `G` | Toggle graphs | Switch between text and graph view |
| `T` | Toggle text | Switch to text-only metrics |
| `B` | Toggle bars | Switch to bar chart view |
| `L` | Toggle lines | Switch to line graph view |
| `H` | Toggle history | Show/hide historical data |

### Metric Controls
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | Expand metric | Show detailed metric information |
| `Space` | Pause updates | Pause real-time metric updates |
| `R` | Reset view | Reset metric view to default |
| `Z` | Zero baseline | Reset metric baseline to zero |

### Time Controls
| Shortcut | Action | Description |
|----------|--------|-------------|
| `+` / `=` | Zoom in | Decrease time range (more detail) |
| `-` | Zoom out | Increase time range (less detail) |
| `0` | Reset zoom | Reset to default time range |
| `←` | Scroll left | Scroll back in time |
| `→` | Scroll right | Scroll forward in time |

## 📝 Logs Panel Shortcuts

Efficiently navigate and manage log output:

### Navigation
| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `K` | Scroll up | Scroll up one line |
| `↓` / `J` | Scroll down | Scroll down one line |
| `Page Up` | Page up | Scroll up one page |
| `Page Down` | Page down | Scroll down one page |
| `Home` | Go to top | Jump to first log entry |
| `End` | Go to bottom | Jump to last log entry |
| `G` | Go to top | Alternative to Home |
| `Shift+G` | Go to bottom | Alternative to End |

### Log Control
| Shortcut | Action | Description |
|----------|--------|-------------|
| `F` | Toggle follow | Enable/disable auto-follow new logs |
| `A` | Auto-scroll | Toggle automatic scrolling |
| `P` | Pause logs | Pause log streaming |
| `C` | Clear logs | Clear current log buffer |
| `Ctrl+L` | Clear screen | Clear log display |

### Display Options
| Shortcut | Action | Description |
|----------|--------|-------------|
| `T` | Toggle timestamps | Show/hide timestamps |
| `N` | Toggle line numbers | Show/hide line numbers |
| `W` | Toggle word wrap | Enable/disable word wrapping |
| `H` | Toggle highlighting | Enable/disable syntax highlighting |
| `L` | Toggle log levels | Show/hide log level indicators |

### Search & Filter
| Shortcut | Action | Description |
|----------|--------|-------------|
| `/` | Search forward | Search for text in logs |
| `?` | Search backward | Search backward in logs |
| `N` | Next match | Go to next search result |
| `Shift+N` | Previous match | Go to previous search result |
| `Ctrl+F` | Filter logs | Filter logs by pattern |
| `Ctrl+G` | Clear filter | Clear current filter |

### Service Selection
| Shortcut | Action | Description |
|----------|--------|-------------|
| `S` | Select service | Choose which service logs to show |
| `A` | All services | Show logs from all services |
| `M` | Multi-select | Select multiple services |
| `Tab` | Next service | Switch to next service logs |
| `Shift+Tab` | Previous service | Switch to previous service logs |

### Export & Save
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+S` | Save logs | Save current logs to file |
| `Ctrl+E` | Export logs | Export logs with filters |
| `Ctrl+C` | Copy selection | Copy selected log lines |

## 🔧 Modal & Dialog Shortcuts

When dialogs and modals are open:

### General Modal Navigation
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Escape` | Close modal | Close current modal/dialog |
| `Enter` | Confirm | Confirm action or close info modal |
| `Tab` | Next field | Move to next form field |
| `Shift+Tab` | Previous field | Move to previous form field |
| `Space` | Toggle option | Toggle checkbox/radio options |

### Help Modal
| Shortcut | Action | Description |
|----------|--------|-------------|
| `?` | Close help | Close help overlay |
| `Escape` | Close help | Alternative to close help |
| `↑` / `↓` | Scroll help | Scroll through help content |
| `Page Up/Down` | Page help | Page through help content |

### Environment Editor
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+S` | Save changes | Save environment changes |
| `Ctrl+Q` | Discard changes | Discard changes and close |
| `Ctrl+Z` | Undo | Undo last change |
| `Ctrl+Y` | Redo | Redo last undone change |

## 📱 Context-Specific Shortcuts

### When Service is Selected
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | View service details | Show detailed service information |
| `D` | View logs for this service | Switch to logs panel for selected service |
| `I` | Show service information | Display service status and configuration |
| `E` | Edit service environment | Open environment variable editor |

### When in Follow Mode (Logs)
| Shortcut | Action | Description |
|----------|--------|-------------|
| `F` | Disable follow mode | Stop automatically following new log entries |
| `Space` | Pause/resume following | Temporarily pause log following |
| `End` | Jump to bottom (latest logs) | Go to most recent log entries |

### When Metrics are Paused
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Space` | Resume metric updates | Continue real-time metric collection |
| `R` | Force refresh metrics | Manually refresh all metrics |
| `Enter` | Resume and expand current metric | Resume updates and show detailed view |

## 🎨 Vi/Vim-Style Navigation

For users familiar with Vi/Vim, many shortcuts follow Vi conventions:

### Movement (Vi-style)
| Shortcut | Action | Vi Equivalent |
|----------|--------|---------------|
| `J` | Move down | `j` |
| `K` | Move up | `k` |
| `H` | Move left | `h` |
| `L` | Move right | `l` |
| `G` | Go to top | `gg` |
| `Shift+G` | Go to bottom | `G` |
| `0` | Beginning of line | `0` |
| `$` | End of line | `$` |

### Actions (Vi-style)
| Shortcut | Action | Vi Equivalent |
|----------|--------|---------------|
| `/` | Search forward | `/` |
| `?` | Search backward | `?` |
| `N` | Next search result | `n` |
| `Shift+N` | Previous search result | `N` |

## 🔄 Advanced Shortcuts

### Power User Features
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+R` | Reload config | Reload configuration file |
| `Ctrl+Shift+D` | Debug mode | Toggle debug information display |
| `Alt+1/2/3` | Quick panel switch | Alternative panel switching |
| `Ctrl+T` | New tab | Open new service tab (future feature) |

### Accessibility
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt+H` | High contrast | Toggle high contrast mode |
| `Alt+L` | Large text | Toggle large text mode |
| `Alt+S` | Screen reader | Screen reader compatibility mode |

## 📋 Customization

### Custom Shortcuts

You can customize shortcuts in your configuration file:

```yaml
# dockronos.yml
ui:
  shortcuts:
    quit: "q"
    help: "?"
    refresh: ["F5", "r"]
    panels:
      services: "1"
      metrics: "2"
      logs: "3"
    services:
      start: "s"
      stop: "x"
      restart: "r"
      logs: "d"
      edit_env: "e"
```

### Disabling Shortcuts

Disable specific shortcuts:

```yaml
ui:
  shortcuts:
    disabled: ["F1", "Ctrl+R"]
```

## 🎯 Workflow Examples

### Daily Development Workflow
```
1. Start Dockronos: dockronos
2. Check service status: Visual scan in Services panel
3. Start services: S (for each needed service)
4. Monitor startup: 2 (Metrics panel) → watch CPU/RAM
5. Check logs: 3 (Logs panel) → D (for specific service)
6. Development work...
7. Restart service after changes: 1 → ↓/↑ to select → R
8. Stop services: X (for each service) or Ctrl+A → Shift+X
9. Quit: Q
```

### Debugging Workflow
```
1. Start with specific service: 1 → ↓/↑ to find service
2. View logs: D → 3 (Logs panel)
3. Enable following: F
4. Filter logs: Ctrl+F → enter pattern
5. Search for errors: / → "error"
6. Monitor resources: 2 → watch metrics
7. Restart if needed: 1 → R
8. Clear logs for fresh start: 3 → C
```

### Multi-Service Management
```
1. Select multiple services: 1 → Ctrl+A (or individual selection)
2. Start all: Shift+S
3. Monitor startup: 2 → watch all containers
4. Check individual logs: 3 → Tab (cycle through services)
5. Stop all: 1 → Ctrl+A → Shift+X
```

## 🆘 Emergency Shortcuts

### When Things Go Wrong
| Shortcut | Action | Use When |
|----------|--------|----------|
| `Ctrl+C` | Force quit | Application becomes unresponsive |
| `Ctrl+L` | Refresh display | Screen corruption or garbled display |
| `Ctrl+Z` | Suspend | Need to access shell quickly |
| `Escape` | Cancel operation | Stuck in modal or operation |
| `Q` | Safe quit | Normal application exit |

### Recovery Actions
```bash
# If suspended with Ctrl+Z
fg  # Return to Dockronos

# If display is corrupted
reset  # Reset terminal (after quitting)

# If terminal is unresponsive
pkill -f dockronos  # From another terminal
```

## 💡 Tips & Tricks

### Efficiency Tips
1. **Use number keys** (1, 2, 3) for quick panel switching
2. **Master Tab cycling** for smooth workflow
3. **Learn service shortcuts** (S, X, R, D) for common actions
4. **Use search in logs** (/) to find specific entries quickly
5. **Combine shortcuts**: Ctrl+A → Shift+S (select all → start all)

### Power User Shortcuts
1. **Vi navigation**: Use J/K for movement if you're a Vi user
2. **Quick service access**: Use first letter of service name for quick selection
3. **Bulk operations**: Select multiple services before actions
4. **Log management**: Use F (follow) + C (clear) for clean debugging

### Accessibility
1. **High contrast**: Alt+H for better visibility
2. **Larger text**: Alt+L for readability
3. **Screen reader**: Alt+S for accessibility tools

---

*Master these shortcuts to become a Dockronos power user! Print this reference or bookmark it for quick access during development.*