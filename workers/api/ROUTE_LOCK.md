# 🔒 Route Lock System

## Purpose

This system prevents authentication regressions by automatically testing the complete auth flow before deployment.

## Usage

### Safe Deployment (Recommended)
```bash
npm run deploy:safe
```

This runs:
1. `npm run check` - TypeScript compilation
2. `npm run test:auth` - Authentication flow test  
3. `npm run deploy` - Actual deployment

### Manual Testing
```bash
npm run test:auth
```

## What Gets Tested

1. **Dev-login endpoint** - `/api/auth/dev-login`
2. **User profile endpoint** - `/api/auth/me` 
3. **Forms access** - `/api/forms`
4. **Token refresh** - `/api/auth/refresh`

## Test Failure

If any test fails, deployment is **blocked** with:
```
❌ Authentication test failed
🚨 ROUTE LOCK FAILED - DO NOT DEPLOY
```

## Adding New Tests

To add new authentication tests, edit `test-auth-flow.js` and add your test steps.

## Emergency Override

If you need to deploy despite test failures (emergency only):
```bash
npm run deploy  # Skip tests
```

⚠️ **Only use this in emergencies - fix the tests ASAP**

## Lock Status

✅ **LOCKED** - Authentication routes are protected and tested
