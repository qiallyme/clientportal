import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { FormsProvider } from './contexts/FormsContext';
import { SubmissionsProvider } from './contexts/SubmissionsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout/Layout';
import LandingPage from './components/Landing/LandingPage';
import EnterpriseLogin from './components/Auth/EnterpriseLogin';
import Register from './components/Auth/Register';
import EnterpriseMagicLink from './components/Auth/EnterpriseMagicLink';
import AuthCallback from './components/Auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import { FormsList, FormBuilder, FormViewer, FormSubmission } from './components/Forms';
import { SubmissionsList, SubmissionViewer, SubmissionEditor } from './components/Submissions';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useSupabaseAuth();
  const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

  // CRITICAL: Don't redirect while loading to prevent loops
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // MVP: Allow access even without authentication (demo mode)
  // Only redirect if we're sure the user is not authenticated AND not in demo mode
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has a valid tenant context (hierarchical access control)
  if (isAuthenticated && user && !user.tenantId && user.role !== 'super_admin') {
    // User is authenticated but doesn't have tenant context - redirect to tenant selection
    return <Navigate to="/select-tenant" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSupabaseAuth();

  // CRITICAL: Don't redirect while loading to prevent loops
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Only redirect if we're sure the user is authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Admin Only Route Component (Hierarchical Access Control)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading, checkPermission } = useSupabaseAuth();
  const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // MVP: Allow access in demo mode
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  // Hierarchical access control - check if user has admin permissions
  const userRole = user?.role || 'user';
  const isSuperAdmin = userRole === 'super_admin';
  const isTenantAdmin = userRole === 'tenant_admin';
  const hasAdminPermissions = checkPermission('manage:tenants') || checkPermission('manage:users');

  // Grant access if user is super admin, tenant admin, or has admin permissions
  const isAdmin = isDemoMode || isSuperAdmin || isTenantAdmin || hasAdminPermissions;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <EnterpriseLogin />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/magic-link"
        element={
          <PublicRoute>
            <EnterpriseMagicLink />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/callback"
        element={<AuthCallback />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Forms Routes */}
      <Route
        path="/forms"
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <FormsList />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ErrorBoundary>
                <FormBuilder />
              </ErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <FormViewer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <FormBuilder />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/submit"
        element={<FormSubmission />}
      />
      <Route
        path="/forms/:id/submissions"
        element={
          <AdminRoute>
            <Layout>
              <div className="page-placeholder">
                <h1>Form Submissions</h1>
                <p>Form-specific submissions view coming soon...</p>
              </div>
            </Layout>
          </AdminRoute>
        }
      />
      
      {/* Submissions Routes - Admin Only */}
      <Route
        path="/submissions"
        element={
          <AdminRoute>
            <Layout>
              <SubmissionsList />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/submissions/:id"
        element={
          <AdminRoute>
            <Layout>
              <SubmissionViewer />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/submissions/:id/edit"
        element={
          <AdminRoute>
            <Layout>
              <SubmissionEditor />
            </Layout>
          </AdminRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <AdminRoute>
            <Layout>
              <div className="page-placeholder">
                <h1>Users</h1>
                <p>User management coming soon...</p>
              </div>
            </Layout>
          </AdminRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="page-placeholder">
                <h1>Profile</h1>
                <p>Profile management coming soon...</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="page-placeholder">
                <h1>Settings</h1>
                <p>Settings coming soon...</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <Layout>
            <div className="page-placeholder">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
            </div>
          </Layout>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <SocketProvider>
          <FormsProvider>
            <SubmissionsProvider>
              <Router>
                <div className="App">
                  <AppRoutes />
                </div>
              </Router>
            </SubmissionsProvider>
          </FormsProvider>
        </SocketProvider>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
