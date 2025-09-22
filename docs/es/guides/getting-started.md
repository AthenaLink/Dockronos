# Guía de Primeros Pasos

Bienvenido a Dockronos! Esta guía te llevará paso a paso desde la primera ejecución hasta el dominio de las características básicas para la gestión de contenedores.

## 🎯 ¿Qué Aprenderás?

Al final de esta guía, sabrás cómo:
- Ejecutar Dockronos por primera vez
- Navegar por la interfaz de tres paneles
- Gestionar contenedores (iniciar, detener, reiniciar)
- Monitorear métricas del sistema y contenedores
- Ver y gestionar logs
- Usar atajos de teclado esenciales
- Configurar tu primer proyecto

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener:
- ✅ Dockronos instalado ([Guía de Instalación](../installation.md))
- ✅ Docker o Podman ejecutándose
- ✅ Un terminal moderno con soporte de color
- ✅ Algunos contenedores para practicar (se proporcionan ejemplos)

## 🚀 Primera Ejecución

### Paso 1: Verificar la Instalación

```bash
# Verificar que Dockronos esté instalado
dockronos --version

# Verificar que Docker/Podman funcionen
docker --version
docker ps

# O si usas Podman
podman --version
podman ps
```

### Paso 2: Ejecutar Dockronos

```bash
# En cualquier directorio
dockronos

# O en un directorio de proyecto específico
cd mi-proyecto
dockronos
```

¡Felicitaciones! Has iniciado Dockronos. Deberías ver una interfaz de tres paneles.

## 🖼️ Comprensión de la Interfaz

Dockronos utiliza un diseño de tres paneles:

```
┌─────────────────────────────────────────────────────────┐
│ Panel de Servicios (1)     │ Panel de Métricas (2)     │
│ ┌─ Lista de Servicios ──┐  │ ┌─ Métricas del Sistema ─┐ │
│ │ ▶ web-frontend  [UP] │  │ │ CPU:  [████░░░] 45%    │ │
│ │   api-backend   [UP] │  │ │ RAM:  [██████░] 72%    │ │
│ │   database    [DOWN] │  │ │ DISK: [███░░░░] 38%    │ │
│ │ ▶ redis-cache   [UP] │  │ └─────────────────────────┘ │
│ └─────────────────────┘  │ ┌─ Métricas Contenedores ─┐ │
│                          │ │ web-frontend:           │ │
│ Acciones:                │ │   CPU: 12%  RAM: 45MB   │ │
│ S-Iniciar  R-Reiniciar   │ │ api-backend:            │ │
│ X-Detener  D-Logs        │ │   CPU: 8%   RAM: 32MB   │ │
│ E-Editar Entorno         │ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Panel de Logs (3)                                      │
│ ┌─ Logs: web-frontend ─────────────────────────────────┐ │
│ │ 2024-01-15 10:30:15 [INFO] Servidor iniciando...   │ │
│ │ 2024-01-15 10:30:16 [INFO] Conectado a la BD       │ │
│ │ 2024-01-15 10:30:17 [INFO] Aplicación lista        │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Estado: Listo | Motor: Docker | Presiona ? para ayuda  │
└─────────────────────────────────────────────────────────┘
```

### Los Tres Paneles

1. **Panel de Servicios (1)** - Gestión de contenedores
   - Lista todos los contenedores disponibles
   - Muestra el estado (ejecutándose, detenido, error)
   - Permite acciones (iniciar, detener, reiniciar, logs)

2. **Panel de Métricas (2)** - Monitoreo en tiempo real
   - Métricas del sistema (CPU, RAM, Disco)
   - Métricas por contenedor
   - Gráficos en tiempo real

3. **Panel de Logs (3)** - Transmisión de logs
   - Logs en tiempo real de contenedores
   - Capacidad de búsqueda y filtrado
   - Modo de seguimiento automático

## ⌨️ Navegación Básica

### Atajos Esenciales

| Tecla | Acción | Descripción |
|-------|--------|-------------|
| `?` | Ayuda | Muestra/oculta la ayuda |
| `Tab` | Cambiar panel | Navega entre paneles |
| `1` | Panel Servicios | Saltar directamente |
| `2` | Panel Métricas | Saltar directamente |
| `3` | Panel Logs | Saltar directamente |
| `Q` / `Ctrl+C` | Salir | Cerrar Dockronos |
| `F5` / `R` | Actualizar | Refrescar datos |

### Navegación en el Panel de Servicios

| Tecla | Acción |
|-------|--------|
| `↑` / `K` | Subir en la lista |
| `↓` / `J` | Bajar en la lista |
| `Enter` | Seleccionar servicio |
| `S` | Iniciar servicio |
| `X` | Detener servicio |
| `R` | Reiniciar servicio |
| `D` | Ver logs del servicio |

## 🐳 Gestión Básica de Contenedores

### Configurar un Proyecto de Ejemplo

Vamos a crear un proyecto simple para practicar:

```bash
# Crear directorio de proyecto
mkdir mi-primer-proyecto-dockronos
cd mi-primer-proyecto-dockronos

# Crear un archivo docker-compose.yml básico
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    environment:
      - NGINX_HOST=localhost
      - NGINX_PORT=80

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF

# Inicializar configuración de Dockronos (opcional)
dockronos init
```

### Iniciar Dockronos en el Proyecto

```bash
# Ejecutar Dockronos
dockronos
```

Ahora deberías ver tres servicios en el Panel de Servicios: `web`, `database`, y `redis`.

## 🎮 Tutorial Paso a Paso

### Tutorial 1: Iniciar Servicios

1. **Navegar a Servicios**: Presiona `1` o usa `Tab` hasta llegar al Panel de Servicios
2. **Seleccionar servicio**: Usa `↑`/`↓` para navegar hasta `database`
3. **Iniciar servicio**: Presiona `S` para iniciar la base de datos
4. **Observar cambios**: El estado debería cambiar a `[UP]` y ver actividad en Métricas
5. **Repetir**: Inicia `redis` y luego `web`

### Tutorial 2: Monitorear Métricas

1. **Ir a Métricas**: Presiona `2`
2. **Observar métricas del sistema**: Ve el uso de CPU, RAM y Disco
3. **Revisar métricas de contenedores**: Ve recursos por contenedor
4. **Modo tiempo real**: Las métricas se actualizan automáticamente cada 5 segundos

### Tutorial 3: Ver Logs

1. **Seleccionar servicio**: En Panel de Servicios (`1`), selecciona `web`
2. **Abrir logs**: Presiona `D` para ver logs
3. **Panel de Logs**: Se abrirá automáticamente el Panel de Logs (`3`)
4. **Modo seguimiento**: Los logs nuevos aparecen automáticamente
5. **Cambiar servicio**: Usa `Tab` en logs para cambiar entre servicios

### Tutorial 4: Detener Servicios

1. **Regresar a Servicios**: Presiona `1`
2. **Seleccionar servicio**: Navega hasta `web`
3. **Detener servicio**: Presiona `X`
4. **Confirmar**: El estado cambiará a `[DOWN]`
5. **Detener todos**: Repite para todos los servicios

## 📝 Configuración con dockronos.yml

Para mayor control, puedes crear un archivo `dockronos.yml`:

```yaml
# dockronos.yml
project:
  name: "Mi Primer Proyecto"
  description: "Proyecto de ejemplo para aprender Dockronos"

# Configuración de la interfaz
ui:
  theme: "default"
  refreshInterval: 5000
  panels:
    services:
      autoExpand: true
      showImages: true
    metrics:
      enabled: true
      historySize: 100
    logs:
      followMode: true
      maxLines: 1000

# Definición de contenedores (alternativa a docker-compose)
containers:
  - name: "mi-aplicacion"
    image: "nginx:alpine"
    ports:
      - "8080:80"
    environment:
      - "NGINX_HOST=localhost"
    labels:
      - "app=frontend"

  - name: "mi-base-datos"
    image: "postgres:15-alpine"
    environment:
      - "POSTGRES_DB=miapp"
      - "POSTGRES_USER=usuario"
      - "POSTGRES_PASSWORD=contraseña"
    volumes:
      - "datos_postgres:/var/lib/postgresql/data"

# Configuración del motor de contenedores
engine:
  preferred: "docker"  # o "podman"
  timeout: 30000
```

## 🎯 Ejercicios Prácticos

### Ejercicio 1: Flujo Completo
1. Crea un nuevo proyecto con `docker-compose.yml`
2. Inicia Dockronos
3. Inicia todos los servicios en orden: base de datos → caché → aplicación
4. Monitorea las métricas durante el inicio
5. Revisa los logs de cada servicio
6. Detén todos los servicios

### Ejercicio 2: Troubleshooting
1. Inicia un servicio que falle intencionalmente (puerto ocupado)
2. Usa el Panel de Logs para diagnosticar el problema
3. Usa las métricas para ver el impacto en el sistema
4. Corrige el problema y reinicia el servicio

### Ejercicio 3: Monitoreo
1. Inicia varios servicios
2. Genera carga (visita la aplicación web)
3. Observa cómo cambian las métricas
4. Identifica qué servicio usa más recursos

## 📚 Próximos Pasos

¡Felicitaciones! Has dominado lo básico de Dockronos. Ahora puedes:

### Documentación Intermedia
- **[Atajos de Teclado](../keyboard-shortcuts.md)** - Domina la navegación eficiente
- **[Configuración](../configuration.md)** - Personaliza Dockronos para tus proyectos
- **[Referencia CLI](../cli-reference.md)** - Aprende comandos de línea

### Documentación Avanzada
- **[Uso Avanzado](advanced-usage.md)** - Características para usuarios expertos
- **[Solución de Problemas](troubleshooting.md)** - Resolver problemas comunes

## 🆘 ¿Necesitas Ayuda?

Si encuentras problemas:

1. **Presiona `?`** dentro de Dockronos para ayuda contextual
2. **Consulta [Solución de Problemas](troubleshooting.md)** para problemas comunes
3. **Visita [GitHub Issues](https://github.com/athenalink/dockronos/issues)** para reportar errores
4. **Únete a [Discussions](https://github.com/athenalink/dockronos/discussions)** para preguntas

## 💡 Consejos Finales

1. **Practica los atajos**: La eficiencia viene con la práctica
2. **Experimenta**: Prueba diferentes configuraciones
3. **Lee los logs**: Los logs contienen información valiosa
4. **Usa las métricas**: Te ayudan a optimizar el rendimiento
5. **Personaliza**: Adapta Dockronos a tu flujo de trabajo

---

*¡Excelente trabajo! Ahora estás listo para usar Dockronos eficientemente en tus proyectos de desarrollo. 🚀*