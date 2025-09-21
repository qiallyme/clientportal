@echo off
REM Client Portal Production Deployment Script for Windows

echo 🚀 Starting Client Portal Production Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build frontend
echo 🏗️  Building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found. Please copy deployment/production.env to .env and update the values.
    echo    copy deployment\production.env .env
    echo    # Then edit .env with your production values
    pause
    exit /b 1
)

REM Test production build
echo 🧪 Testing production build...
start /b npm start

REM Wait for server to start
timeout /t 5 /nobreak > nul

REM Test health endpoint
curl -f http://localhost:5000/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend health check passed
) else (
    echo ❌ Backend health check failed
    taskkill /f /im node.exe > nul 2>&1
    pause
    exit /b 1
)

REM Stop test server
taskkill /f /im node.exe > nul 2>&1

echo ✅ Production build test completed successfully!
echo.
echo 🎯 Next steps:
echo 1. Update .env with your production values
echo 2. Deploy to your hosting platform:
echo    - Cloudflare Pages: npm run deploy:pages
echo    - Cloudflare Workers: npm run deploy:cloudflare
echo    - Or follow the DEPLOYMENT_GUIDE.md for other platforms
echo.
echo 📚 See DEPLOYMENT_GUIDE.md for detailed instructions
pause
