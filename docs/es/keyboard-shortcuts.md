# Referencia de Atajos de Teclado

Domina Dockronos con navegación eficiente por teclado. Esta guía cubre todos los atajos de teclado disponibles en la Interfaz de Usuario de Terminal (TUI) interactiva.

## 🎯 Tarjeta de Referencia Rápida

### Atajos Esenciales
| Tecla | Acción | Contexto |
|-------|--------|----------|
| `?` | Mostrar/ocultar ayuda | Global |
| `Tab` | Cambiar paneles | Global |
| `Q` / `Ctrl+C` | Salir de la aplicación | Global |
| `F5` / `R` | Actualizar datos | Global |
| `Escape` | Volver a Servicios | Global |

### Navegación de Paneles
| Tecla | Acción | Descripción |
|-------|--------|-------------|
| `1` | Saltar al panel de Servicios | Acceso directo a gestión de contenedores |
| `2` | Saltar al panel de Métricas | Acceso directo a monitoreo |
| `3` | Saltar al panel de Logs | Acceso directo a transmisión de logs |

## 🖼️ Diseño de la Interfaz

```
┌─────────────────────────────────────────────────────────────────┐
│ Panel Servicios (1)       │ Panel Métricas (2)                 │
│ ┌─ Lista de Servicios ──┐  │ ┌─ Métricas del Sistema ────────┐ │
│ │ ▶ web-frontend  [UP] │  │ │ CPU:  [████░░░░] 45%          │ │
│ │   api-backend   [UP] │  │ │ RAM:  [██████░░] 72%          │ │
│ │   database    [DOWN] │  │ │ DISK: [███░░░░░] 38%          │ │
│ │ ▶ redis-cache   [UP] │  │ │                               │ │
│ └─────────────────────┘  │ │ Métricas de Contenedores      │ │
│                          │ │ ┌─────────────────────────────┐ │ │
│ Acciones:                │ │ │ web-frontend:               │ │ │
│ S - Iniciar  R - Reiniciar│ │ │   CPU: 12%  RAM: 45MB      │ │ │
│ X - Detener  D - Logs    │ │ │ api-backend:                │ │ │
│ E - Editar Env           │ │ │   CPU: 8%   RAM: 32MB      │ │ │
│                          │ │ └─────────────────────────────┘ │ │
│                          │ └───────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Panel de Logs (3)                                              │
│ ┌─ Logs: web-frontend ────────────────────────────────────────┐ │
│ │ 2024-01-15 10:30:15 [INFO] Servidor iniciando en puerto 3000│ │
│ │ 2024-01-15 10:30:16 [INFO] Conectado a la base de datos   │ │
│ │ 2024-01-15 10:30:17 [INFO] Aplicación lista               │ │
│ │ 2024-01-15 10:30:18 [INFO] GET /api/health → 200          │ │
│ │ ▼                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Estado: Listo | Motor: Docker | Presiona ? para ayuda          │
└─────────────────────────────────────────────────────────────────┘
```

## 🌍 Atajos Globales

Estos atajos funcionan desde cualquier panel en la interfaz:

### Navegación
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Tab` | Cambiar paneles | Mover foco: Servicios → Métricas → Logs → Servicios |
| `Shift+Tab` | Ciclo inverso | Mover foco: Logs → Métricas → Servicios → Logs |
| `1` | Panel Servicios | Saltar directamente al panel de Servicios |
| `2` | Panel Métricas | Saltar directamente al panel de Métricas |
| `3` | Panel Logs | Saltar directamente al panel de Logs |
| `Escape` | Volver a Servicios | Siempre regresar al panel de Servicios |

### Control de Aplicación
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Q` | Salir de aplicación | Cerrar Dockronos |
| `Ctrl+C` | Salida forzada | Salida forzada (igual que Q) |
| `Ctrl+Z` | Suspender | Suspender en segundo plano (Linux/macOS) |
| `Ctrl+L` | Limpiar pantalla | Actualizar toda la pantalla |

### Información y Ayuda
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `?` | Alternar ayuda | Mostrar/ocultar overlay de ayuda |
| `F1` | Mostrar ayuda | Tecla de ayuda alternativa |
| `H` | Mostrar ayuda | Tecla de ayuda alternativa |

### Actualización de Datos
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `F5` | Actualizar todo | Actualizar contenedores, métricas y logs |
| `R` | Actualizar todo | Tecla de actualización alternativa |
| `Ctrl+R` | Actualización forzada | Forzar actualización de todos los datos |

## 🚀 Atajos del Panel de Servicios

El panel de Servicios es el centro de control principal para la gestión de contenedores:

### Navegación
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `↑` / `K` | Subir | Navegar hacia arriba en la lista de servicios |
| `↓` / `J` | Bajar | Navegar hacia abajo en la lista de servicios |
| `Home` | Primer elemento | Saltar al primer servicio |
| `End` | Último elemento | Saltar al último servicio |
| `Page Up` | Página arriba | Subir una página |
| `Page Down` | Página abajo | Bajar una página |
| `G` | Ir al inicio | Saltar al primer servicio |
| `Shift+G` | Ir al final | Saltar al último servicio |

### Gestión de Servicios
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Enter` | Seleccionar servicio | Seleccionar/resaltar el servicio actual |
| `Space` | Alternar selección | Alternar selección del servicio |
| `S` | Iniciar servicio | Iniciar el servicio seleccionado |
| `X` | Detener servicio | Detener el servicio seleccionado |
| `R` | Reiniciar servicio | Reiniciar el servicio seleccionado |
| `P` | Pausar servicio | Pausar el servicio seleccionado |
| `U` | Despausar servicio | Despausar el servicio seleccionado |

### Información de Servicios
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `D` | Mostrar logs | Cambiar a logs del servicio seleccionado |
| `I` | Info del servicio | Mostrar información detallada del servicio |
| `Enter` | Detalles del servicio | Mostrar modal de detalles del servicio |
| `L` | Listar contenedores | Mostrar contenedores para este servicio |

### Entorno y Configuración
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `E` | Editar entorno | Abrir editor de entorno |
| `C` | Editar config | Editar configuración del servicio |
| `V` | Ver compose | Ver archivo docker-compose |
| `O` | Abrir directorio | Abrir directorio del servicio (si es compatible) |

### Operaciones en Lote
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Ctrl+A` | Seleccionar todo | Seleccionar todos los servicios |
| `Ctrl+D` | Deseleccionar todo | Deseleccionar todos los servicios |
| `Shift+S` | Iniciar seleccionados | Iniciar todos los servicios seleccionados |
| `Shift+X` | Detener seleccionados | Detener todos los servicios seleccionados |
| `Shift+R` | Reiniciar seleccionados | Reiniciar todos los servicios seleccionados |

## 📊 Atajos del Panel de Métricas

Monitorear el rendimiento del sistema y contenedores:

### Navegación
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `↑` / `K` | Métrica anterior | Navegar hacia arriba en la lista de métricas |
| `↓` / `J` | Métrica siguiente | Navegar hacia abajo en la lista de métricas |
| `Tab` | Siguiente sección | Moverse entre métricas del Sistema/Contenedores |
| `Shift+Tab` | Sección anterior | Moverse a la sección anterior de métricas |

### Opciones de Visualización
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `G` | Alternar gráficos | Cambiar entre vista de texto y gráficos |
| `T` | Alternar texto | Cambiar a métricas solo texto |
| `B` | Alternar barras | Cambiar a vista de gráfico de barras |
| `L` | Alternar líneas | Cambiar a gráfico de líneas |
| `H` | Alternar historial | Mostrar/ocultar datos históricos |

### Controles de Métricas
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Enter` | Expandir métrica | Mostrar información detallada de la métrica |
| `Space` | Pausar actualizaciones | Pausar actualizaciones de métricas en tiempo real |
| `R` | Restablecer vista | Restablecer vista de métricas por defecto |
| `Z` | Línea base cero | Restablecer línea base de métricas a cero |

### Controles de Tiempo
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `+` / `=` | Acercar | Disminuir rango de tiempo (más detalle) |
| `-` | Alejar | Aumentar rango de tiempo (menos detalle) |
| `0` | Restablecer zoom | Restablecer al rango de tiempo por defecto |
| `←` | Desplazar izquierda | Desplazarse hacia atrás en el tiempo |
| `→` | Desplazar derecha | Desplazarse hacia adelante en el tiempo |

## 📝 Atajos del Panel de Logs

Navegar y gestionar eficientemente la salida de logs:

### Navegación
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `↑` / `K` | Desplazar arriba | Desplazarse una línea hacia arriba |
| `↓` / `J` | Desplazar abajo | Desplazarse una línea hacia abajo |
| `Page Up` | Página arriba | Desplazarse una página hacia arriba |
| `Page Down` | Página abajo | Desplazarse una página hacia abajo |
| `Home` | Ir al inicio | Saltar a la primera entrada de log |
| `End` | Ir al final | Saltar a la última entrada de log |
| `G` | Ir al inicio | Alternativa a Home |
| `Shift+G` | Ir al final | Alternativa a End |

### Control de Logs
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `F` | Alternar seguimiento | Habilitar/deshabilitar auto-seguimiento de nuevos logs |
| `A` | Auto-desplazar | Alternar desplazamiento automático |
| `P` | Pausar logs | Pausar transmisión de logs |
| `C` | Limpiar logs | Limpiar buffer de logs actual |
| `Ctrl+L` | Limpiar pantalla | Limpiar visualización de logs |

### Opciones de Visualización
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `T` | Alternar timestamps | Mostrar/ocultar timestamps |
| `N` | Alternar números de línea | Mostrar/ocultar números de línea |
| `W` | Alternar ajuste de texto | Habilitar/deshabilitar ajuste de palabras |
| `H` | Alternar resaltado | Habilitar/deshabilitar resaltado de sintaxis |
| `L` | Alternar niveles de log | Mostrar/ocultar indicadores de nivel de log |

### Búsqueda y Filtrado
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `/` | Buscar hacia adelante | Buscar texto en logs |
| `?` | Buscar hacia atrás | Buscar hacia atrás en logs |
| `N` | Siguiente coincidencia | Ir al siguiente resultado de búsqueda |
| `Shift+N` | Coincidencia anterior | Ir al resultado anterior de búsqueda |
| `Ctrl+F` | Filtrar logs | Filtrar logs por patrón |
| `Ctrl+G` | Limpiar filtro | Limpiar filtro actual |

### Selección de Servicios
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `S` | Seleccionar servicio | Elegir qué logs de servicio mostrar |
| `A` | Todos los servicios | Mostrar logs de todos los servicios |
| `M` | Multi-seleccionar | Seleccionar múltiples servicios |
| `Tab` | Siguiente servicio | Cambiar a logs del siguiente servicio |
| `Shift+Tab` | Servicio anterior | Cambiar a logs del servicio anterior |

### Exportar y Guardar
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Ctrl+S` | Guardar logs | Guardar logs actuales a archivo |
| `Ctrl+E` | Exportar logs | Exportar logs con filtros |
| `Ctrl+C` | Copiar selección | Copiar líneas de log seleccionadas |

## 🔧 Atajos de Modales y Diálogos

Cuando los diálogos y modales están abiertos:

### Navegación General de Modales
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Escape` | Cerrar modal | Cerrar modal/diálogo actual |
| `Enter` | Confirmar | Confirmar acción o cerrar modal de información |
| `Tab` | Siguiente campo | Moverse al siguiente campo del formulario |
| `Shift+Tab` | Campo anterior | Moverse al campo anterior del formulario |
| `Space` | Alternar opción | Alternar opciones de checkbox/radio |

### Modal de Ayuda
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `?` | Cerrar ayuda | Cerrar overlay de ayuda |
| `Escape` | Cerrar ayuda | Alternativa para cerrar ayuda |
| `↑` / `↓` | Desplazar ayuda | Desplazarse por el contenido de ayuda |
| `Page Up/Down` | Paginar ayuda | Paginar por el contenido de ayuda |

### Editor de Entorno
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Ctrl+S` | Guardar cambios | Guardar cambios de entorno |
| `Ctrl+Q` | Descartar cambios | Descartar cambios y cerrar |
| `Ctrl+Z` | Deshacer | Deshacer último cambio |
| `Ctrl+Y` | Rehacer | Rehacer último cambio deshecho |

## 📱 Atajos Específicos de Contexto

### Cuando un Servicio está Seleccionado
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Enter` | Ver detalles del servicio | Mostrar información detallada del servicio |
| `D` | Ver logs para este servicio | Cambiar al panel de logs para el servicio seleccionado |
| `I` | Mostrar información del servicio | Mostrar estado y configuración del servicio |
| `E` | Editar entorno del servicio | Abrir editor de variables de entorno |

### Cuando está en Modo Seguimiento (Logs)
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `F` | Deshabilitar modo seguimiento | Dejar de seguir automáticamente nuevas entradas de log |
| `Space` | Pausar/reanudar seguimiento | Pausar temporalmente el seguimiento de logs |
| `End` | Saltar al final (logs más recientes) | Ir a las entradas de log más recientes |

### Cuando las Métricas están Pausadas
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Space` | Reanudar actualizaciones de métricas | Continuar recolección de métricas en tiempo real |
| `R` | Forzar actualización de métricas | Actualizar manualmente todas las métricas |
| `Enter` | Reanudar y expandir métrica actual | Reanudar actualizaciones y mostrar vista detallada |

## 🎨 Navegación Estilo Vi/Vim

Para usuarios familiarizados con Vi/Vim, muchos atajos siguen las convenciones de Vi:

### Movimiento (Estilo Vi)
| Atajo | Acción | Equivalente Vi |
|-------|--------|----------------|
| `J` | Bajar | `j` |
| `K` | Subir | `k` |
| `H` | Izquierda | `h` |
| `L` | Derecha | `l` |
| `G` | Ir al inicio | `gg` |
| `Shift+G` | Ir al final | `G` |
| `0` | Inicio de línea | `0` |
| `$` | Final de línea | `$` |

### Acciones (Estilo Vi)
| Atajo | Acción | Equivalente Vi |
|-------|--------|----------------|
| `/` | Buscar hacia adelante | `/` |
| `?` | Buscar hacia atrás | `?` |
| `N` | Siguiente resultado de búsqueda | `n` |
| `Shift+N` | Resultado anterior de búsqueda | `N` |

## 🔄 Atajos Avanzados

### Características para Usuarios Expertos
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Ctrl+Shift+R` | Recargar config | Recargar archivo de configuración |
| `Ctrl+Shift+D` | Modo debug | Alternar visualización de información de debug |
| `Alt+1/2/3` | Cambio rápido de panel | Cambio alternativo de paneles |
| `Ctrl+T` | Nueva pestaña | Abrir nueva pestaña de servicio (característica futura) |

### Accesibilidad
| Atajo | Acción | Descripción |
|-------|--------|-------------|
| `Alt+H` | Alto contraste | Alternar modo de alto contraste |
| `Alt+L` | Texto grande | Alternar modo de texto grande |
| `Alt+S` | Lector de pantalla | Modo de compatibilidad con lector de pantalla |

## 📋 Personalización

### Atajos Personalizados

Puedes personalizar atajos en tu archivo de configuración:

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

### Deshabilitar Atajos

Deshabilitar atajos específicos:

```yaml
ui:
  shortcuts:
    disabled: ["F1", "Ctrl+R"]
```

## 🎯 Ejemplos de Flujos de Trabajo

### Flujo de Trabajo de Desarrollo Diario
```
1. Iniciar Dockronos: dockronos
2. Verificar estado de servicios: Exploración visual en Panel de Servicios
3. Iniciar servicios: S (para cada servicio necesario)
4. Monitorear inicio: 2 (Panel de Métricas) → observar CPU/RAM
5. Verificar logs: 3 (Panel de Logs) → D (para servicio específico)
6. Trabajo de desarrollo...
7. Reiniciar servicio después de cambios: 1 → ↓/↑ para seleccionar → R
8. Detener servicios: X (para cada servicio) o Ctrl+A → Shift+X
9. Salir: Q
```

### Flujo de Trabajo de Debugging
```
1. Iniciar con servicio específico: 1 → ↓/↑ para encontrar servicio
2. Ver logs: D → 3 (Panel de Logs)
3. Habilitar seguimiento: F
4. Filtrar logs: Ctrl+F → ingresar patrón
5. Buscar errores: / → "error"
6. Monitorear recursos: 2 → observar métricas
7. Reiniciar si es necesario: 1 → R
8. Limpiar logs para inicio fresco: 3 → C
```

### Gestión de Múltiples Servicios
```
1. Seleccionar múltiples servicios: 1 → Ctrl+A (o selección individual)
2. Iniciar todos: Shift+S
3. Monitorear inicio: 2 → observar todos los contenedores
4. Verificar logs individuales: 3 → Tab (ciclar por servicios)
5. Detener todos: 1 → Ctrl+A → Shift+X
```

## 🆘 Atajos de Emergencia

### Cuando las Cosas Salen Mal
| Atajo | Acción | Usar Cuando |
|-------|--------|-------------|
| `Ctrl+C` | Salida forzada | La aplicación no responde |
| `Ctrl+L` | Actualizar pantalla | Pantalla corrupta o texto ilegible |
| `Ctrl+Z` | Suspender | Necesitas acceder al shell rápidamente |
| `Escape` | Cancelar operación | Atascado en modal u operación |
| `Q` | Salida segura | Salida normal de la aplicación |

### Acciones de Recuperación
```bash
# Si se suspendió con Ctrl+Z
fg  # Volver a Dockronos

# Si la pantalla está corrupta
reset  # Restablecer terminal (después de salir)

# Si el terminal no responde
pkill -f dockronos  # Desde otro terminal
```

## 💡 Consejos y Trucos

### Consejos de Eficiencia
1. **Usa teclas numéricas** (1, 2, 3) para cambio rápido de paneles
2. **Domina el ciclo Tab** para flujo de trabajo suave
3. **Aprende atajos de servicios** (S, X, R, D) para acciones comunes
4. **Usa búsqueda en logs** (/) para encontrar entradas específicas rápidamente
5. **Combina atajos**: Ctrl+A → Shift+S (seleccionar todo → iniciar todo)

### Atajos para Usuarios Expertos
1. **Navegación Vi**: Usa J/K para movimiento si eres usuario de Vi
2. **Acceso rápido a servicios**: Usa primera letra del nombre del servicio para selección rápida
3. **Operaciones en lote**: Selecciona múltiples servicios antes de acciones
4. **Gestión de logs**: Usa F (seguir) + C (limpiar) para debugging limpio

### Accesibilidad
1. **Alto contraste**: Alt+H para mejor visibilidad
2. **Texto más grande**: Alt+L para legibilidad
3. **Lector de pantalla**: Alt+S para herramientas de accesibilidad

---

*¡Domina estos atajos para convertirte en un usuario experto de Dockronos! Imprime esta referencia o guárdala como marcador para acceso rápido durante el desarrollo.*