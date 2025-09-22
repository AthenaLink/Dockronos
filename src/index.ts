#!/usr/bin/env node

import { Command } from 'commander';
import { CronosUI } from './ui/index.js';
import { configManager } from './config/index.js';
import { containerEngine } from './engine/index.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('cronos')
  .description('Interactive console application for container management on development environment')
  .version('1.0.0');

program
  .command('start')
  .description('Start the interactive TUI')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting Cronos...'));

      // Load configuration
      if (options.config) {
        await configManager.loadConfig(options.config);
      } else {
        await configManager.loadConfig();
      }

      // Initialize and start UI
      const ui = new CronosUI();
      await ui.start();

    } catch (error) {
      console.error(chalk.red('❌ Failed to start Cronos:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Cronos configuration in current directory')
  .option('--auto-discover', 'Automatically discover services in subdirectories')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Initializing Cronos configuration...'));

      await configManager.loadConfig();
      const config = configManager.getConfig()!;

      if (options.autoDiscover) {
        console.log(chalk.yellow('🔍 Auto-discovering services...'));
        const discoveredServices = await configManager.autoDiscoverServices();

        if (discoveredServices.length > 0) {
          for (const service of discoveredServices) {
            await configManager.addService(service);
            console.log(chalk.green(`✅ Found service: ${service.name} in ${service.directory}`));
          }
        } else {
          console.log(chalk.yellow('⚠️  No services found'));
        }
      }

      await configManager.saveConfig();
      console.log(chalk.green('✅ Configuration initialized successfully'));
      console.log(chalk.blue('Run "cronos start" to launch the interface'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize configuration:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all containers')
  .action(async () => {
    try {
      const containers = await containerEngine.listContainers();

      if (containers.length === 0) {
        console.log(chalk.yellow('No containers found'));
        return;
      }

      console.log(chalk.blue('\n📦 Containers:'));
      console.log('─'.repeat(80));

      for (const container of containers) {
        const statusColor = container.status === 'running' ? 'green' : 'red';
        const status = chalk[statusColor](container.status.toUpperCase());
        const ports = container.ports.length > 0 ? container.ports.join(', ') : 'None';

        console.log(`${chalk.cyan(container.name)} | ${status} | ${container.image}`);
        if (container.ports.length > 0) {
          console.log(`  Ports: ${ports}`);
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to list containers:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('up')
  .description('Start services')
  .argument('[services...]', 'Services to start (default: all)')
  .option('-d, --directory <path>', 'Working directory')
  .action(async (services, options) => {
    try {
      console.log(chalk.blue('🚀 Starting services...'));

      await containerEngine.startServices(services, options.directory);

      const serviceText = services.length > 0 ? services.join(', ') : 'all services';
      console.log(chalk.green(`✅ Started ${serviceText}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to start services:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('down')
  .description('Stop services')
  .argument('[services...]', 'Services to stop (default: all)')
  .option('-d, --directory <path>', 'Working directory')
  .action(async (services, options) => {
    try {
      console.log(chalk.blue('🛑 Stopping services...'));

      await containerEngine.stopServices(services, options.directory);

      const serviceText = services.length > 0 ? services.join(', ') : 'all services';
      console.log(chalk.green(`✅ Stopped ${serviceText}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to stop services:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('restart')
  .description('Restart services')
  .argument('[services...]', 'Services to restart (default: all)')
  .option('-d, --directory <path>', 'Working directory')
  .action(async (services, options) => {
    try {
      console.log(chalk.blue('🔄 Restarting services...'));

      await containerEngine.restartServices(services, options.directory);

      const serviceText = services.length > 0 ? services.join(', ') : 'all services';
      console.log(chalk.green(`✅ Restarted ${serviceText}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to restart services:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('logs')
  .description('Show logs for a service')
  .argument('<service>', 'Service name')
  .option('-f, --follow', 'Follow log output')
  .option('-d, --directory <path>', 'Working directory')
  .action(async (service, options) => {
    try {
      console.log(chalk.blue(`📋 Showing logs for ${service}...`));

      const logStream = await containerEngine.getLogs(service, options.follow, options.directory);

      logStream.on('data', (chunk: Buffer) => {
        process.stdout.write(chunk);
      });

      logStream.on('error', (error: Error) => {
        console.error(chalk.red('❌ Log stream error:'), error.message);
      });

      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n📋 Logs stopped'));
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to show logs:'), (error as Error).message);
      process.exit(1);
    }
  });

// Default command (start)
if (process.argv.length === 2) {
  // No command provided, default to start
  program.parse(['node', 'cronos', 'start']);
} else {
  program.parse();
}