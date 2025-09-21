#!/bin/bash

# Client Portal Production Deployment Script
set -e

echo "🚀 Starting Client Portal Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please copy deployment/production.env to .env and update the values."
    echo "   cp deployment/production.env .env"
    echo "   # Then edit .env with your production values"
    exit 1
fi

# Test production build
echo "🧪 Testing production build..."
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    kill $SERVER_PID
    exit 1
fi

# Stop test server
kill $SERVER_PID

echo "✅ Production build test completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env with your production values"
echo "2. Deploy to your hosting platform:"
echo "   - Cloudflare Pages: npm run deploy:pages"
echo "   - Cloudflare Workers: npm run deploy:cloudflare"
echo "   - Or follow the DEPLOYMENT_GUIDE.md for other platforms"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
