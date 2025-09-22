import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { submissionsAPI, formsAPI } from '../../services/api';
import { Submission, Form } from '../../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { socket, joinRoom } = useSocket();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    recentSubmissions: 0,
    statusBreakdown: [] as any[],
    priorityBreakdown: [] as any[],
  });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (socket) {
      // Join dashboard room for real-time updates
      joinRoom('dashboard');

      // Listen for new submissions
      socket.on('new-submission', (data) => {
        setRecentSubmissions(prev => [data.submission, ...prev.slice(0, 9)]);
        setStats(prev => ({
          ...prev,
          totalSubmissions: prev.totalSubmissions + 1,
          recentSubmissions: prev.recentSubmissions + 1,
        }));
      });

      // Listen for submission updates
      socket.on('submission-updated', (data) => {
        setRecentSubmissions(prev => 
          prev.map(sub => 
            sub._id === data.submission._id ? data.submission : sub
          )
        );
      });

      return () => {
        socket.off('new-submission');
        socket.off('submission-updated');
      };
    }
  }, [socket, joinRoom]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, submissionsResponse, formsResponse] = await Promise.all([
        submissionsAPI.getStats('7d'),
        submissionsAPI.getSubmissions({ limit: 10 }),
        formsAPI.getForms({ limit: 5 }),
      ]);

      setStats(statsResponse.data.data);
      setRecentSubmissions(submissionsResponse.data.data);
      setRecentForms(formsResponse.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's what's happening with your portal today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalSubmissions}</h3>
            <p>Total Submissions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>{stats.recentSubmissions}</h3>
            <p>Recent Submissions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{recentForms.length}</h3>
            <p>Active Forms</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{user?.role}</h3>
            <p>Your Role</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Submissions</h2>
          <div className="submissions-list">
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission) => (
                <div key={submission._id} className="submission-item">
                  <div className="submission-info">
                    <h4>{submission.submissionNumber}</h4>
                    <p>
                      Form: {typeof submission.formId === 'object' ? submission.formId.title : submission.formId}
                      {submission.submittedBy && (
                        <span> • By: {submission.submittedBy?.name || 'Unknown User'}</span>
                      )}
                    </p>
                    <p className="submission-date">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="submission-meta">
                    <span
                      className="status-badge"
                      data-status={submission.status}
                    >
                      {submission.status}
                    </span>
                    <span
                      className="priority-badge"
                      data-priority={submission.priority}
                    >
                      {submission.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No recent submissions</p>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Forms</h2>
          <div className="forms-list">
            {recentForms.length > 0 ? (
              recentForms.map((form) => (
                <div key={form._id} className="form-item">
                  <div className="form-info">
                    <h4>{form.title}</h4>
                    <p>{form.description || 'No description'}</p>
                    <p className="form-meta">
                      {form.submissionCount} submissions • Created by {form.createdBy?.name || 'Unknown User'}
                    </p>
                  </div>
                  <div className="form-status">
                    <span className={`status-indicator ${form.isActive ? 'active' : 'inactive'}`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No forms available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
