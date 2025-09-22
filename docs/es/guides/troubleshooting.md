# Guía de Solución de Problemas

Esta guía completa de solución de problemas te ayuda a diagnosticar y resolver problemas comunes con Dockronos. La guía está organizada por categoría de problema con soluciones paso a paso y medidas preventivas.

## 🚨 Problemas Comunes y Soluciones

### Problemas de Instalación

#### Problema: "Comando no encontrado: dockronos"

**Síntomas:**
- El terminal muestra "command not found" al ejecutar `dockronos`
- La instalación pareció exitosa pero el binario no es accesible

**Soluciones:**

1. **Verificar Método de Instalación:**
   ```bash
   # Para instalación npm/pnpm
   npm list -g dockronos
   pnpm list -g dockronos

   # Para instalación de binario
   which dockronos
   echo $PATH
   ```

2. **Corregir Problemas de PATH:**
   ```bash
   # Agregar npm global bin al PATH (bash/zsh)
   echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   # Para pnpm
   echo 'export PATH="$(pnpm config get global-bin-dir):$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Reinstalar con Permisos Apropiados:**
   ```bash
   # Linux/macOS - evitar sudo con npm
   npm config set prefix ~/.local
   npm install -g dockronos

   # O usar instalación de binario
   curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-linux -o ~/.local/bin/dockronos
   chmod +x ~/.local/bin/dockronos
   ```

#### Problema: "Permisos denegados" durante la instalación

**Síntomas:**
- La instalación falla con errores de permisos
- No se puede escribir en directorios globales

**Soluciones:**

1. **Usar Node Version Manager:**
   ```bash
   # Instalar nvm (Node Version Manager)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc

   # Instalar y usar Node.js
   nvm install 18
   nvm use 18
   npm install -g dockronos
   ```

2. **Configurar npm para Instalación No-Root:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g dockronos
   ```

3. **Usar Instalación de Binario (Recomendado):**
   ```bash
   # Descargar e instalar binario directamente
   sudo curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-$(uname -s)-$(uname -m) -o /usr/local/bin/dockronos
   sudo chmod +x /usr/local/bin/dockronos
   ```

### Problemas del Motor de Contenedores

#### Problema: "No se encontró motor de contenedores"

**Síntomas:**
- Dockronos inicia pero muestra que no hay motor de contenedores disponible
- "Engine: None" en la barra de estado

**Diagnóstico:**
```bash
# Verificar instalación de Docker
docker --version
docker ps

# Verificar instalación de Podman
podman --version
podman ps

# Verificar si el demonio de Docker está ejecutándose
sudo systemctl status docker

# Verificar si el usuario está en el grupo docker
groups $USER
```

**Soluciones:**

1. **Instalar Docker:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   newgrp docker

   # macOS
   brew install --cask docker

   # Iniciar servicio Docker
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

2. **Instalar Podman:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install podman

   # CentOS/RHEL
   sudo dnf install podman

   # macOS
   brew install podman
   podman machine init
   podman machine start
   ```

3. **Corregir Permisos de Docker:**
   ```bash
   # Agregar usuario al grupo docker
   sudo usermod -aG docker $USER

   # Aplicar membresía de grupo
   newgrp docker

   # Probar acceso a Docker
   docker run hello-world
   ```

#### Problema: "Timeout del motor de contenedores"

**Síntomas:**
- Los comandos se cuelgan o agotan el tiempo
- Errores de "Operación agotó el tiempo"

**Soluciones:**

1. **Aumentar Configuraciones de Timeout:**
   ```yaml
   # dockronos.yml
   engine:
     timeout: 60000  # Aumentar a 60 segundos
     retries: 3
   ```

2. **Verificar Estado del Demonio Docker:**
   ```bash
   # Reiniciar demonio Docker
   sudo systemctl restart docker

   # Verificar logs de Docker
   sudo journalctl -u docker.service -f

   # Limpiar sistema Docker
   docker system prune -a
   ```

3. **Corregir Problemas de Recursos:**
   ```bash
   # Verificar espacio en disco
   df -h

   # Limpiar recursos Docker
   docker container prune -f
   docker image prune -a -f
   docker volume prune -f
   docker network prune -f
   ```

### Problemas de Configuración

#### Problema: "Archivo de configuración no encontrado"

**Síntomas:**
- Dockronos se queja de configuración faltante
- El comportamiento por defecto no coincide con las necesidades del proyecto

**Soluciones:**

1. **Generar Configuración:**
   ```bash
   # Permitir que Dockronos auto-genere configuración
   dockronos init

   # O crear configuración mínima
   cat > dockronos.yml << EOF
   project:
     name: mi-proyecto
   containers:
     - name: app
       build: .
       ports:
         - "3000:3000"
   EOF
   ```

2. **Convertir desde Docker Compose:**
   ```bash
   # Si tienes docker-compose.yml
   dockronos convert docker-compose.yml

   # O referenciar manualmente
   dockronos --compose docker-compose.yml
   ```

#### Problema: "Formato de configuración inválido"

**Síntomas:**
- Errores de parsing YAML
- Fallas de validación de configuración

**Soluciones:**

1. **Validar Sintaxis YAML:**
   ```bash
   # Usar yamllint si está disponible
   yamllint dockronos.yml

   # O verificar con Python
   python -c "import yaml; yaml.safe_load(open('dockronos.yml'))"
   ```

2. **Corregir Problemas Comunes de YAML:**
   ```yaml
   # ❌ Incorrecto: Mezclar tabs y espacios
   containers:
   	- name: app    # Tab aquí
       ports:        # Espacios aquí

   # ✅ Correcto: Espaciado consistente
   containers:
     - name: app
       ports:
         - "3000:3000"

   # ❌ Incorrecto: Caracteres especiales sin comillas
   environment:
     - PASSWORD=p@ssw0rd!

   # ✅ Correcto: Valores con comillas
   environment:
     - "PASSWORD=p@ssw0rd!"
   ```

### Problemas de UI y Visualización

#### Problema: "Texto ilegible o diseño roto"

**Síntomas:**
- Los caracteres aparecen corruptos
- Los paneles se superponen o están mal alineados
- Los colores no se muestran correctamente

**Soluciones:**

1. **Verificar Compatibilidad del Terminal:**
   ```bash
   # Verificar tipo de terminal
   echo $TERM

   # Probar soporte de color
   tput colors

   # Probar diferentes configuraciones de terminal
   export TERM=xterm-256color
   dockronos
   ```

2. **Redimensionar Terminal:**
   ```bash
   # Asegurar tamaño mínimo (80x24)
   resize -s 24 80

   # O usar terminal en pantalla completa
   ```

3. **Correcciones Específicas del Terminal:**
   ```bash
   # Para iTerm2 (macOS)
   # Ir a Preferencias > Perfiles > Terminal > Codificación de caracteres: UTF-8

   # Para Windows Terminal
   # Asegurar codificación UTF-8 y fuente apropiada

   # Para tmux/screen
   tmux new-session -d -s dockronos
   tmux attach-session -t dockronos
   ```

#### Problema: "Los atajos de teclado no funcionan"

**Síntomas:**
- Las teclas no responden como se espera
- No se puede navegar entre paneles

**Soluciones:**

1. **Verificar Combinaciones de Teclas:**
   ```bash
   # Ver combinaciones de teclas actuales
   dockronos --help

   # Probar en terminal diferente
   ```

2. **Problemas Específicos del Terminal:**
   ```bash
   # Para usuarios de tmux - conflictos de tecla prefijo
   # Agregar a ~/.tmux.conf:
   # set -g prefix C-a
   # unbind C-b

   # Para usuarios de screen
   # Usar tecla de escape diferente
   ```

### Problemas de Rendimiento

#### Problema: "Dockronos está lento o no responde"

**Síntomas:**
- Respuestas retrasadas a comandos
- Alto uso de CPU o memoria
- La UI se congela

**Diagnóstico:**
```bash
# Verificar recursos del sistema
top -p $(pgrep dockronos)
htop

# Monitorear proceso Dockronos
ps aux | grep dockronos

# Verificar rendimiento del motor de contenedores
time docker ps
time podman ps
```

**Soluciones:**

1. **Optimizar Configuración:**
   ```yaml
   # dockronos.yml
   ui:
     refreshInterval: 10000  # Aumentar intervalo de actualización
     panels:
       metrics:
         enabled: false      # Deshabilitar si no es necesario
       logs:
         maxLines: 100       # Reducir buffer de logs
   ```

2. **Limpiar Recursos:**
   ```bash
   # Limpiar recursos Docker/Podman
   docker system prune -a
   podman system prune -a

   # Reiniciar motores de contenedores
   sudo systemctl restart docker
   ```

3. **Reducir Carga del Sistema:**
   ```bash
   # Cerrar aplicaciones innecesarias
   # Aumentar tamaño del buffer del terminal
   # Usar almacenamiento SSD si es posible
   ```

### Problemas Específicos de Contenedores

#### Problema: "El contenedor no inicia"

**Síntomas:**
- El contenedor permanece en estado "created" o "exited"
- Mensajes de error en logs

**Diagnóstico:**
```bash
# Verificar logs del contenedor
docker logs container-name
podman logs container-name

# Inspeccionar configuración del contenedor
docker inspect container-name
podman inspect container-name

# Verificar conflictos de puertos
netstat -tulpn | grep :3000
```

**Soluciones:**

1. **Corregir Conflictos de Puertos:**
   ```bash
   # Encontrar qué está usando el puerto
   lsof -i :3000

   # Matar proceso en conflicto
   sudo kill $(lsof -t -i:3000)

   # O usar puerto diferente
   docker run -p 3001:3000 image-name
   ```

2. **Resolver Problemas de Volúmenes:**
   ```bash
   # Verificar permisos de volúmenes
   ls -la ./volume-path

   # Corregir propiedad
   sudo chown -R $USER:$USER ./volume-path

   # Verificar espacio en disco
   df -h
   ```

3. **Debuggear Problemas de Imagen:**
   ```bash
   # Descargar imagen más reciente
   docker pull image-name:latest

   # Ejecutar interactivamente
   docker run -it --entrypoint /bin/bash image-name

   # Verificar existencia de imagen
   docker images | grep image-name
   ```

## 🔧 Solución de Problemas Avanzada

### Modo Debug

Habilitar modo debug para logging detallado:

```bash
# Establecer variable de entorno debug
export DOCKRONOS_DEBUG=true
dockronos

# O usar flag debug
dockronos --debug

# Ver logs de debug
tail -f ~/.dockronos/logs/debug.log
```

### Análisis de Logs

Verificar logs de Dockronos para problemas:

```bash
# Logs de aplicación
cat ~/.dockronos/logs/dockronos.log

# Logs de errores
cat ~/.dockronos/logs/error.log

# Observar logs en tiempo real
tail -f ~/.dockronos/logs/*.log
```

### Diagnósticos de Red

Diagnosticar problemas relacionados con la red:

```bash
# Probar redes de contenedores
docker network ls
docker network inspect bridge

# Verificar resolución DNS
docker run --rm busybox nslookup google.com

# Probar conectividad de contenedores
docker run --rm busybox ping 8.8.8.8
```

### Verificación de Requisitos del Sistema

Verificar que el sistema cumple con los requisitos:

```bash
# Verificar versión de Node.js
node --version  # Debe ser 18.0+

# Verificar memoria disponible
free -h

# Verificar espacio en disco
df -h

# Verificar núcleos de CPU
nproc
```

## 🛡️ Estrategias de Prevención

### Mantenimiento Regular

```bash
# Script de limpieza semanal
#!/bin/bash
# cleanup-dockronos.sh

echo "Limpiando recursos Docker/Podman..."
docker system prune -a -f
podman system prune -a -f

echo "Actualizando Dockronos..."
npm update -g dockronos

echo "Verificando configuración..."
dockronos validate

echo "¡Mantenimiento completo!"
```

### Respaldo de Configuración

```bash
# Respaldar configuración
cp dockronos.yml dockronos.yml.backup

# Crear respaldo versionado
cp dockronos.yml "dockronos.yml.$(date +%Y%m%d_%H%M%S)"

# Script de respaldo automatizado
#!/bin/bash
BACKUP_DIR="$HOME/.dockronos/backups"
mkdir -p "$BACKUP_DIR"
cp dockronos.yml "$BACKUP_DIR/dockronos.yml.$(date +%Y%m%d_%H%M%S)"
```

### Monitoreo de Salud

```bash
# Script de verificación de salud
#!/bin/bash
# health-check.sh

echo "Verificando salud de Dockronos..."

# Verificar si Dockronos responde
if ! dockronos status &>/dev/null; then
    echo "❌ Dockronos no responde"
    exit 1
fi

# Verificar motor de contenedores
if ! docker version &>/dev/null && ! podman version &>/dev/null; then
    echo "❌ No hay motor de contenedores disponible"
    exit 1
fi

# Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️  Uso de disco alto: ${DISK_USAGE}%"
fi

echo "✅ Verificación de salud de Dockronos pasó"
```

## 📞 Obtener Ayuda

### Soporte de la Comunidad

- **GitHub Issues**: [Reportar errores y solicitudes de características](https://github.com/athenalink/dockronos/issues)
- **Discussions**: [Preguntas y respuestas de la comunidad](https://github.com/athenalink/dockronos/discussions)
- **Documentación**: [Documentación completa](https://dockronos.dev/docs)

### Reportar Errores

Al reportar problemas, incluye:

1. **Información del Sistema:**
   ```bash
   dockronos --version
   node --version
   docker --version || podman --version
   uname -a
   ```

2. **Configuración:**
   ```bash
   cat dockronos.yml
   ```

3. **Logs:**
   ```bash
   cat ~/.dockronos/logs/error.log
   ```

4. **Pasos para Reproducir:**
   - Qué hiciste
   - Qué esperabas
   - Qué pasó realmente

### Recuperación de Emergencia

Si Dockronos está completamente roto:

```bash
# Reinicio de emergencia
rm -rf ~/.dockronos/
rm -f dockronos.yml

# Reinstalar
npm uninstall -g dockronos
npm install -g dockronos

# Inicializar fresco
dockronos init
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

*Esta guía de solución de problemas cubre los problemas más comunes que podrías encontrar con Dockronos. Si no puedes encontrar una solución aquí, no dudes en contactar a la comunidad para obtener ayuda.*