import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubmissions } from '../../contexts/SubmissionsContext';
import { Submission } from '../../types';
import './SubmissionEditor.css';

const SubmissionEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSubmission, loading, error, fetchSubmission, updateSubmission, clearError } = useSubmissions();
  // Note: useAuth and useForms are imported but not used in this component
  
  const [formData, setFormData] = useState<{
    status: string;
    priority: string;
    assignedTo: string | undefined;
    dueDate: string;
    tags: string[];
  }>({
    status: 'pending',
    priority: 'medium',
    assignedTo: undefined,
    dueDate: '',
    tags: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmission(id);
    }
    return () => clearError();
  }, [id]);

  useEffect(() => {
    if (currentSubmission) {
      setFormData({
        status: currentSubmission.status,
        priority: currentSubmission.priority,
        assignedTo: currentSubmission.assignedTo?.id,
        dueDate: currentSubmission.dueDate ? new Date(currentSubmission.dueDate).toISOString().split('T')[0] : '',
        tags: currentSubmission.tags || [],
      });
    }
  }, [currentSubmission]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...(formData.tags || [])];
    newTags[index] = value;
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), '']
    }));
  };

  const removeTag = (index: number) => {
    const newTags = [...(formData.tags || [])];
    newTags.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      const updateData: Partial<Submission> = {
        status: formData.status as any,
        priority: formData.priority as any,
        assignedTo: formData.assignedTo as any,
        tags: formData.tags?.filter(tag => tag.trim() !== ''),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      };

      await updateSubmission(id, updateData);
      navigate(`/submissions/${id}`);
    } catch (error) {
      console.error('Failed to update submission:', error);
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="submission-editor">
        <div className="loading">Loading submission...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submission-editor">
        <div className="error-message">
          {error}
        </div>
        <button onClick={() => navigate('/submissions')} className="btn btn-primary">
          Back to Submissions
        </button>
      </div>
    );
  }

  if (!currentSubmission) {
    return (
      <div className="submission-editor">
        <div className="no-submission">
          <h2>Submission not found</h2>
          <p>The requested submission could not be found.</p>
          <button onClick={() => navigate('/submissions')} className="btn btn-primary">
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-editor">
      <div className="submission-editor-header">
        <h1>Edit Submission {currentSubmission.submissionNumber}</h1>
        <div className="header-actions">
          <button
            type="button"
            onClick={() => navigate(`/submissions/${id}`)}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="submission-editor-form">
        <div className="submission-editor-content">
          <div className="form-section">
            <h2>Submission Information</h2>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="form-select"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="on-hold">On Hold</option>
              </select>
              <div className="status-preview">
                Current: <span className={`status-badge ${getStatusColor(formData.status || 'pending')}`}>
                  {(formData.status || 'pending').replace('-', ' ')}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <div className="priority-preview">
                Current: <span className={`priority-badge ${getPriorityColor(formData.priority || 'medium')}`}>
                  {formData.priority || 'medium'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assignedTo">Assigned To</label>
              <select
                id="assignedTo"
                value={formData.assignedTo || ''}
                onChange={(e) => handleInputChange('assignedTo', e.target.value || undefined)}
                className="form-select"
              >
                <option value="">Unassigned</option>
                {/* In a real app, you would fetch users from the API */}
                <option value="user1">John Doe</option>
                <option value="user2">Jane Smith</option>
                <option value="user3">Bob Johnson</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Tags</h2>
            <div className="tags-editor">
              {formData.tags?.map((tag, index) => (
                <div key={index} className="tag-input-group">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    placeholder="Enter tag"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="btn btn-sm btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTag}
                className="btn btn-outline"
              >
                Add Tag
              </button>
            </div>
          </div>

          <div className="form-section">
            <h2>Submission Data (Read Only)</h2>
            <div className="readonly-data">
              {Object.entries(currentSubmission.data).map(([key, value]) => (
                <div key={key} className="data-item">
                  <label className="data-label">{key}:</label>
                  <div className="data-value">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="submission-editor-footer">
          <button
            type="button"
            onClick={() => navigate(`/submissions/${id}`)}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmissionEditor;
