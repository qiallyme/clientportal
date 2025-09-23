import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForms } from '../../contexts/FormsContext';
import { FormField } from '../../types';
import './FormBuilder.css';

const FormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentForm, loading, error, createForm, updateForm, fetchForm, clearError } = useForms();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
    isPublic: false,
    settings: {
      allowMultipleSubmissions: false,
      requireAuthentication: true,
      notificationEmail: '',
      autoResponse: {
        enabled: false,
        subject: '',
        message: '',
      },
    },
  });

  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchForm(id);
    }
    return () => clearError();
  }, [isEditing, id, fetchForm, clearError]);

  useEffect(() => {
    if (isEditing && currentForm) {
      setFormData({
        title: currentForm.title,
        description: currentForm.description || '',
        isActive: currentForm.isActive,
        isPublic: currentForm.isPublic,
        settings: {
          allowMultipleSubmissions: currentForm.settings.allowMultipleSubmissions ?? false,
          requireAuthentication: currentForm.settings.requireAuthentication ?? true,
          notificationEmail: currentForm.settings.notificationEmail || '',
          autoResponse: {
            enabled: currentForm.settings.autoResponse?.enabled ?? false,
            subject: currentForm.settings.autoResponse?.subject || '',
            message: currentForm.settings.autoResponse?.message || '',
          },
        },
      });
      setFields(currentForm.fields);
    }
  }, [currentForm, isEditing]);

  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updatedField: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updatedField };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formPayload = {
        ...formData,
        fields,
      };

      if (isEditing && id) {
        await updateForm(id, formPayload);
      } else {
        await createForm(formPayload);
      }

      navigate('/forms');
    } catch (error) {
      console.error('Failed to save form:', error);
    } finally {
      setSaving(false);
    }
  };

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Button' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File Upload' },
  ];

  if (loading && isEditing) {
    return (
      <div className="form-builder">
        <div className="loading">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="form-builder">
      <div className="form-builder-header">
        <h1>{isEditing ? 'Edit Form' : 'Create New Form'}</h1>
        <button
          type="button"
          onClick={() => navigate('/forms')}
          className="btn btn-outline"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-builder-form">
        <div className="form-builder-content">
          {/* Form Settings */}
          <div className="form-section">
            <h2>Form Settings</h2>
            <div className="form-group">
              <label htmlFor="title">Form Title *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="form-input"
                placeholder="Enter form title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
                placeholder="Enter form description"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="checkmark"></span>
                Active (form is available for submissions)
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <span className="checkmark"></span>
                Public (accessible without login)
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-section">
            <div className="section-header">
              <h2>Form Fields</h2>
              <button
                type="button"
                onClick={addField}
                className="btn btn-primary"
              >
                Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="no-fields">
                <p>No fields added yet. Click "Add Field" to get started.</p>
              </div>
            ) : (
              <div className="fields-list">
                {fields.map((field, index) => (
                  <div key={index} className="field-item">
                    <div className="field-header">
                      <h4>Field {index + 1}</h4>
                      <div className="field-actions">
                        <button
                          type="button"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="btn btn-sm btn-outline"
                          title="Move field up"
                          aria-label={`Move field ${index + 1} up`}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="btn btn-sm btn-outline"
                          title="Move field down"
                          aria-label={`Move field ${index + 1} down`}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="btn btn-sm btn-danger"
                          title="Remove field"
                          aria-label={`Remove field ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="field-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Field Label *</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            required
                            className="form-input"
                            placeholder="Enter field label"
                          />
                        </div>

                        <div className="form-group">
                          <label>Field Type *</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as any })}
                            className="form-select"
                            aria-label="Field type"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Field Name</label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            className="form-input"
                            placeholder="Auto-generated if empty"
                          />
                        </div>

                        <div className="form-group">
                          <label>Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                            className="form-input"
                            placeholder="Enter placeholder text"
                          />
                        </div>
                      </div>

                      {(field.type === 'select' || field.type === 'radio') && (
                        <div className="form-group">
                          <label>Options (one per line)</label>
                          <textarea
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => updateField(index, { 
                              options: e.target.value.split('\n').filter(opt => opt.trim()) 
                            })}
                            className="form-textarea"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                          />
                          <span className="checkmark"></span>
                          Required field
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="form-section">
            <h2>Advanced Settings</h2>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.settings.allowMultipleSubmissions}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowMultipleSubmissions: e.target.checked }
                  })}
                />
                <span className="checkmark"></span>
                Allow multiple submissions from same user
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.settings.requireAuthentication}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, requireAuthentication: e.target.checked }
                  })}
                />
                <span className="checkmark"></span>
                Require user authentication
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="notificationEmail">Notification Email</label>
              <input
                type="email"
                id="notificationEmail"
                value={formData.settings.notificationEmail || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, notificationEmail: e.target.value }
                })}
                className="form-input"
                placeholder="Email to notify on new submissions"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.settings.autoResponse.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      autoResponse: { ...formData.settings.autoResponse, enabled: e.target.checked }
                    }
                  })}
                />
                <span className="checkmark"></span>
                Send auto-response to submitters
              </label>
            </div>

            {formData.settings.autoResponse.enabled && (
              <>
                <div className="form-group">
                  <label htmlFor="autoResponseSubject">Auto-response Subject</label>
                  <input
                    type="text"
                    id="autoResponseSubject"
                    value={formData.settings.autoResponse.subject || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        autoResponse: { ...formData.settings.autoResponse, subject: e.target.value }
                      }
                    })}
                    className="form-input"
                    placeholder="Thank you for your submission"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="autoResponseMessage">Auto-response Message</label>
                  <textarea
                    id="autoResponseMessage"
                    value={formData.settings.autoResponse.message || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        autoResponse: { ...formData.settings.autoResponse, message: e.target.value }
                      }
                    })}
                    className="form-textarea"
                    placeholder="Thank you for your submission. We will review it shortly."
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-builder-footer">
          <button
            type="button"
            onClick={() => navigate('/forms')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || fields.length === 0}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Form' : 'Create Form')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormBuilder;
