const fs = require('fs');
const path = require('path');

function validateBuild() {
  const distPkgPath = path.join(process.cwd(), 'dist-pkg');
  const indexPath = path.join(distPkgPath, 'index.js');

  console.log('🔍 Validating PKG build...');

  // Check if dist-pkg directory exists
  if (!fs.existsSync(distPkgPath)) {
    console.error('❌ dist-pkg directory not found. Run "pnpm build:pkg" first.');
    process.exit(1);
  }

  // Check if index.js exists
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist-pkg/index.js not found. Build may have failed.');
    process.exit(1);
  }

  // Check if the file is CommonJS format
  const content = fs.readFileSync(indexPath, 'utf8');
  if (!content.includes('module.exports') && !content.includes('exports.') && !content.includes('require(')) {
    console.warn('⚠️  Warning: Output may not be in CommonJS format. PKG might fail.');
  }

  // Check file size (should be reasonable)
  const stats = fs.statSync(indexPath);
  if (stats.size < 1000) {
    console.error('❌ Build output is suspiciously small. Check for build errors.');
    process.exit(1);
  }

  console.log('✅ PKG build validation passed');
  console.log(`📦 Build size: ${(stats.size / 1024).toFixed(2)} KB`);

  // Check for problematic imports
  const problematicPatterns = [
    /import\s+.*\s+from\s+['"]chalk['"]/, // ESM chalk imports
    /import\s+.*\s+from\s+['"]blessed['"]/, // Direct blessed imports
    /\.mjs['"]/, // .mjs file references
  ];

  let hasProblems = false;
  problematicPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      hasProblems = true;
      console.warn(`⚠️  Warning: Found potentially problematic pattern ${index + 1}`);
    }
  });

  if (!hasProblems) {
    console.log('✅ No problematic import patterns detected');
  }

  return true;
}

function copyPackageJson() {
  const srcPath = path.join(process.cwd(), 'package.json');
  const destPath = path.join(process.cwd(), 'dist-pkg', 'package.json');

  try {
    const packageJson = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

    // Create a minimal package.json for PKG
    const pkgPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: 'index.js',
      type: 'commonjs', // Ensure CommonJS
      bin: {
        cronos: 'index.js'
      },
      engines: packageJson.engines,
      dependencies: {
        // Only include runtime dependencies that PKG needs
        'blessed': packageJson.dependencies.blessed,
        'blessed-contrib': packageJson.dependencies['blessed-contrib'],
        'chalk': packageJson.dependencies.chalk,
        'chokidar': packageJson.dependencies.chokidar,
        'commander': packageJson.dependencies.commander,
        'dotenv': packageJson.dependencies.dotenv,
        'fs-extra': packageJson.dependencies['fs-extra'],
        'systeminformation': packageJson.dependencies.systeminformation,
        'yaml': packageJson.dependencies.yaml
      }
    };

    fs.writeFileSync(destPath, JSON.stringify(pkgPackageJson, null, 2));
    console.log('✅ Created PKG-optimized package.json');
  } catch (error) {
    console.error('❌ Failed to copy package.json:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Starting PKG build process...');

  try {
    validateBuild();
    copyPackageJson();

    console.log('✅ PKG build process completed successfully');
    console.log('📦 Ready for binary packaging with "pnpm pkg:all"');
  } catch (error) {
    console.error('❌ PKG build process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateBuild, copyPackageJson };