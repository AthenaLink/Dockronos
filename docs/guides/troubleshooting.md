# Troubleshooting Guide

This comprehensive troubleshooting guide helps you diagnose and resolve common issues with Dockronos. The guide is organized by problem category with step-by-step solutions and preventive measures.

## 🚨 Common Issues and Solutions

### Installation Problems

#### Issue: "Command not found: dockronos"

**Symptoms:**
- Terminal shows "command not found" when running `dockronos`
- Installation appeared successful but binary is not accessible

**Solutions:**

1. **Check Installation Method:**
   ```bash
   # For npm/pnpm installation
   npm list -g dockronos
   pnpm list -g dockronos

   # For binary installation
   which dockronos
   echo $PATH
   ```

2. **Fix PATH Issues:**
   ```bash
   # Add npm global bin to PATH (bash/zsh)
   echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc

   # For pnpm
   echo 'export PATH="$(pnpm config get global-bin-dir):$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Reinstall with Proper Permissions:**
   ```bash
   # Linux/macOS - avoid sudo with npm
   npm config set prefix ~/.local
   npm install -g dockronos

   # Or use binary installation
   curl -L https://github.com/your-org/dockronos/releases/latest/download/dockronos-linux -o ~/.local/bin/dockronos
   chmod +x ~/.local/bin/dockronos
   ```

#### Issue: "Permission denied" during installation

**Symptoms:**
- Installation fails with permission errors
- Cannot write to global directories

**Solutions:**

1. **Use Node Version Manager:**
   ```bash
   # Install nvm (Node Version Manager)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc

   # Install and use Node.js
   nvm install 18
   nvm use 18
   npm install -g dockronos
   ```

2. **Configure npm for Non-Root Installation:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g dockronos
   ```

3. **Use Binary Installation (Recommended):**
   ```bash
   # Download and install binary directly
   sudo curl -L https://github.com/your-org/dockronos/releases/latest/download/dockronos-$(uname -s)-$(uname -m) -o /usr/local/bin/dockronos
   sudo chmod +x /usr/local/bin/dockronos
   ```

### Container Engine Issues

#### Issue: "No container engine found"

**Symptoms:**
- Dockronos starts but shows no container engine available
- "Engine: None" in status bar

**Diagnosis:**
```bash
# Check Docker installation
docker --version
docker ps

# Check Podman installation
podman --version
podman ps

# Check if Docker daemon is running
sudo systemctl status docker

# Check if user is in docker group
groups $USER
```

**Solutions:**

1. **Install Docker:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   newgrp docker

   # macOS
   brew install --cask docker

   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

2. **Install Podman:**
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

3. **Fix Docker Permissions:**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER

   # Apply group membership
   newgrp docker

   # Test Docker access
   docker run hello-world
   ```

#### Issue: "Container engine timeout"

**Symptoms:**
- Commands hang or timeout
- "Operation timed out" errors

**Solutions:**

1. **Increase Timeout Settings:**
   ```yaml
   # dockronos.yml
   engine:
     timeout: 60000  # Increase to 60 seconds
     retries: 3
   ```

2. **Check Docker Daemon Status:**
   ```bash
   # Restart Docker daemon
   sudo systemctl restart docker

   # Check Docker logs
   sudo journalctl -u docker.service -f

   # Prune Docker system
   docker system prune -a
   ```

3. **Fix Resource Issues:**
   ```bash
   # Check disk space
   df -h

   # Clean up Docker resources
   docker container prune -f
   docker image prune -a -f
   docker volume prune -f
   docker network prune -f
   ```

### Configuration Issues

#### Issue: "Configuration file not found"

**Symptoms:**
- Dockronos complains about missing configuration
- Default behavior doesn't match project needs

**Solutions:**

1. **Generate Configuration:**
   ```bash
   # Let Dockronos auto-generate configuration
   dockronos init

   # Or create minimal configuration
   cat > dockronos.yml << EOF
   project:
     name: my-project
   containers:
     - name: app
       build: .
       ports:
         - "3000:3000"
   EOF
   ```

2. **Convert from Docker Compose:**
   ```bash
   # If you have docker-compose.yml
   dockronos convert docker-compose.yml

   # Or manually reference it
   dockronos --compose docker-compose.yml
   ```

#### Issue: "Invalid configuration format"

**Symptoms:**
- YAML parsing errors
- Configuration validation failures

**Solutions:**

1. **Validate YAML Syntax:**
   ```bash
   # Use yamllint if available
   yamllint dockronos.yml

   # Or check with Python
   python -c "import yaml; yaml.safe_load(open('dockronos.yml'))"
   ```

2. **Fix Common YAML Issues:**
   ```yaml
   # ❌ Wrong: Mixed tabs and spaces
   containers:
   	- name: app    # Tab here
       ports:        # Spaces here

   # ✅ Correct: Consistent spacing
   containers:
     - name: app
       ports:
         - "3000:3000"

   # ❌ Wrong: Unquoted special characters
   environment:
     - PASSWORD=p@ssw0rd!

   # ✅ Correct: Quoted values
   environment:
     - "PASSWORD=p@ssw0rd!"
   ```

### UI and Display Issues

#### Issue: "Garbled text or broken layout"

**Symptoms:**
- Characters appear corrupted
- Panels overlap or are misaligned
- Colors not displaying correctly

**Solutions:**

1. **Check Terminal Compatibility:**
   ```bash
   # Check terminal type
   echo $TERM

   # Test color support
   tput colors

   # Try different terminal settings
   export TERM=xterm-256color
   dockronos
   ```

2. **Resize Terminal:**
   ```bash
   # Ensure minimum size (80x24)
   resize -s 24 80

   # Or use fullscreen terminal
   ```

3. **Terminal-Specific Fixes:**
   ```bash
   # For iTerm2 (macOS)
   # Go to Preferences > Profiles > Terminal > Character Encoding: UTF-8

   # For Windows Terminal
   # Ensure UTF-8 encoding and proper font

   # For tmux/screen
   tmux new-session -d -s dockronos
   tmux attach-session -t dockronos
   ```

#### Issue: "Keyboard shortcuts not working"

**Symptoms:**
- Keys don't respond as expected
- Cannot navigate between panels

**Solutions:**

1. **Check Key Bindings:**
   ```bash
   # View current key bindings
   dockronos --help

   # Test in different terminal
   ```

2. **Terminal-Specific Issues:**
   ```bash
   # For tmux users - prefix key conflicts
   # Add to ~/.tmux.conf:
   # set -g prefix C-a
   # unbind C-b

   # For screen users
   # Use different escape key
   ```

### Performance Issues

#### Issue: "Dockronos is slow or unresponsive"

**Symptoms:**
- Delayed responses to commands
- High CPU or memory usage
- UI freezes

**Diagnosis:**
```bash
# Check system resources
top -p $(pgrep dockronos)
htop

# Monitor Dockronos process
ps aux | grep dockronos

# Check container engine performance
time docker ps
time podman ps
```

**Solutions:**

1. **Optimize Configuration:**
   ```yaml
   # dockronos.yml
   ui:
     refreshInterval: 10000  # Increase refresh interval
     panels:
       metrics:
         enabled: false      # Disable if not needed
       logs:
         maxLines: 100       # Reduce log buffer
   ```

2. **Clean Up Resources:**
   ```bash
   # Clean Docker/Podman resources
   docker system prune -a
   podman system prune -a

   # Restart container engines
   sudo systemctl restart docker
   ```

3. **Reduce System Load:**
   ```bash
   # Close unnecessary applications
   # Increase terminal buffer size
   # Use SSD storage if possible
   ```

### Container-Specific Issues

#### Issue: "Container won't start"

**Symptoms:**
- Container remains in "created" or "exited" state
- Error messages in logs

**Diagnosis:**
```bash
# Check container logs
docker logs container-name
podman logs container-name

# Inspect container configuration
docker inspect container-name
podman inspect container-name

# Check port conflicts
netstat -tulpn | grep :3000
```

**Solutions:**

1. **Fix Port Conflicts:**
   ```bash
   # Find what's using the port
   lsof -i :3000

   # Kill conflicting process
   sudo kill $(lsof -t -i:3000)

   # Or use different port
   docker run -p 3001:3000 image-name
   ```

2. **Resolve Volume Issues:**
   ```bash
   # Check volume permissions
   ls -la ./volume-path

   # Fix ownership
   sudo chown -R $USER:$USER ./volume-path

   # Check disk space
   df -h
   ```

3. **Debug Image Problems:**
   ```bash
   # Pull latest image
   docker pull image-name:latest

   # Run interactively
   docker run -it --entrypoint /bin/bash image-name

   # Check image existence
   docker images | grep image-name
   ```

## 🔧 Advanced Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment variable
export DOCKRONOS_DEBUG=true
dockronos

# Or use debug flag
dockronos --debug

# View debug logs
tail -f ~/.dockronos/logs/debug.log
```

### Log Analysis

Check Dockronos logs for issues:

```bash
# Application logs
cat ~/.dockronos/logs/dockronos.log

# Error logs
cat ~/.dockronos/logs/error.log

# Watch logs in real-time
tail -f ~/.dockronos/logs/*.log
```

### Network Diagnostics

Diagnose network-related issues:

```bash
# Test container networking
docker network ls
docker network inspect bridge

# Check DNS resolution
docker run --rm busybox nslookup google.com

# Test container connectivity
docker run --rm busybox ping 8.8.8.8
```

### System Requirements Check

Verify system meets requirements:

```bash
# Check Node.js version
node --version  # Should be 18.0+

# Check available memory
free -h

# Check disk space
df -h

# Check CPU cores
nproc
```

## 🛡️ Prevention Strategies

### Regular Maintenance

```bash
# Weekly cleanup script
#!/bin/bash
# cleanup-dockronos.sh

echo "Cleaning up Docker/Podman resources..."
docker system prune -a -f
podman system prune -a -f

echo "Updating Dockronos..."
npm update -g dockronos

echo "Checking configuration..."
dockronos validate

echo "Maintenance complete!"
```

### Configuration Backup

```bash
# Backup configuration
cp dockronos.yml dockronos.yml.backup

# Create versioned backup
cp dockronos.yml "dockronos.yml.$(date +%Y%m%d_%H%M%S)"

# Automated backup script
#!/bin/bash
BACKUP_DIR="$HOME/.dockronos/backups"
mkdir -p "$BACKUP_DIR"
cp dockronos.yml "$BACKUP_DIR/dockronos.yml.$(date +%Y%m%d_%H%M%S)"
```

### Health Monitoring

```bash
# Health check script
#!/bin/bash
# health-check.sh

echo "Checking Dockronos health..."

# Check if Dockronos is responsive
if ! dockronos status &>/dev/null; then
    echo "❌ Dockronos not responding"
    exit 1
fi

# Check container engine
if ! docker version &>/dev/null && ! podman version &>/dev/null; then
    echo "❌ No container engine available"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️  Disk usage high: ${DISK_USAGE}%"
fi

echo "✅ Dockronos health check passed"
```

## 📞 Getting Help

### Community Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-org/dockronos/issues)
- **Discussions**: [Community Q&A and discussions](https://github.com/your-org/dockronos/discussions)
- **Documentation**: [Complete documentation](https://dockronos.dev/docs)

### Reporting Bugs

When reporting issues, include:

1. **System Information:**
   ```bash
   dockronos --version
   node --version
   docker --version || podman --version
   uname -a
   ```

2. **Configuration:**
   ```bash
   cat dockronos.yml
   ```

3. **Logs:**
   ```bash
   cat ~/.dockronos/logs/error.log
   ```

4. **Steps to Reproduce:**
   - What you did
   - What you expected
   - What actually happened

### Emergency Recovery

If Dockronos is completely broken:

```bash
# Emergency reset
rm -rf ~/.dockronos/
rm -f dockronos.yml

# Reinstall
npm uninstall -g dockronos
npm install -g dockronos

# Initialize fresh
dockronos init
```

---

*This troubleshooting guide covers the most common issues you might encounter with Dockronos. If you can't find a solution here, don't hesitate to reach out to the community for help.*