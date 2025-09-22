import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubmissions } from '../../contexts/SubmissionsContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useForms } from '../../contexts/FormsContext';
import './SubmissionViewer.css';

const SubmissionViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentSubmission, loading, error, fetchSubmission, clearError, addNote } = useSubmissions();
  const { user } = useSupabaseAuth();
  const { fetchForm } = useForms();
  
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmission(id);
    }
    return () => clearError();
  }, [id, fetchSubmission, clearError]);

  useEffect(() => {
    if (currentSubmission?.formId) {
      const formId = typeof currentSubmission.formId === 'object'
        ? currentSubmission.formId._id
        : currentSubmission.formId;
      fetchForm(formId);
    }
  }, [currentSubmission?.formId, fetchForm]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;

    setAddingNote(true);
    try {
      await addNote(id, { text: newNote.trim() });
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setAddingNote(false);
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
      <div className="submission-viewer">
        <div className="loading">Loading submission...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submission-viewer">
        <div className="error-message">
          {error}
        </div>
        <Link to="/submissions" className="btn btn-primary">
          Back to Submissions
        </Link>
      </div>
    );
  }

  if (!currentSubmission) {
    return (
      <div className="submission-viewer">
        <div className="no-submission">
          <h2>Submission not found</h2>
          <p>The requested submission could not be found.</p>
          <Link to="/submissions" className="btn btn-primary">
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-viewer">
      <div className="submission-header">
        <div className="header-content">
          <h1>Submission {currentSubmission.submissionNumber}</h1>
          <div className="submission-meta">
            <span className={`status-badge ${getStatusColor(currentSubmission.status)}`}>
              {currentSubmission.status.replace('-', ' ')}
            </span>
            <span className={`priority-badge ${getPriorityColor(currentSubmission.priority)}`}>
              {currentSubmission.priority}
            </span>
          </div>
        </div>
        <div className="header-actions">
          {user?.permissions.canEditSubmissions && (
            <Link to={`/submissions/${currentSubmission._id}/edit`} className="btn btn-outline">
              Edit Submission
            </Link>
          )}
          <Link to="/submissions" className="btn btn-outline">
            Back to Submissions
          </Link>
        </div>
      </div>

      <div className="submission-content">
        <div className="submission-details">
          <div className="details-section">
            <h2>Submission Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Submission Number:</span>
                <span className="detail-value">{currentSubmission.submissionNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Form ID:</span>
                <span className="detail-value">
                  {typeof currentSubmission.formId === 'object' 
                    ? currentSubmission.formId._id 
                    : currentSubmission.formId}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value ${getStatusColor(currentSubmission.status)}`}>
                  {currentSubmission.status.replace('-', ' ')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Priority:</span>
                <span className={`detail-value ${getPriorityColor(currentSubmission.priority)}`}>
                  {currentSubmission.priority}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Submitted By:</span>
                <span className="detail-value">
                  {currentSubmission.submittedBy ? (
                    <div className="user-info">
                      <div className="user-name">{currentSubmission.submittedBy.name}</div>
                      <div className="user-email">{currentSubmission.submittedBy.email}</div>
                    </div>
                  ) : (
                    'Anonymous'
                  )}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Assigned To:</span>
                <span className="detail-value">
                  {currentSubmission.assignedTo ? (
                    <div className="user-info">
                      <div className="user-name">{currentSubmission.assignedTo.name}</div>
                      <div className="user-email">{currentSubmission.assignedTo.email}</div>
                    </div>
                  ) : (
                    'Unassigned'
                  )}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {new Date(currentSubmission.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(currentSubmission.updatedAt).toLocaleString()}
                </span>
              </div>
              {currentSubmission.dueDate && (
                <div className="detail-item">
                  <span className="detail-label">Due Date:</span>
                  <span className="detail-value">
                    {new Date(currentSubmission.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="form-data-section">
            <h2>Form Data</h2>
            <div className="form-data-grid">
              {Object.entries(currentSubmission.data).map(([key, value]) => (
                <div key={key} className="form-data-item">
                  <span className="form-data-label">{key}:</span>
                  <span className="form-data-value">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {currentSubmission.tags && currentSubmission.tags.length > 0 && (
            <div className="tags-section">
              <h2>Tags</h2>
              <div className="tags-list">
                {currentSubmission.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentSubmission.attachments && currentSubmission.attachments.length > 0 && (
            <div className="attachments-section">
              <h2>Attachments</h2>
              <div className="attachments-list">
                {currentSubmission.attachments.map((attachment, index) => (
                  <div key={index} className="attachment-item">
                    <div className="attachment-info">
                      <span className="attachment-name">{attachment.originalName}</span>
                      <span className="attachment-size">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="submission-sidebar">
          <div className="notes-section">
            <h2>Notes</h2>
            
            <div className="notes-list">
              {currentSubmission.notes && currentSubmission.notes.length > 0 ? (
                currentSubmission.notes.map((note, index) => (
                  <div key={index} className="note-item">
                    <div className="note-content">{note.text}</div>
                    <div className="note-meta">
                      <span className="note-author">{note.addedBy.name}</span>
                      <span className="note-date">
                        {new Date(note.addedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-notes">No notes yet.</p>
              )}
            </div>

            {user?.permissions.canEditSubmissions && (
              <form onSubmit={handleAddNote} className="add-note-form">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="note-input"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="btn btn-primary"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </form>
            )}
          </div>

          <div className="metadata-section">
            <h2>Metadata</h2>
            <div className="metadata-grid">
              {currentSubmission.metadata.ipAddress && (
                <div className="metadata-item">
                  <span className="metadata-label">IP Address:</span>
                  <span className="metadata-value">{currentSubmission.metadata.ipAddress}</span>
                </div>
              )}
              {currentSubmission.metadata.region && (
                <div className="metadata-item">
                  <span className="metadata-label">Region:</span>
                  <span className="metadata-value">{currentSubmission.metadata.region}</span>
                </div>
              )}
              {currentSubmission.metadata.userAgent && (
                <div className="metadata-item">
                  <span className="metadata-label">User Agent:</span>
                  <span className="metadata-value metadata-truncate">
                    {currentSubmission.metadata.userAgent}
                  </span>
                </div>
              )}
              {currentSubmission.metadata.referrer && (
                <div className="metadata-item">
                  <span className="metadata-label">Referrer:</span>
                  <span className="metadata-value">{currentSubmission.metadata.referrer}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionViewer;
