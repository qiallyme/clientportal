import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubmissions } from '../../contexts/SubmissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import './SubmissionsList.css';

const SubmissionsList: React.FC = () => {
  const { 
    submissions, 
    loading, 
    error, 
    pagination, 
    stats,
    fetchSubmissions, 
    deleteSubmission,
    fetchStats 
  } = useSubmissions();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    formId: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchSubmissions({
      page: 1,
      limit: 10,
      ...(filters.search && { search: filters.search }),
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.priority !== 'all' && { priority: filters.priority }),
      ...(filters.assignedTo !== 'all' && { assignedTo: filters.assignedTo }),
      ...(filters.formId !== 'all' && { formId: filters.formId }),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
    fetchStats();
  }, [filters, fetchSubmissions, fetchStats]);

  const handleDelete = async (id: string, submissionNumber: string) => {
    if (window.confirm(`Are you sure you want to delete submission ${submissionNumber}?`)) {
      try {
        await deleteSubmission(id);
      } catch (error) {
        console.error('Failed to delete submission:', error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchSubmissions({
      page,
      limit: pagination.limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.priority !== 'all' && { priority: filters.priority }),
      ...(filters.assignedTo !== 'all' && { assignedTo: filters.assignedTo }),
      ...(filters.formId !== 'all' && { formId: filters.formId }),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'rejected': return 'status-rejected';
      case 'on-hold': return 'status-on-hold';
      default: return 'status-pending';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="submissions-list">
        <div className="loading">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="submissions-list">
      <div className="submissions-header">
        <h1>Submissions Management</h1>
        <div className="header-actions">
          <button
            onClick={() => fetchSubmissions()}
            className="btn btn-outline"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.onHold}</div>
            <div className="stat-label">On Hold</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="submissions-filters">
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search submissions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="filter-select"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="filter-select"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="priority">Sort by Priority</option>
              <option value="submissionNumber">Sort by Number</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
              className="filter-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="submissions-table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Submission #</th>
              <th>Form</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Submitted By</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-submissions">
                  No submissions found.
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission._id}>
                  <td>
                    <Link to={`/submissions/${submission._id}`} className="submission-link">
                      {submission.submissionNumber}
                    </Link>
                  </td>
                  <td>
                    <div className="form-info">
                      <span className="form-title">
                        {typeof submission.formId === 'object' ? submission.formId.title : submission.formId}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(submission.status)}`}>
                      {submission.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityColor(submission.priority)}`}>
                      {submission.priority}
                    </span>
                  </td>
                  <td>
                    {submission.submittedBy ? (
                      <div className="user-info">
                        <span className="user-name">{submission.submittedBy.name}</span>
                        <span className="user-email">{submission.submittedBy.email}</span>
                      </div>
                    ) : (
                      <span className="anonymous">Anonymous</span>
                    )}
                  </td>
                  <td>
                    {submission.assignedTo ? (
                      <div className="user-info">
                        <span className="user-name">{submission.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="unassigned">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="date-info">
                      <span className="date">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                      <span className="time">
                        {new Date(submission.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/submissions/${submission._id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        View
                      </Link>
                      {user?.permissions.canEditSubmissions && (
                        <Link
                          to={`/submissions/${submission._id}/edit`}
                          className="btn btn-sm btn-outline"
                        >
                          Edit
                        </Link>
                      )}
                      {user?.permissions.canEditSubmissions && (
                        <button
                          onClick={() => handleDelete(submission._id, submission.submissionNumber)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn btn-outline"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;
