import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { FormsProvider } from './contexts/FormsContext';
import { SubmissionsProvider } from './contexts/SubmissionsContext';
import Layout from './components/Layout/Layout';
import SupabaseLogin from './components/Auth/SupabaseLogin';
import Register from './components/Auth/Register';
import SupabaseMagicLink from './components/Auth/SupabaseMagicLink';
import AuthCallback from './components/Auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import { FormsList, FormBuilder, FormViewer, FormSubmission } from './components/Forms';
import { SubmissionsList, SubmissionViewer, SubmissionEditor } from './components/Submissions';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSupabaseAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSupabaseAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

// Admin Only Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useSupabaseAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role in user metadata
  const userRole = user?.user_metadata?.role || 'user';
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <SupabaseLogin />
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
            <SupabaseMagicLink />
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
              <Dashboard />
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
              <FormsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/new"
        element={
          <ProtectedRoute>
            <Layout>
              <FormBuilder />
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
  );
}

export default App;
