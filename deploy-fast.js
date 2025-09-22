#!/usr/bin/env node

/**
 * Fast Deployment Script
 * 
 * Deploys both frontend and API with build caching for maximum speed.
 * Only rebuilds what has changed.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  log(`Running: ${command}`, 'cyan');
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    return false;
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('⚠️  Warning: You have uncommitted changes', 'yellow');
      log('Consider committing changes before deployment', 'yellow');
    }
  } catch {
    // Not a git repo, ignore
  }
}

async function deployAPI() {
  log('\n🚀 Deploying API (Workers)...', 'blue');
  
  const apiDir = path.join(process.cwd(), 'workers', 'api');
  
  if (!fs.existsSync(apiDir)) {
    log('❌ API directory not found', 'red');
    return false;
  }
  
  // Run safe deployment with caching
  if (!runCommand('npm run deploy:safe:fast', apiDir)) {
    log('❌ API deployment failed', 'red');
    return false;
  }
  
  log('✅ API deployed successfully', 'green');
  return true;
}

async function deployFrontend() {
  log('\n🌐 Deploying Frontend (Pages)...', 'blue');
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found', 'red');
    return false;
  }
  
  // Fast install with caching
  if (!runCommand('npm run install:fast', frontendDir)) {
    log('❌ Frontend install failed', 'red');
    return false;
  }
  
  // Fast build with caching
  if (!runCommand('npm run build:fast', frontendDir)) {
    log('❌ Frontend build failed', 'red');
    return false;
  }
  
  // Deploy to Pages
  if (!runCommand('wrangler pages deploy build --project-name=clientportal', frontendDir)) {
    log('❌ Frontend deployment failed', 'red');
    return false;
  }
  
  log('✅ Frontend deployed successfully', 'green');
  return true;
}

async function main() {
  const startTime = Date.now();
  
  log('🚀 Fast Deployment Starting...', 'bright');
  log('Using build caching for maximum speed', 'cyan');
  
  checkGitStatus();
  
  const args = process.argv.slice(2);
  const deployAPI = !args.includes('--frontend-only');
  const deployFrontend = !args.includes('--api-only');
  
  let success = true;
  
  if (deployAPI) {
    success = await deployAPI() && success;
  }
  
  if (deployFrontend) {
    success = await deployFrontend() && success;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  if (success) {
    log('\n🎉 Deployment completed successfully!', 'green');
    log(`⏱️  Total time: ${duration}s`, 'cyan');
    log('\n📋 Next steps:', 'bright');
    log('• Test the application at the deployed URLs', 'reset');
    log('• Check Cloudflare dashboard for deployment status', 'reset');
    log('• Monitor logs with: wrangler tail', 'reset');
  } else {
    log('\n❌ Deployment failed!', 'red');
    log('Check the errors above and try again', 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Fast Deployment Script', 'bright');
  log('');
  log('Usage:');
  log('  node deploy-fast.js                 - Deploy both API and frontend');
  log('  node deploy-fast.js --api-only      - Deploy only API');
  log('  node deploy-fast.js --frontend-only - Deploy only frontend');
  log('  node deploy-fast.js --help          - Show this help');
  log('');
  log('Features:');
  log('• Build caching for faster deployments');
  log('• Only rebuilds what has changed');
  log('• Safe deployment with authentication tests');
  log('• Automatic error handling');
  process.exit(0);
}

main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
