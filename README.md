# Client Portal - Modern Full-Stack Application

A modern, real-time client portal built with React, Supabase, and Cloudflare Workers. Features include form submissions, real-time updates, user management, and admin dashboards with enterprise-grade security and performance.

## 🚀 Features

- **Modern Architecture**: React frontend with Cloudflare Workers backend
- **Real-Time Updates**: Live data synchronization using WebSockets
- **Form Management**: Create and manage dynamic forms with custom schemas
- **User Management**: Role-based access control with Supabase Auth
- **Admin Dashboard**: Comprehensive analytics and management tools
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Authentication**: Supabase Auth with JWT tokens and RLS policies
- **Multi-Tenant**: Organization-based data isolation with Row Level Security
- **Global CDN**: Cloudflare's edge network for fast global access

## 🛠 Tech Stack

### Frontend (Cloudflare Pages)

- **React 19** with TypeScript
- **React Router** for navigation
- **Supabase Client** for authentication and real-time features
- **Axios** for API calls
- **Socket.io Client** for real-time updates
- **CSS3** with modern styling

### Backend (Cloudflare Workers)

- **Hono** framework for high-performance API
- **Supabase** for database and authentication
- **JWT** token validation with jose
- **Zod** for request validation
- **CORS** and rate limiting middleware

### Database & Auth

- **Supabase PostgreSQL** with Row Level Security
- **Supabase Auth** for user management
- **Real-time subscriptions** for live updates

### Infrastructure

- **Cloudflare Pages** for frontend hosting
- **Cloudflare Workers** for API hosting
- **Cloudflare CDN** for global distribution
- **Custom domains**: `portal.qially.com` and `api.qially.com`

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Cloudflare account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/qiallyme/clientportal.git
cd clientportal
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Environment Configuration

#### Backend (Cloudflare Workers)

Set up your Cloudflare Workers secrets:

```bash
cd workers/api
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

#### Frontend (React App)

Create environment file:

```bash
cd apps/web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration (production)
REACT_APP_API_URL=https://api.qially.com

# API Configuration (development)
# REACT_APP_API_URL=http://localhost:8787
```

#### Root Environment

Create `env.example` copy:

```bash
cp env.example .env
```

Edit `.env`:

```env
# Client URL (production)
CLIENT_URL=https://portal.qially.com

# API URLs (production)
REACT_APP_API_URL=https://api.qially.com
REACT_APP_SOCKET_URL=https://api.qially.com
```

### 4. Database Setup

#### Option 1: Use Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Apply seed data
supabase db seed
```

#### Option 2: Manual Setup

Run the SQL files in your Supabase SQL Editor:

1. `infra/supabase/migrations/001_initial_schema.sql`
2. `infra/supabase/seeds/001_initial_data.sql`

### 5. Development

#### Start Frontend

```bash
npm run dev
# or
cd apps/web && npm start
```

#### Start Backend (Local Development)

```bash
cd workers/api
npm run dev
```

### 6. Production Deployment

#### Deploy Backend (Cloudflare Workers)

```bash
cd workers/api
npm run deploy
```

#### Deploy Frontend (Cloudflare Pages)

```bash
cd apps/web
npm run build
# Deploy build folder to Cloudflare Pages
```

## 🌐 Production URLs

- **Frontend**: https://portal.qially.com
- **API**: https://api.qially.com
- **Health Check**: https://api.qially.com/health

## 📁 Project Structure

```
clientportal/
├── apps/
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── contexts/       # React contexts
│       │   ├── lib/           # Supabase client
│       │   ├── services/      # API services
│       │   └── types/         # TypeScript types
│       ├── public/            # Static assets
│       └── package.json
├── workers/
│   └── api/                   # Cloudflare Workers API
│       ├── src/
│       │   ├── routes/        # API routes
│       │   ├── middleware/    # Middleware functions
│       │   └── lib/          # Utility libraries
│       ├── wrangler.toml     # Cloudflare Workers config
│       └── package.json
├── infra/
│   └── supabase/             # Database migrations
│       ├── migrations/       # SQL migration files
│       └── seeds/           # Seed data files
├── docs/                    # Documentation
└── package.json            # Root package.json
```

## 🔧 Cloudflare Configuration

### Cloudflare Pages Settings

**Build Settings:**

- **Build command**: `npm ci --prefix apps/web && npm run build --prefix apps/web`
- **Build output directory**: `apps/web/build`
- **Root directory**: `/` (leave empty)

**Environment Variables:**

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_API_URL=https://api.qially.com
```

**Custom Domain:**

- Set up `portal.qially.com` to point to your Cloudflare Pages

### Cloudflare Workers Settings

**Worker Configuration:**

- **Name**: `clientportal-api`
- **Custom Domain**: `api.qially.com`

**Environment Variables:**

```env
JWT_ISSUER=clientportal
```

**Secrets:**

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## 🔐 Authentication Flow

1. **User Registration/Login**: Handled by Supabase Auth
2. **JWT Token**: Generated by Supabase with custom claims
3. **API Requests**: Include JWT token in Authorization header
4. **Row Level Security**: Database policies enforce tenant isolation
5. **Real-time Updates**: WebSocket connections with authenticated users

## 🗄️ Database Schema

### Core Tables

- **organizations**: Multi-tenant organization data
- **users**: User profiles linked to organizations
- **forms**: Dynamic form definitions
- **submissions**: Form submission data

### Security Features

- **Row Level Security (RLS)**: Tenant-based data isolation
- **JWT Claims**: Organization and user context in tokens
- **Helper Functions**: `jwt_org_id()` and `jwt_uid()` for RLS policies

## 🚀 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh session
- `GET /api/auth/me` - Get current user

### Forms

- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form

### Submissions

- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/:id` - Get submission details
- `PUT /api/submissions/:id` - Update submission

### Health

- `GET /health` - Health check endpoint

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install:all

# Start frontend development server
npm run dev

# Build frontend for production
npm run build

# Build and deploy backend
npm run build:worker
npm run deploy:worker

# Type checking
npm run check

# Run tests
npm test
```

## 📝 Environment Variables

### Frontend (Vite)

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_API_URL=https://api.qially.com
```

### Backend (Cloudflare Workers)

```env
JWT_ISSUER=clientportal
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `portal.qially.com` is in the CORS allowlist
2. **Authentication Issues**: Check Supabase configuration and JWT_ISSUER
3. **Database Connection**: Verify Supabase URL and service role key
4. **Build Failures**: Check Node.js version and dependency installation

### Debug Commands

```bash
# Check API health
curl https://api.qially.com/health

# Test CORS
curl -H "Origin: https://portal.qially.com" https://api.qially.com/health

# Check Cloudflare Workers logs
wrangler tail
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the troubleshooting section above

---

**Built with ❤️ using React, Supabase, and Cloudflare**
