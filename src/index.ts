#!/usr/bin/env node

import { Command } from 'commander';
import { CronosUI } from './ui/index.js';
import { configManager } from './config/index.js';
import { containerEngine } from './engine/index.js';
import { containerRegistry } from './registry/index.js';
import { templateManager } from './templates/index.js';
import { gitManager } from './git/index.js';
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

program
  .command('pull')
  .description('Pull and run a public container')
  .argument('<image>', 'Container image name or template name')
  .option('-n, --name <name>', 'Container name')
  .option('-p, --port <ports...>', 'Port mappings (e.g., 3000:3000)')
  .option('-e, --env <vars...>', 'Environment variables (e.g., KEY=value)')
  .option('-v, --volume <volumes...>', 'Volume mounts (e.g., ./data:/data)')
  .option('--tag <tag>', 'Image tag (default: latest)')
  .option('--no-start', 'Pull image but don\'t start container')
  .action(async (image, options) => {
    try {
      console.log(chalk.blue(`📦 Processing ${image}...`));

      // Check if it's a template
      const template = templateManager.getTemplate(image);
      let containerName = options.name || image.replace(/[^a-zA-Z0-9-_]/g, '_');

      if (template) {
        console.log(chalk.yellow(`🔧 Using template: ${template.name}`));
        console.log(chalk.gray(template.description));

        // Pull the template image
        await containerRegistry.pullImage(template.image);

        if (options.start !== false) {
          const env: Record<string, string> = {};

          // Parse environment variables
          if (options.env) {
            for (const envVar of options.env) {
              const [key, value] = envVar.split('=');
              if (key && value) {
                env[key] = value;
              }
            }
          }

          // Merge template defaults with user provided env
          const finalEnv = { ...template.optionalEnv, ...env };

          // Check required environment variables
          if (template.requiredEnv) {
            for (const requiredVar of template.requiredEnv) {
              if (!finalEnv[requiredVar]) {
                console.error(chalk.red(`❌ Required environment variable '${requiredVar}' not provided`));
                console.log(chalk.yellow(`Use: cronos pull ${image} -e ${requiredVar}=value`));
                process.exit(1);
              }
            }
          }

          const containerId = await containerRegistry.runContainer({
            name: containerName,
            image: template.image,
            ports: options.port || template.defaultPorts,
            env: finalEnv,
            volumes: options.volume || template.volumes,
            restart: 'unless-stopped'
          });

          console.log(chalk.green(`✅ Container started: ${containerName} (${containerId.substring(0, 12)})`));

          if (template.documentation) {
            console.log(chalk.cyan('\n📚 Template Documentation:'));
            console.log(template.documentation);
          }
        }
      } else {
        // Regular image pull
        await containerRegistry.pullImage(image, { tag: options.tag });

        if (options.start !== false) {
          const env: Record<string, string> = {};
          if (options.env) {
            for (const envVar of options.env) {
              const [key, value] = envVar.split('=');
              if (key && value) {
                env[key] = value;
              }
            }
          }

          const fullImage = options.tag ? `${image}:${options.tag}` : image;
          const containerId = await containerRegistry.runContainer({
            name: containerName,
            image: fullImage,
            ports: options.port,
            env,
            volumes: options.volume,
            restart: 'unless-stopped'
          });

          console.log(chalk.green(`✅ Container started: ${containerName} (${containerId.substring(0, 12)})`));
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to pull/run container:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available container templates')
  .option('-s, --search <query>', 'Search templates')
  .option('-c, --category', 'Group by category')
  .action(async (options) => {
    try {
      let templates = templateManager.listTemplates();

      if (options.search) {
        templates = templateManager.searchTemplates(options.search);
        console.log(chalk.blue(`🔍 Search results for "${options.search}":`));
      } else {
        console.log(chalk.blue('📋 Available Container Templates:'));
      }

      if (options.category) {
        const categories = templateManager.getTemplatesByCategory();
        for (const [category, categoryTemplates] of Object.entries(categories)) {
          if (categoryTemplates.length > 0) {
            console.log(chalk.yellow(`\n${category}:`));
            for (const template of categoryTemplates) {
              console.log(`  ${chalk.cyan(template.name.padEnd(12))} - ${template.description}`);
            }
          }
        }
      } else {
        console.log('─'.repeat(80));
        for (const template of templates) {
          console.log(`${chalk.cyan(template.name.padEnd(12))} - ${template.description}`);
          if (template.defaultPorts) {
            console.log(`              Ports: ${template.defaultPorts.join(', ')}`);
          }
        }
      }

      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found'));
      } else {
        console.log(chalk.gray(`\nUsage: cronos pull <template-name>`));
        console.log(chalk.gray(`Example: cronos pull redis -e REDIS_PASSWORD=secret`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to list templates:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search for container images')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Limit results (default: 10)')
  .action(async (query, options) => {
    try {
      console.log(chalk.blue(`🔍 Searching for "${query}"...`));

      const results = await containerRegistry.searchImages(query, parseInt(options.limit) || 10);

      if (results.length === 0) {
        console.log(chalk.yellow('No images found'));
        return;
      }

      console.log('─'.repeat(80));
      console.log(chalk.cyan('NAME'.padEnd(30) + 'DESCRIPTION'.padEnd(40) + 'STARS'));
      console.log('─'.repeat(80));

      for (const result of results) {
        const official = result.official ? chalk.green('[OFFICIAL]') : '';
        const name = chalk.white(result.name.padEnd(30));
        const description = result.description.substring(0, 35).padEnd(40);
        const stars = chalk.yellow(result.stars.toString());

        console.log(`${name}${description}${stars} ${official}`);
      }

      console.log(chalk.gray(`\nUsage: cronos pull <image-name>`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to search images:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('images')
  .description('List local container images')
  .action(async () => {
    try {
      console.log(chalk.blue('📦 Local Container Images:'));

      const images = await containerRegistry.listLocalImages();

      if (images.length === 0) {
        console.log(chalk.yellow('No local images found'));
        return;
      }

      console.log('─'.repeat(100));
      console.log(chalk.cyan('REPOSITORY'.padEnd(25) + 'TAG'.padEnd(15) + 'IMAGE ID'.padEnd(15) + 'SIZE'.padEnd(10) + 'CREATED'));
      console.log('─'.repeat(100));

      for (const image of images) {
        const repo = image.repository.substring(0, 24).padEnd(25);
        const tag = image.tag.padEnd(15);
        const id = image.id.substring(0, 12).padEnd(15);
        const size = image.size.padEnd(10);
        const created = image.created.toLocaleDateString();

        console.log(`${repo}${tag}${id}${size}${created}`);
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to list images:'), (error as Error).message);
      process.exit(1);
    }
  });

// Git commands (optional)
const gitCommand = program
  .command('git')
  .description('Git repository management (optional)');

gitCommand
  .command('clone')
  .description('Clone a git repository to projects directory')
  .argument('<url>', 'Git repository URL')
  .argument('[directory]', 'Target directory name')
  .option('-b, --branch <branch>', 'Branch to clone')
  .option('--depth <depth>', 'Clone depth for shallow clone')
  .option('--recursive', 'Clone submodules recursively')
  .action(async (url, directory, options) => {
    try {
      console.log(chalk.blue(`📁 Cloning repository from ${url}...`));

      // Extract directory name from URL if not provided
      const targetDir = directory || url.split('/').pop()?.replace('.git', '') || 'repository';

      await gitManager.cloneRepository({
        url,
        directory: targetDir,
        branch: options.branch,
        depth: options.depth ? parseInt(options.depth) : undefined,
        recursive: options.recursive
      });

      console.log(chalk.green(`✅ Repository cloned to: ${gitManager.getProjectsDirectory()}/${targetDir}`));

      // Auto-discover services in the cloned repository
      console.log(chalk.yellow('🔍 Auto-discovering services...'));
      const services = await gitManager.autoDiscoverServices(targetDir);

      if (services.length > 0) {
        console.log(chalk.blue('📋 Discovered services:'));
        for (const service of services) {
          console.log(`  ${chalk.cyan(service.name)} - ${service.directory}`);
          if (service.compose_file) {
            console.log(`    Compose: ${service.compose_file}`);
          }
          if (service.env_file) {
            console.log(`    Env: ${service.env_file}`);
          }
        }

        console.log(chalk.gray('\nTo add these services to your configuration:'));
        console.log(chalk.gray('  cronos init --auto-discover'));
      } else {
        console.log(chalk.yellow('⚠️  No Docker Compose services found'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to clone repository:'), (error as Error).message);
      process.exit(1);
    }
  });

gitCommand
  .command('refresh')
  .description('Update git repositories')
  .argument('[repository]', 'Specific repository to update (default: all)')
  .action(async (repository) => {
    try {
      if (repository) {
        console.log(chalk.blue(`🔄 Updating repository: ${repository}...`));
        const result = await gitManager.updateRepository(repository);

        if (result.success) {
          if (result.changes > 0) {
            console.log(chalk.green(`✅ Updated ${repository}: ${result.changes} new commits`));
            if (result.newCommits) {
              console.log(chalk.gray('New commits:'));
              for (const commit of result.newCommits) {
                console.log(chalk.gray(`  ${commit}`));
              }
            }
          } else {
            console.log(chalk.yellow(`✅ ${repository} is already up to date`));
          }
        } else {
          console.error(chalk.red(`❌ Failed to update ${repository}: ${result.error}`));
        }
      } else {
        console.log(chalk.blue('🔄 Updating all repositories...'));
        const results = await gitManager.updateAllRepositories();

        let totalUpdated = 0;
        let totalChanges = 0;

        for (const result of results) {
          if (result.success) {
            if (result.changes > 0) {
              console.log(chalk.green(`✅ ${result.repository}: ${result.changes} new commits`));
              totalUpdated++;
              totalChanges += result.changes;
            } else {
              console.log(chalk.gray(`✅ ${result.repository}: up to date`));
            }
          } else {
            console.error(chalk.red(`❌ ${result.repository}: ${result.error}`));
          }
        }

        console.log(chalk.blue(`\n📊 Summary: ${totalUpdated} repositories updated, ${totalChanges} total commits`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to update repositories:'), (error as Error).message);
      process.exit(1);
    }
  });

gitCommand
  .command('status')
  .description('Show status of git repositories')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Git Repositories Status:'));

      const repositories = await gitManager.listRepositories();

      if (repositories.length === 0) {
        console.log(chalk.yellow('No git repositories found in projects directory'));
        return;
      }

      console.log('─'.repeat(90));
      console.log(chalk.cyan('REPOSITORY'.padEnd(20) + 'BRANCH'.padEnd(15) + 'STATUS'.padEnd(25) + 'LAST UPDATE'));
      console.log('─'.repeat(90));

      for (const repo of repositories) {
        const repoName = repo.repository.padEnd(20);
        const branch = repo.branch.padEnd(15);

        let status = '';
        if (repo.ahead > 0) status += `↑${repo.ahead} `;
        if (repo.behind > 0) status += `↓${repo.behind} `;
        if (repo.modified > 0) status += `M${repo.modified} `;
        if (repo.staged > 0) status += `S${repo.staged} `;
        if (repo.untracked > 0) status += `?${repo.untracked} `;

        const statusStr = status.trim() || 'clean';
        const statusDisplay = statusStr.padEnd(25);
        const lastUpdate = repo.lastUpdate.toLocaleDateString();

        let color = 'white';
        if (repo.behind > 0 || repo.modified > 0) color = 'yellow';
        if (repo.ahead > 0 || repo.staged > 0) color = 'green';

        const chalkColor = color === 'white' ? chalk.white : color === 'yellow' ? chalk.yellow : chalk.green;
        console.log(chalkColor(`${repoName}${branch}${statusDisplay}${lastUpdate}`));
      }

      console.log(chalk.gray('\nLegend: ↑ahead ↓behind M modified S staged ? untracked'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to get repository status:'), (error as Error).message);
      process.exit(1);
    }
  });

gitCommand
  .command('remove')
  .description('Remove a git repository')
  .argument('<repository>', 'Repository directory to remove')
  .option('--force', 'Force removal even with uncommitted changes')
  .action(async (repository, options) => {
    try {
      console.log(chalk.blue(`🗑️  Removing repository: ${repository}...`));

      await gitManager.removeRepository(repository, options.force);

      console.log(chalk.green(`✅ Repository ${repository} removed successfully`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to remove repository:'), (error as Error).message);
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