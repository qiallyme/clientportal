# Production Deployment Guide

## 🚀 Quick Deployment to Cloudflare

### Prerequisites
- Cloudflare account
- Domain name (optional, can use Cloudflare subdomain)
- Supabase project with existing tables

### Option 1: Cloudflare Pages (Frontend) + Workers (Backend)

#### 1. Frontend Deployment (Cloudflare Pages)

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy build --project-name=client-portal-frontend
```

#### 2. Backend Deployment (Cloudflare Workers)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy backend
wrangler deploy
```

### Option 2: Full Stack on Cloudflare Pages

#### 1. Configure Build Settings

In Cloudflare Pages dashboard:
- **Build command**: `npm run build`
- **Build output directory**: `frontend/build`
- **Root directory**: `/`

#### 2. Environment Variables

Set these in Cloudflare Pages dashboard:

**Backend Variables:**
```
SUPABASE_URL=https://vwqkhjnkummwtvfxgqml.supabase.co
SUPABASE_ANON_KEY=sb_publishable_I7JH7fI8hWP1AtGKskpWew_E4ws1YDa
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=production
REGION=us
CLIENT_URL=https://your-domain.com
```

**Frontend Variables:**
```
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_SOCKET_URL=https://your-api-domain.com
```

### Option 3: Separate Deployments

#### Backend (Node.js Server)
Deploy to any Node.js hosting:
- Vercel
- Railway
- Render
- DigitalOcean App Platform

#### Frontend (React App)
Deploy to:
- Cloudflare Pages
- Vercel
- Netlify

## 🔧 Production Setup Steps

### 1. Update Environment Variables

Copy `deployment/production.env` to `.env` and update:
- Replace `your-domain.com` with your actual domain
- Update `your-service-role-key-here` with your Supabase service role key
- Change `JWT_SECRET` to a secure random string

### 2. Build for Production

```bash
# Build frontend
cd frontend
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000
```

### 3. Deploy Backend

```bash
# Install dependencies
npm install --production

# Start production server
npm start
```

### 4. Configure Domain & SSL

- Point your domain to Cloudflare
- Enable SSL/TLS
- Configure DNS records

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Frontend built successfully
- [ ] Backend tested with production build
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] CORS settings updated
- [ ] Supabase RLS policies configured
- [ ] Error monitoring set up

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret
3. **CORS**: Configure for your production domain only
4. **Rate Limiting**: Already configured in server.js
5. **Helmet**: Security headers already configured

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Update `CLIENT_URL` in backend environment
2. **Build Failures**: Check Node.js version compatibility
3. **API Errors**: Verify Supabase credentials
4. **Socket.io Issues**: Check WebSocket support on hosting platform

### Health Checks

- Backend: `https://your-api-domain.com/api/health`
- Frontend: `https://your-domain.com`

## 📊 Monitoring

Set up monitoring for:
- API response times
- Error rates
- User authentication
- Database performance

## 🔄 CI/CD Pipeline

For automated deployments, set up:
1. GitHub Actions
2. Cloudflare Pages integration
3. Automatic builds on push to main branch

## 📞 Support

If you encounter issues:
1. Check Cloudflare Pages logs
2. Verify environment variables
3. Test API endpoints
4. Check Supabase dashboard for errors
