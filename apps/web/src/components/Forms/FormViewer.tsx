import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForms } from '../../contexts/FormsContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { User } from '../../types';
import { authAPI } from '../../services/api';
import './FormViewer.css';

const FormViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentForm, loading, error, fetchForm, clearError } = useForms();
  const { user: supabaseUser, isAuthenticated } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && supabaseUser) {
        try {
          const response = await authAPI.getMe();
          if (response.data.success && response.data.data) {
            setUserProfile(response.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, supabaseUser]);

  useEffect(() => {
    if (id) {
      fetchForm(id);
    }
    return () => clearError();
  }, [id, fetchForm, clearError]);

  if (loading) {
    return (
      <div className="form-viewer">
        <div className="loading">Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-viewer">
        <div className="error-message">
          {error}
        </div>
        <Link to="/forms" className="btn btn-primary">
          Back to Forms
        </Link>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="form-viewer">
        <div className="no-form">
          <h2>Form not found</h2>
          <p>The requested form could not be found.</p>
          <Link to="/forms" className="btn btn-primary">
            Back to Forms
          </Link>
        </div>
      </div>
    );
  }

  const renderFieldPreview = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            className="field-preview"
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            className="field-preview"
            rows={3}
          />
        );
      case 'select':
        return (
          <select id={field.name} disabled className="field-preview">
            <option>{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
            {field.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map((option: string, index: number) => (
              <label key={index} className="radio-option">
                <input type="radio" name={field.name} disabled />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <label className="checkbox-option">
            <input type="checkbox" disabled />
            <span>{field.label}</span>
          </label>
        );
      case 'date':
        return (
          <input
            type="date"
            id={field.name}
            disabled
            className="field-preview"
          />
        );
      case 'file':
        return (
          <input
            type="file"
            id={field.name}
            disabled
            className="field-preview"
          />
        );
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            className="field-preview"
          />
        );
    }
  };

  return (
    <div className="form-viewer">
      <div className="form-viewer-header">
        <div className="header-content">
          <h1>{currentForm.title}</h1>
          <div className="form-meta">
            <span className={`status-badge ${currentForm.isActive ? 'active' : 'inactive'}`}>
              {currentForm.isActive ? 'Active' : 'Inactive'}
            </span>
            {currentForm.isPublic && (
              <span className="status-badge public">Public</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {currentForm.isActive && (
            <Link to={`/forms/${currentForm._id}/submit`} className="btn btn-primary">
              Submit Form
            </Link>
          )}
          {userProfile?.permissions.canCreateForms && (
            <>
              <Link to={`/forms/${currentForm._id}/edit`} className="btn btn-outline">
                Edit Form
              </Link>
              <Link to={`/forms/${currentForm._id}/submissions`} className="btn btn-secondary">
                View Submissions
              </Link>
            </>
          )}
          <Link to="/forms" className="btn btn-outline">
            Back to Forms
          </Link>
        </div>
      </div>

      {currentForm.description && (
        <div className="form-description">
          <p>{currentForm.description}</p>
        </div>
      )}

      <div className="form-viewer-content">
        <div className="form-preview-section">
          <h2>Form Preview</h2>
          <div className="form-preview">
            {currentForm.fields.map((field, index) => (
              <div key={index} className="form-field">
                <label htmlFor={field.name} className="field-label">
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                {renderFieldPreview(field)}
              </div>
            ))}
            {currentForm.isActive && (
              <div className="form-preview-actions">
                <Link to={`/forms/${currentForm._id}/submit`} className="btn btn-primary btn-large">
                  Fill Out This Form
                </Link>
                <p className="preview-note">
                  Click the button above to fill out and submit this form
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="form-details-section">
          <h2>Form Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Form ID:</span>
              <span className="detail-value">{currentForm._id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created by:</span>
              <span className="detail-value">
                {currentForm.createdBy?.name || 'Unknown User'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created on:</span>
              <span className="detail-value">
                {new Date(currentForm.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last updated:</span>
              <span className="detail-value">
                {new Date(currentForm.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total fields:</span>
              <span className="detail-value">{currentForm.fields.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Submissions:</span>
              <span className="detail-value">{currentForm.submissionCount}</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>Form Settings</h3>
            <div className="settings-list">
              <div className="setting-item">
                <span className="setting-label">Multiple submissions:</span>
                <span className={`setting-value ${currentForm.settings.allowMultipleSubmissions ? 'enabled' : 'disabled'}`}>
                  {currentForm.settings.allowMultipleSubmissions ? 'Allowed' : 'Not allowed'}
                </span>
              </div>
              <div className="setting-item">
                <span className="setting-label">Authentication required:</span>
                <span className={`setting-value ${currentForm.settings.requireAuthentication ? 'enabled' : 'disabled'}`}>
                  {currentForm.settings.requireAuthentication ? 'Required' : 'Not required'}
                </span>
              </div>
              {currentForm.settings.notificationEmail && (
                <div className="setting-item">
                  <span className="setting-label">Notification email:</span>
                  <span className="setting-value">{currentForm.settings.notificationEmail}</span>
                </div>
              )}
              <div className="setting-item">
                <span className="setting-label">Auto-response:</span>
                <span className={`setting-value ${currentForm.settings.autoResponse?.enabled ? 'enabled' : 'disabled'}`}>
                  {currentForm.settings.autoResponse?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {currentForm.settings.autoResponse?.enabled && (
            <div className="auto-response-section">
              <h3>Auto-response Settings</h3>
              <div className="auto-response-content">
                {currentForm.settings.autoResponse?.subject && (
                  <div className="auto-response-item">
                    <span className="auto-response-label">Subject:</span>
                    <span className="auto-response-value">{currentForm.settings.autoResponse.subject}</span>
                  </div>
                )}
                {currentForm.settings.autoResponse?.message && (
                  <div className="auto-response-item">
                    <span className="auto-response-label">Message:</span>
                    <div className="auto-response-message">{currentForm.settings.autoResponse.message}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormViewer;
