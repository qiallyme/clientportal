import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForms } from '../../contexts/FormsContext';
import { useAuth } from '../../contexts/AuthContext';
import { submissionsAPI } from '../../services/api';
import './FormSubmission.css';

const FormSubmission: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentForm, loading, error, fetchFormForSubmission, clearError } = useForms();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFormForSubmission(id);
    }
    return () => clearError();
  }, [id]);

  useEffect(() => {
    // Check if user needs to be authenticated
    if (currentForm?.settings.requireAuthentication && !isAuthenticated) {
      navigate('/login', { state: { from: `/forms/${id}/submit` } });
    }
  }, [currentForm, isAuthenticated, navigate, id]);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!currentForm) return false;

    for (const field of currentForm.fields) {
      if (field.required && (!formData[field.name] || formData[field.name] === '')) {
        setSubmitError(`Field "${field.label}" is required`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentForm) return;
    
    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submissionsAPI.createSubmission({
        formId: currentForm._id,
        data: formData,
        tags: [],
      });

      setSubmitSuccess(true);
      
      // Clear form data
      setFormData({});
      
      // Redirect after success (if not allowing multiple submissions)
      if (!currentForm.settings.allowMultipleSubmissions) {
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const fieldValue = formData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            name={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
            className="form-input"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
            className="form-textarea"
            rows={4}
          />
        );
      
      case 'select':
        return (
          <select
            name={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className="form-select"
          >
            <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
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
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                />
                <span className="radio-label">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <label className="checkbox-option">
            <input
              type="checkbox"
              name={field.name}
              checked={fieldValue === true}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              required={field.required}
            />
            <span className="checkbox-label">{field.label}</span>
          </label>
        );
      
      case 'date':
        return (
          <input
            type="date"
            name={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className="form-input"
          />
        );
      
      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleInputChange(field.name, file);
            }}
            required={field.required}
            className="form-file"
          />
        );
      
      default:
        return (
          <input
            type="text"
            name={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
            className="form-input"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="form-submission">
        <div className="loading">Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-submission">
        <div className="error-message">
          {error}
        </div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="form-submission">
        <div className="no-form">
          <h2>Form not found</h2>
          <p>The requested form could not be found.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentForm.isActive) {
    return (
      <div className="form-submission">
        <div className="form-inactive">
          <h2>Form is not active</h2>
          <p>This form is currently not accepting submissions.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="form-submission">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Form Submitted Successfully!</h2>
          <p>Thank you for your submission. We will review it shortly.</p>
          {currentForm.settings.allowMultipleSubmissions ? (
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setFormData({});
              }}
              className="btn btn-primary"
            >
              Submit Another
            </button>
          ) : (
            <p className="redirect-message">You will be redirected to the home page in a few seconds...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="form-submission">
      <div className="form-submission-header">
        <h1>{currentForm.title}</h1>
        {currentForm.description && (
          <p className="form-description">{currentForm.description}</p>
        )}
      </div>

      {submitError && (
        <div className="error-message">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="submission-form">
        <div className="form-fields">
          {currentForm.fields.map((field, index) => (
            <div key={index} className="form-field">
              <label className="field-label">
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormSubmission;
