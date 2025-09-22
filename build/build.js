#!/usr/bin/env node

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const BUILD_DIR = 'dist';
const PKG_DIR = 'pkg';

async function ensureDirectories() {
  try {
    await fs.mkdir(BUILD_DIR, { recursive: true });
    await fs.mkdir(PKG_DIR, { recursive: true });
    console.log(chalk.green('✅ Build directories created'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create directories:'), error.message);
    process.exit(1);
  }
}

async function buildTypeScript() {
  try {
    console.log(chalk.blue('🔨 Building TypeScript...'));
    execSync('pnpm build', { stdio: 'inherit' });
    console.log(chalk.green('✅ TypeScript build completed'));
  } catch (error) {
    console.error(chalk.red('❌ TypeScript build failed'));
    process.exit(1);
  }
}

async function makeExecutable() {
  try {
    const indexPath = join(BUILD_DIR, 'index.js');
    const content = await fs.readFile(indexPath, 'utf-8');

    // Ensure shebang is present
    if (!content.startsWith('#!/usr/bin/env node')) {
      const newContent = '#!/usr/bin/env node\n' + content;
      await fs.writeFile(indexPath, newContent);
      console.log(chalk.green('✅ Added shebang to index.js'));
    }

    // Make executable (Unix systems)
    if (process.platform !== 'win32') {
      execSync(`chmod +x ${indexPath}`);
      console.log(chalk.green('✅ Made index.js executable'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to make executable:'), error.message);
    process.exit(1);
  }
}

async function packageBinaries() {
  try {
    console.log(chalk.blue('📦 Packaging binaries...'));

    const targets = [
      { name: 'linux', target: 'node18-linux-x64' },
      { name: 'macos', target: 'node18-macos-x64' },
      { name: 'windows', target: 'node18-win-x64' },
    ];

    for (const { name, target } of targets) {
      console.log(chalk.yellow(`📦 Building ${name}...`));

      const outputName = name === 'windows' ? 'cronos.exe' : 'cronos';
      const outputPath = join(PKG_DIR, outputName);

      execSync(
        `pkg ${join(BUILD_DIR, 'index.js')} --targets ${target} --output ${outputPath}`,
        { stdio: 'inherit' }
      );

      console.log(chalk.green(`✅ ${name} binary created: ${outputPath}`));
    }

    console.log(chalk.green('✅ All binaries packaged successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to package binaries:'), error.message);
    process.exit(1);
  }
}

async function createDistributionInfo() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));

    const readme = `# Cronos v${packageJson.version}

Interactive console application for container management on development environment.

## Binaries

- \`cronos\` - Linux x64
- \`cronos\` - macOS x64
- \`cronos.exe\` - Windows x64

## Usage

\`\`\`bash
# Start interactive TUI
./cronos

# Or use specific commands
./cronos start
./cronos list
./cronos up [services...]
./cronos down [services...]
./cronos logs <service>
\`\`\`

## System Requirements

- Docker or Podman installed
- Linux, macOS, or Windows x64

Built with ❤️ using Node.js and blessed.
`;

    await fs.writeFile(join(PKG_DIR, 'README.md'), readme);
    console.log(chalk.green('✅ Distribution README created'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to create distribution info:'), error.message);
  }
}

async function main() {
  console.log(chalk.blue.bold('🚀 Building Cronos Distribution\n'));

  await ensureDirectories();
  await buildTypeScript();
  await makeExecutable();
  await packageBinaries();
  await createDistributionInfo();

  console.log(chalk.green.bold('\n🎉 Build completed successfully!'));
  console.log(chalk.blue(`📁 Binaries available in: ${PKG_DIR}/`));
}

main().catch((error) => {
  console.error(chalk.red('❌ Build failed:'), error);
  process.exit(1);
});