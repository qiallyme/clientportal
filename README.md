# Client Portal - Cross-Region MERN Stack Application

A modern, real-time client portal built with the MERN stack, designed to work seamlessly in both China and the US without requiring a VPN. Features include form submissions, real-time updates, user management, and admin dashboards.

## 🚀 Features

- **Cross-Region Access**: Optimized for both China and US regions
- **Real-Time Updates**: Live data synchronization using Socket.io
- **Form Management**: Create and manage dynamic forms
- **User Management**: Role-based access control with permissions
- **Admin Dashboard**: Comprehensive analytics and management tools
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with role permissions

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Helmet** for security
- **Express Rate Limiting** for API protection

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time updates
- **CSS3** with modern styling

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd client-portal
```

### 2. Install Dependencies

#### Backend
```bash
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Environment Configuration

#### Backend (.env)
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/client-portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
REGION=us

# Client URL
CLIENT_URL=http://localhost:3000
```

#### Frontend (client/.env)
```bash
cd client
cp env.example .env
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Start the Application

#### Development Mode
```bash
# Start backend (from root directory)
npm run dev

# Start frontend (from client directory)
cd client
npm start
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🌍 Cross-Region Deployment

### Recommended Infrastructure

#### For US Region:
- **Hosting**: AWS, Google Cloud, or DigitalOcean
- **Database**: MongoDB Atlas (US region)
- **CDN**: CloudFlare or AWS CloudFront

#### For China Region:
- **Hosting**: Alibaba Cloud, Tencent Cloud, or AWS China
- **Database**: MongoDB Atlas (Asia Pacific region)
- **CDN**: Alibaba Cloud CDN or Tencent Cloud CDN

### Deployment Steps

1. **Set up MongoDB Atlas**:
   - Create clusters in both US and China regions
   - Configure replica sets for high availability
   - Set up proper security groups

2. **Deploy Backend**:
   ```bash
   # Build and deploy to your hosting provider
   npm run build
   ```

3. **Deploy Frontend**:
   ```bash
   cd client
   npm run build
   # Deploy build folder to CDN/hosting
   ```

4. **Environment Variables**:
   - Set production environment variables
   - Configure CORS for cross-region access
   - Set up SSL certificates

### Performance Optimization

- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **CDN Configuration**: Use regional CDNs for static assets
- **Caching**: Implement Redis for session and data caching
- **Load Balancing**: Use load balancers for high availability

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Forms Endpoints
- `GET /api/forms` - Get all forms
- `POST /api/forms` - Create new form
- `GET /api/forms/:id` - Get single form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form

### Submissions Endpoints
- `GET /api/submissions` - Get all submissions
- `POST /api/submissions` - Create new submission
- `GET /api/submissions/:id` - Get single submission
- `PUT /api/submissions/:id` - Update submission
- `POST /api/submissions/:id/notes` - Add note to submission

### Users Endpoints (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, User, and Viewer roles
- **Permission System**: Granular permissions for different actions
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet Security**: Security headers and protection

## 🎨 User Interface

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on all device sizes
- **Real-Time Updates**: Live data synchronization
- **Intuitive Navigation**: Easy-to-use navigation system
- **Accessibility**: WCAG compliant design

## 📊 Admin Features

- **Dashboard Analytics**: Overview of system statistics
- **User Management**: Create, edit, and manage users
- **Form Management**: Create and configure forms
- **Submission Tracking**: Monitor and manage submissions
- **Real-Time Monitoring**: Live updates and notifications

## 🔧 Development

### Project Structure
```
client-portal/
├── models/           # MongoDB models
├── routes/           # API routes
├── middleware/       # Custom middleware
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── public/       # Static assets
├── server.js         # Main server file
└── package.json      # Dependencies
```

### Available Scripts

#### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run client` - Start React development server

#### Frontend
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

The application includes real-time updates for:
- New form submissions
- Submission status changes
- User activity
- System notifications

## 🌟 Key Benefits

- **No VPN Required**: Works in both China and US
- **Fast Performance**: Optimized for cross-region access
- **Real-Time**: Live updates like Google Sheets
- **Secure**: Enterprise-grade security
- **Scalable**: Built to handle growth
- **User-Friendly**: Intuitive interface for all users
