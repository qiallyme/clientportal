# Locked Files Documentation

This document lists all files and sections that are locked to prevent accidental edits to working code.

## 🚫 File-Level Locks

### Frontend (React App)
- **`apps/web/src/lib/supabase.ts`** - Supabase client configuration
  - **Reason**: Contains working authentication setup with proper environment variable validation
  - **Last Verified**: 2025-09-22 - Authentication is functional
  - **Lock Type**: File-level lock (first line)

- **`apps/web/src/services/api.ts`** - API service configuration
  - **Reason**: Contains working API service with correct base URL configuration
  - **Last Verified**: 2025-09-22 - API calls are functional
  - **Lock Type**: File-level lock (first line)

### Backend (Cloudflare Workers)
- **`workers/api/src/index.ts`** - Main API server configuration
  - **Reason**: Contains working CORS configuration and server setup
  - **Last Verified**: 2025-09-22 - API server is functional
  - **Lock Type**: File-level lock (first line)

- **`workers/api/src/routes/auth.ts`** - Authentication routes
  - **Reason**: Contains working Supabase Auth integration
  - **Last Verified**: 2025-09-22 - Authentication is functional
  - **Lock Type**: File-level lock (first line)

- **`workers/api/wrangler.toml`** - Cloudflare Workers configuration
  - **Reason**: Contains working deployment configuration
  - **Last Verified**: 2025-09-22 - Deployment is functional
  - **Lock Type**: File-level lock (first line)

## 🔒 Section-Level Locks

### Supabase Client Configuration
- **File**: `apps/web/src/lib/supabase.ts`
- **Section**: Supabase client creation (lines 27-37)
- **Reason**: Working authentication client setup
- **Lock Type**: Section lock with LOCK-START/LOCK-END markers

### CORS Configuration
- **File**: `workers/api/src/index.ts`
- **Section**: CORS allowed origins (lines 26-34)
- **Reason**: Working cross-origin configuration for production domains
- **Lock Type**: Section lock with LOCK-START/LOCK-END markers

## 🔓 How to Unlock

To edit any locked file or section, you must:

1. **Create an RFC** (Request for Comments) explaining:
   - What changes are needed
   - Why the current implementation is insufficient
   - How the changes will be tested
   - Rollback plan if changes break functionality

2. **Get explicit approval** from the project maintainer

3. **Remove the lock** by deleting the lock comment

4. **Make the changes** with thorough testing

5. **Re-lock** the file/section after verification

## 🚨 Emergency Override

In case of critical security issues or production emergencies:

1. Document the emergency in `docs/devlog.md`
2. Make the minimal necessary changes
3. Test thoroughly
4. Re-lock immediately after verification
5. Create a post-incident RFC for permanent changes

## 📝 Lock Maintenance

- **Review locks monthly** to ensure they're still necessary
- **Update "Last Verified" dates** when testing locked functionality
- **Document any temporary unlocks** in `docs/devlog.md`
- **Remove locks** for files that are no longer critical

## 🎯 Lock Philosophy

Locks are used to protect:
- ✅ **Working authentication flows**
- ✅ **Production deployment configurations**
- ✅ **Critical API endpoints**
- ✅ **Environment variable handling**

Locks are NOT used for:
- ❌ **UI/UX improvements**
- ❌ **Feature additions**
- ❌ **Documentation updates**
- ❌ **Test files**

---

**Remember**: The goal is to prevent accidental breaking of working functionality, not to prevent all changes. When in doubt, create an RFC and get approval.
