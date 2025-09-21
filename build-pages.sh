#!/bin/bash

# Cloudflare Pages Build Script
set -e

echo "🚀 Building for Cloudflare Pages..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output: frontend/build"
