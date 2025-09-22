#!/usr/bin/env node

/**
 * Build Cache Manager
 * 
 * Manages build caching to speed up deployments by:
 * 1. Caching node_modules between builds
 * 2. Caching build artifacts
 * 3. Only rebuilding when source files change
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const CACHE_DIR = path.join(process.cwd(), '.build-cache');
const NODE_MODULES_CACHE = path.join(CACHE_DIR, 'node_modules');
const BUILD_CACHE = path.join(CACHE_DIR, 'build');
const CACHE_MANIFEST = path.join(CACHE_DIR, 'manifest.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

function getSourceHash() {
  const srcDir = path.join(process.cwd(), 'src');
  const publicDir = path.join(process.cwd(), 'public');
  const packageJson = path.join(process.cwd(), 'package.json');
  
  let hash = '';
  
  // Hash package.json for dependency changes
  hash += getFileHash(packageJson) || '';
  
  // Hash all source files
  function hashDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        hashDirectory(filePath);
      } else {
        hash += getFileHash(filePath) || '';
      }
    }
  }
  
  hashDirectory(srcDir);
  hashDirectory(publicDir);
  
  return crypto.createHash('md5').update(hash).digest('hex');
}

function loadCacheManifest() {
  if (!fs.existsSync(CACHE_MANIFEST)) {
    return { sourceHash: null, buildHash: null };
  }
  
  try {
    return JSON.parse(fs.readFileSync(CACHE_MANIFEST, 'utf8'));
  } catch {
    return { sourceHash: null, buildHash: null };
  }
}

function saveCacheManifest(manifest) {
  fs.writeFileSync(CACHE_MANIFEST, JSON.stringify(manifest, null, 2));
}

function copyDir(src, dest) {
  if (process.platform === 'win32') {
    execSync(`xcopy "${src}" "${dest}" /E /I /H /Y`, { stdio: 'inherit' });
  } else {
    execSync(`cp -r "${src}" "${dest}"`, { stdio: 'inherit' });
  }
}

function removeDir(dir) {
  if (process.platform === 'win32') {
    execSync(`rmdir /S /Q "${dir}"`, { stdio: 'inherit' });
  } else {
    execSync(`rm -rf "${dir}"`, { stdio: 'inherit' });
  }
}

function restoreNodeModules() {
  if (fs.existsSync(NODE_MODULES_CACHE)) {
    console.log('📦 Restoring cached node_modules...');
    copyDir(NODE_MODULES_CACHE, path.join(process.cwd(), 'node_modules'));
    return true;
  }
  return false;
}

function cacheNodeModules() {
  if (fs.existsSync('node_modules')) {
    console.log('💾 Caching node_modules...');
    if (fs.existsSync(NODE_MODULES_CACHE)) {
      removeDir(NODE_MODULES_CACHE);
    }
    copyDir(path.join(process.cwd(), 'node_modules'), NODE_MODULES_CACHE);
  }
}

function restoreBuild() {
  if (fs.existsSync(BUILD_CACHE)) {
    console.log('🏗️ Restoring cached build...');
    if (fs.existsSync('build')) {
      removeDir('build');
    }
    copyDir(BUILD_CACHE, 'build');
    return true;
  }
  return false;
}

function cacheBuild() {
  if (fs.existsSync('build')) {
    console.log('💾 Caching build artifacts...');
    if (fs.existsSync(BUILD_CACHE)) {
      removeDir(BUILD_CACHE);
    }
    copyDir('build', BUILD_CACHE);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'install') {
    console.log('🚀 Fast install with caching...');
    
    const manifest = loadCacheManifest();
    const currentSourceHash = getSourceHash();
    
    // Check if we can restore node_modules
    if (manifest.sourceHash === currentSourceHash && restoreNodeModules()) {
      console.log('✅ Using cached node_modules');
    } else {
      console.log('📦 Installing dependencies...');
      execSync('npm ci', { stdio: 'inherit' });
      cacheNodeModules();
    }
    
    // Update manifest
    manifest.sourceHash = currentSourceHash;
    saveCacheManifest(manifest);
    
  } else if (command === 'build') {
    console.log('🏗️ Fast build with caching...');
    
    const manifest = loadCacheManifest();
    const currentSourceHash = getSourceHash();
    
    // Check if we can restore build
    if (manifest.sourceHash === currentSourceHash && manifest.buildHash === currentSourceHash && restoreBuild()) {
      console.log('✅ Using cached build');
    } else {
      console.log('🔨 Building from source...');
      execSync('npm run build', { stdio: 'inherit' });
      cacheBuild();
    }
    
    // Update manifest
    manifest.sourceHash = currentSourceHash;
    manifest.buildHash = currentSourceHash;
    saveCacheManifest(manifest);
    
  } else if (command === 'clean') {
    console.log('🧹 Cleaning build cache...');
    if (fs.existsSync(CACHE_DIR)) {
      execSync(`rm -rf "${CACHE_DIR}"`, { stdio: 'inherit' });
    }
    console.log('✅ Cache cleaned');
    
  } else {
    console.log('Build Cache Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node build-cache.js install  - Fast install with caching');
    console.log('  node build-cache.js build    - Fast build with caching');
    console.log('  node build-cache.js clean    - Clean build cache');
    console.log('');
    console.log('Cache location:', CACHE_DIR);
  }
}

main().catch(console.error);
