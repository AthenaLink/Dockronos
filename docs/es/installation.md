# Guía de Instalación

Esta guía te ayudará a instalar Dockronos en tu sistema usando varios métodos según tu plataforma y preferencias.

## 🎯 Inicio Rápido

### Para la mayoría de usuarios (Recomendado)

```bash
# Método 1: Instalar binario directamente
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-$(uname -s)-$(uname -m) -o dockronos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/

# Método 2: Usar npm
npm install -g dockronos

# Método 3: Usar pnpm
pnpm install -g dockronos
```

## 📦 Métodos de Instalación

### 1. Binarios Precompilados (Recomendado)

Los binarios precompilados son la forma más rápida de empezar con Dockronos.

#### Linux

```bash
# Para sistemas Linux x86_64
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-linux-x64 -o dockronos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/

# Para sistemas Linux ARM64
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-linux-arm64 -o dockronos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/
```

#### macOS

```bash
# Para Mac Intel
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-macos-x64 -o dockronos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/

# Para Mac Apple Silicon (M1/M2)
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-macos-arm64 -o dockronos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/
```

#### Windows

```powershell
# Descargar y colocar en PATH
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-win-x64.exe -o dockronos.exe
# Mueve dockronos.exe a un directorio en tu PATH
```

### 2. Gestores de Paquetes de Node.js

#### npm

```bash
# Instalación global
npm install -g dockronos

# Verificar instalación
dockronos --version
```

#### pnpm (Recomendado para desarrolladores)

```bash
# Instalación global
pnpm install -g dockronos

# Verificar instalación
dockronos --version
```

#### Yarn

```bash
# Instalación global
yarn global add dockronos

# Verificar instalación
dockronos --version
```

### 3. Desde el Código Fuente

Para desarrolladores que quieren la última versión o contribuir al proyecto:

```bash
# Clonar el repositorio
git clone https://github.com/athenalink/dockronos.git
cd dockronos

# Instalar dependencias
pnpm install

# Compilar el proyecto
pnpm build

# Instalar globalmente
pnpm link --global

# O ejecutar directamente
pnpm start
```

## 🔧 Requisitos del Sistema

### Mínimos
- **Node.js**: 18.0.0 o superior (solo para instalación npm/pnpm)
- **Sistema Operativo**: Linux, macOS, Windows
- **RAM**: 256 MB mínimo, 512 MB recomendado
- **Motor de Contenedores**: Docker 20.0+ o Podman 4.0+

### Recomendados
- **Node.js**: 20.0.0 o superior
- **Terminal**: Terminal moderno con soporte de color
- **RAM**: 1 GB o más para proyectos grandes
- **CPU**: 2 núcleos o más para mejor rendimiento

## 🐳 Configuración del Motor de Contenedores

Dockronos requiere Docker o Podman para funcionar.

### Docker

#### Linux
```bash
# Instalación con script oficial
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker run hello-world
```

#### macOS
```bash
# Usar Homebrew
brew install --cask docker

# O descargar Docker Desktop desde:
# https://www.docker.com/products/docker-desktop
```

#### Windows
- Descargar Docker Desktop desde [docker.com](https://www.docker.com/products/docker-desktop)
- Ejecutar el instalador y seguir las instrucciones
- Reiniciar el sistema si es necesario

### Podman (Alternativa sin demonio)

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install podman

# CentOS/RHEL
sudo dnf install podman

# Verificar instalación
podman --version
```

#### macOS
```bash
# Usar Homebrew
brew install podman

# Inicializar máquina
podman machine init
podman machine start
```

## ✅ Verificación de la Instalación

Después de instalar Dockronos y un motor de contenedores:

```bash
# Verificar versión de Dockronos
dockronos --version

# Verificar motor de contenedores
docker --version
# O
podman --version

# Probar Dockronos
dockronos --help

# Ejecutar en directorio de prueba
mkdir test-dockronos
cd test-dockronos
dockronos init
dockronos
```

## 🚨 Solución de Problemas

### Problema: "Comando no encontrado: dockronos"

```bash
# Verificar PATH
echo $PATH

# Para instalación npm, agregar al PATH
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Para instalación pnpm
echo 'export PATH="$(pnpm config get global-bin-dir):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Problema: "Permisos denegados"

```bash
# Para instalación npm sin sudo
npm config set prefix ~/.local
npm install -g dockronos

# Agregar al PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Problema: "No se encontró motor de contenedores"

```bash
# Verificar que Docker/Podman estén ejecutándose
sudo systemctl status docker
# O
podman machine list

# Reiniciar servicios si es necesario
sudo systemctl restart docker
# O
podman machine start
```

## 🔄 Actualización

### Binarios
```bash
# Descargar la nueva versión
curl -L https://github.com/athenalink/dockronos/releases/latest/download/dockronos-$(uname -s)-$(uname -m) -o dockronos
chmod +x dockronos
sudo mv dockronos /usr/local/bin/
```

### npm/pnpm
```bash
# npm
npm update -g dockronos

# pnpm
pnpm update -g dockronos
```

## 🗑️ Desinstalación

### Binarios
```bash
sudo rm /usr/local/bin/dockronos
```

### npm/pnpm
```bash
# npm
npm uninstall -g dockronos

# pnpm
pnpm uninstall -g dockronos
```

## 📚 Próximos Pasos

Una vez instalado:

1. **[Primeros Pasos](guides/getting-started.md)** - Tutorial básico
2. **[Configuración](configuration.md)** - Configurar tu primer proyecto
3. **[Atajos de Teclado](keyboard-shortcuts.md)** - Navegación eficiente
4. **[Solución de Problemas](guides/troubleshooting.md)** - Si encuentras problemas

---

*¡Felicitaciones! Dockronos está listo para usar. Comienza con la [Guía de Primeros Pasos](guides/getting-started.md) para aprender lo básico.*