import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForms } from '../../contexts/FormsContext';
import { useAuth } from '../../contexts/AuthContext';
import './FormsList.css';

const FormsList: React.FC = () => {
  const { forms, loading, error, pagination, fetchForms, deleteForm } = useForms();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchForms({
      page: 1,
      limit: 10,
      search: searchTerm || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    });
  }, [searchTerm, statusFilter, fetchForms]);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the form "${title}"?`)) {
      try {
        await deleteForm(id);
      } catch (error) {
        console.error('Failed to delete form:', error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchForms({
      page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    });
  };

  if (loading && forms.length === 0) {
    return (
      <div className="forms-list">
        <div className="loading">Loading forms...</div>
      </div>
    );
  }

  return (
    <div className="forms-list">
      <div className="forms-header">
        <h1>Forms Management</h1>
        {user?.permissions.canCreateForms && (
          <Link to="/forms/new" className="btn btn-primary">
            Create New Form
          </Link>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="forms-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Forms</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      <div className="forms-grid">
        {forms.length === 0 ? (
          <div className="no-forms">
            <p>No forms found.</p>
            {user?.permissions.canCreateForms && (
              <Link to="/forms/new" className="btn btn-primary">
                Create Your First Form
              </Link>
            )}
          </div>
        ) : (
          forms.map((form) => (
            <div key={form._id} className="form-card">
              <div className="form-card-header">
                <h3>{form.title}</h3>
                <div className="form-status">
                  <span className={`status-badge ${form.isActive ? 'active' : 'inactive'}`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {form.isPublic && (
                    <span className="status-badge public">Public</span>
                  )}
                </div>
              </div>
              
              {form.description && (
                <p className="form-description">{form.description}</p>
              )}
              
              <div className="form-stats">
                <div className="stat">
                  <span className="stat-label">Fields:</span>
                  <span className="stat-value">{form.fields.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Submissions:</span>
                  <span className="stat-value">{form.submissionCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Created:</span>
                  <span className="stat-value">
                    {new Date(form.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                {form.isActive && (
                  <Link to={`/forms/${form._id}/submit`} className="btn btn-primary">
                    Submit Form
                  </Link>
                )}
                <Link to={`/forms/${form._id}`} className="btn btn-secondary">
                  View
                </Link>
                {user?.permissions.canCreateForms && (
                  <Link to={`/forms/${form._id}/edit`} className="btn btn-outline">
                    Edit
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to={`/forms/${form._id}/submissions`} className="btn btn-outline">
                    Submissions
                  </Link>
                )}
                {user?.permissions.canCreateForms && (
                  <button
                    onClick={() => handleDelete(form._id, form.title)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
            Page {pagination.page} of {pagination.pages}
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

export default FormsList;
