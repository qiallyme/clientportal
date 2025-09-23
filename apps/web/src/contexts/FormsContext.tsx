import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Form } from '../types';
import { supabaseFormsAPI } from '../services/supabaseForms';
import { useSupabaseAuth } from './SupabaseAuthContext';

interface FormsState {
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface FormsContextType extends FormsState {
  fetchForms: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => Promise<void>;
  fetchForm: (id: string) => Promise<void>;
  fetchFormForSubmission: (id: string) => Promise<void>;
  createForm: (formData: Partial<Form>) => Promise<Form>;
  updateForm: (id: string, formData: Partial<Form>) => Promise<Form>;
  deleteForm: (id: string) => Promise<void>;
  clearCurrentForm: () => void;
  clearError: () => void;
}

type FormsAction =
  | { type: 'FORMS_LOADING' }
  | { type: 'FORMS_SUCCESS'; payload: { forms: Form[]; pagination: any } }
  | { type: 'FORM_SUCCESS'; payload: Form }
  | { type: 'FORMS_ERROR'; payload: string }
  | { type: 'CLEAR_CURRENT_FORM' }
  | { type: 'CLEAR_ERROR' };

const initialState: FormsState = {
  forms: [],
  currentForm: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const formsReducer = (state: FormsState, action: FormsAction): FormsState => {
  switch (action.type) {
    case 'FORMS_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FORMS_SUCCESS':
      return {
        ...state,
        loading: false,
        forms: action.payload.forms,
        pagination: action.payload.pagination,
        error: null,
      };
    case 'FORM_SUCCESS':
      return {
        ...state,
        loading: false,
        currentForm: action.payload,
        error: null,
      };
    case 'FORMS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'CLEAR_CURRENT_FORM':
      return {
        ...state,
        currentForm: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const FormsContext = createContext<FormsContextType | undefined>(undefined);

export const useForms = () => {
  const context = useContext(FormsContext);
  if (context === undefined) {
    throw new Error('useForms must be used within a FormsProvider');
  }
  return context;
};

interface FormsProviderProps {
  children: ReactNode;
}

export const FormsProvider: React.FC<FormsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(formsReducer, initialState);
  const { logAuditEvent } = useSupabaseAuth();

  const fetchForms = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    try {
      console.log('🚀 FormsContext: fetchForms called with params:', params);
      dispatch({ type: 'FORMS_LOADING' });

      // MVP: Provide mock data for demo mode
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

      if (isDemoMode) {
        console.log('🎭 Using demo mode for forms');

        // Create mock forms data with hierarchical structure
        const mockForms: Form[] = [
          {
            _id: 'demo-form-1',
            tenantId: 'tenant-1',
            departmentId: 'dept-1',
            title: 'Customer Feedback Form',
            description: 'Collect feedback from our customers about their experience',
            fields: [
              {
                name: 'name',
                label: 'Full Name',
                type: 'text',
                required: true,
                placeholder: 'Enter your full name'
              },
              {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
                placeholder: 'your.email@example.com'
              },
              {
                name: 'rating',
                label: 'Overall Rating',
                type: 'select',
                required: true,
                options: ['5 - Excellent', '4 - Very Good', '3 - Good', '2 - Fair', '1 - Poor']
              },
              {
                name: 'comments',
                label: 'Comments',
                type: 'textarea',
                required: false,
                placeholder: 'Share your thoughts and suggestions...'
              }
            ],
            isActive: true,
            isPublic: false,
            createdBy: 'demo-user-1',
            settings: {
              allowMultipleSubmissions: false,
              requireAuthentication: true,
              notificationEmail: 'admin@qially.com',
              autoResponse: {
                enabled: true,
                subject: 'Thank you for your feedback!',
                message: 'We appreciate your feedback and will review it carefully.'
              }
            },
            submissionCount: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'demo-form-2',
            tenantId: 'tenant-1',
            departmentId: 'dept-2',
            title: 'Event Registration',
            description: 'Register for our upcoming company event',
            fields: [
              {
                name: 'fullName',
                label: 'Full Name',
                type: 'text',
                required: true,
                placeholder: 'Enter your full name'
              },
              {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
                placeholder: 'your.email@company.com'
              },
              {
                name: 'phone',
                label: 'Phone Number',
                type: 'text',
                required: false,
                placeholder: '+1 (555) 123-4567'
              },
              {
                name: 'dietaryRestrictions',
                label: 'Dietary Restrictions',
                type: 'select',
                required: false,
                options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal', 'Other']
              }
            ],
            isActive: true,
            isPublic: true,
            createdBy: 'demo-user-2',
            settings: {
              allowMultipleSubmissions: true,
              requireAuthentication: false,
              notificationEmail: 'events@qially.com',
              autoResponse: {
                enabled: true,
                subject: 'Event Registration Confirmed',
                message: 'Thank you for registering! We look forward to seeing you at the event.'
              }
            },
            submissionCount: 12,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        // Filter mock data based on params
        let filteredForms = mockForms;
        if (params?.search) {
          filteredForms = mockForms.filter(form =>
            form.title.toLowerCase().includes(params.search!.toLowerCase()) ||
            (form.description?.toLowerCase() || '').includes(params.search!.toLowerCase())
          );
        }

        if (params?.isActive !== undefined) {
          filteredForms = filteredForms.filter(form => form.isActive === params.isActive);
        }

        // Apply pagination
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedForms = filteredForms.slice(startIndex, endIndex);

        dispatch({
          type: 'FORMS_SUCCESS',
          payload: {
            forms: paginatedForms.map(form => ({ ...form, submissionCount: Math.floor(Math.random() * 20) })),
            pagination: {
              page,
              limit,
              total: filteredForms.length,
              pages: Math.ceil(filteredForms.length / limit),
            },
          },
        });

        return;
      }

      // Real Supabase API call
      const response = await supabaseFormsAPI.getForms(params);
      console.log('🚀 FormsContext: got response:', response);
      const { data, total, pages, current } = response;

      // Fetch submission counts for each form
      const formsWithCounts = await Promise.all(
        data.map(async (form) => {
          const count = await supabaseFormsAPI.getFormSubmissionsCount(form._id);
          return { ...form, submissionCount: count };
        })
      );

      dispatch({
        type: 'FORMS_SUCCESS',
        payload: {
          forms: formsWithCounts,
          pagination: {
            page: current || 1,
            limit: params?.limit || 10,
            total,
            pages,
          },
        },
      });
    } catch (error: any) {
      console.warn('Forms fetch error (demo mode fallback):', error);
      // In demo mode, don't show error - just use empty data
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        dispatch({
          type: 'FORMS_SUCCESS',
          payload: {
            forms: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              pages: 0,
            },
          },
        });
      } else {
        dispatch({
          type: 'FORMS_ERROR',
          payload: error.message || 'Failed to fetch forms',
        });
      }
    }
  }, []); // Empty dependency array to make it stable

  const fetchForm = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });

      // MVP: Return mock data for demo mode
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

      if (isDemoMode) {
        // Return a mock form based on the ID with hierarchical structure
        const mockForm: Form = {
          _id: id,
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          title: 'Demo Form',
          description: 'This is a demo form for testing purposes',
          fields: [
            {
              name: 'name',
              label: 'Full Name',
              type: 'text',
              required: true,
              placeholder: 'Enter your name'
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              placeholder: 'your.email@example.com'
            }
          ],
          isActive: true,
          isPublic: false,
          createdBy: 'demo-user',
          settings: {
            allowMultipleSubmissions: false,
            requireAuthentication: true,
            notificationEmail: 'admin@demo.com',
            autoResponse: {
              enabled: true,
              subject: 'Thank you!',
              message: 'Thanks for your submission.'
            }
          },
          submissionCount: Math.floor(Math.random() * 10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        dispatch({
          type: 'FORM_SUCCESS',
          payload: mockForm,
        });
        return;
      }

      // Real Supabase API call
      const form = await supabaseFormsAPI.getForm(id);
      const count = await supabaseFormsAPI.getFormSubmissionsCount(id);
      const formWithCount = { ...form, submissionCount: count };

      dispatch({
        type: 'FORM_SUCCESS',
        payload: formWithCount,
      });
    } catch (error: any) {
      console.warn('Form fetch error (demo mode fallback):', error);
      // In demo mode, create a mock form
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        const mockForm: Form = {
          _id: id,
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          title: 'Demo Form',
          description: 'Demo form created due to API error',
          fields: [],
          isActive: true,
          isPublic: false,
          createdBy: 'demo-user',
          settings: {
            allowMultipleSubmissions: false,
            requireAuthentication: true,
            notificationEmail: '',
            autoResponse: {
              enabled: false,
              subject: '',
              message: ''
            }
          },
          submissionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        dispatch({
          type: 'FORM_SUCCESS',
          payload: mockForm,
        });
      } else {
        dispatch({
          type: 'FORMS_ERROR',
          payload: error.message || 'Failed to fetch form',
        });
      }
    }
  }, []);

  const fetchFormForSubmission = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const form = await supabaseFormsAPI.getFormForSubmission(id);
      const count = await supabaseFormsAPI.getFormSubmissionsCount(id);
      const formWithCount = { ...form, submissionCount: count };
      
      dispatch({
        type: 'FORM_SUCCESS',
        payload: formWithCount,
      });
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to fetch form',
      });
    }
  }, []);

  const createForm = useCallback(async (formData: Partial<Form>): Promise<Form> => {
    try {
      dispatch({ type: 'FORMS_LOADING' });

      // MVP: Create mock form in demo mode
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

      if (isDemoMode) {
        const newForm: Form = {
          _id: 'demo-form-' + Date.now(),
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          title: formData.title || 'New Demo Form',
          description: formData.description || '',
          fields: formData.fields || [],
          isActive: formData.isActive ?? true,
          isPublic: formData.isPublic ?? false,
          createdBy: 'demo-user',
          settings: {
            allowMultipleSubmissions: false,
            requireAuthentication: true,
            notificationEmail: '',
            autoResponse: {
              enabled: false,
              subject: '',
              message: ''
            },
            ...formData.settings
          },
          submissionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Refresh forms list with current pagination
        await fetchForms({
          page: state.pagination.page,
          limit: state.pagination.limit,
        });

        // Log audit event
        logAuditEvent('CREATE', 'FORM', { resourceId: newForm._id, title: newForm.title });

        return newForm;
      }

      // Real Supabase API call
      const newForm = await supabaseFormsAPI.createForm(formData);

      // Refresh forms list with current pagination
      await fetchForms({
        page: state.pagination.page,
        limit: state.pagination.limit,
      });

      return newForm;
    } catch (error: any) {
      console.warn('Form creation error (demo mode fallback):', error);
      // In demo mode, create a mock form anyway
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        const mockForm: Form = {
          _id: 'demo-form-' + Date.now(),
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          title: formData.title || 'Demo Form',
          description: formData.description || 'Created in demo mode',
          fields: formData.fields || [],
          isActive: true,
          isPublic: false,
          createdBy: 'demo-user',
          settings: {
            allowMultipleSubmissions: false,
            requireAuthentication: true,
            notificationEmail: '',
            autoResponse: {
              enabled: false,
              subject: '',
              message: ''
            }
          },
          submissionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await fetchForms({
          page: 1,
          limit: state.pagination.limit,
        });

        return mockForm;
      }

      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to create form',
      });
      throw error;
    }
  }, [fetchForms, state.pagination.page, state.pagination.limit]);

  const updateForm = useCallback(async (id: string, formData: Partial<Form>): Promise<Form> => {
    try {
      dispatch({ type: 'FORMS_LOADING' });

      // MVP: Update mock form in demo mode
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

      if (isDemoMode) {
        const updatedForm: Form = {
          _id: id,
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          title: formData.title || 'Updated Demo Form',
          description: formData.description || '',
          fields: formData.fields || [],
          isActive: formData.isActive ?? true,
          isPublic: formData.isPublic ?? false,
          createdBy: 'demo-user',
          settings: {
            allowMultipleSubmissions: false,
            requireAuthentication: true,
            notificationEmail: '',
            autoResponse: {
              enabled: false,
              subject: '',
              message: ''
            },
            ...formData.settings
          },
          submissionCount: Math.floor(Math.random() * 20),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Update current form if it's the one being updated
        if (state.currentForm?._id === id) {
          dispatch({
            type: 'FORM_SUCCESS',
            payload: updatedForm,
          });
        }

        // Refresh forms list with current pagination
        await fetchForms({
          page: state.pagination.page,
          limit: state.pagination.limit,
        });

        return updatedForm;
      }

      // Real Supabase API call
      const updatedForm = await supabaseFormsAPI.updateForm(id, formData);
      const count = await supabaseFormsAPI.getFormSubmissionsCount(id);
      const formWithCount = { ...updatedForm, submissionCount: count };

      // Update current form if it's the one being updated
      if (state.currentForm?._id === id) {
        dispatch({
          type: 'FORM_SUCCESS',
          payload: formWithCount,
        });
      }

      // Refresh forms list with current pagination
      await fetchForms({
        page: state.pagination.page,
        limit: state.pagination.limit,
      });

      // Log audit event
      logAuditEvent('UPDATE', 'FORM', { resourceId: id, title: updatedForm.title });

      return formWithCount;
    } catch (error: any) {
      console.warn('Form update error (demo mode fallback):', error);
      // In demo mode, create a mock updated form
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        const mockForm: Form = {
          _id: id,
          tenantId: 'tenant-1',
          departmentId: 'dept-1',
          title: formData.title || 'Updated Demo Form',
          description: formData.description || 'Updated in demo mode',
          fields: formData.fields || [],
          isActive: formData.isActive ?? true,
          isPublic: formData.isPublic ?? false,
          createdBy: 'demo-user',
          settings: {
            allowMultipleSubmissions: false,
            requireAuthentication: true,
            notificationEmail: '',
            autoResponse: {
              enabled: false,
              subject: '',
              message: ''
            }
          },
          submissionCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (state.currentForm?._id === id) {
          dispatch({
            type: 'FORM_SUCCESS',
            payload: mockForm,
          });
        }

        await fetchForms({
          page: 1,
          limit: state.pagination.limit,
        });

        return mockForm;
      }

      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to update form',
      });
      throw error;
    }
  }, [fetchForms, state.currentForm?._id, state.pagination.page, state.pagination.limit]);

  const deleteForm = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });

      // MVP: Mock delete in demo mode
      const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

      if (isDemoMode) {
        console.log('🎭 Demo mode: Deleting form', id);

        // Clear current form if it's the one being deleted
        if (state.currentForm?._id === id) {
          dispatch({ type: 'CLEAR_CURRENT_FORM' });
        }

        // Refresh forms list with current pagination
        await fetchForms({
          page: state.pagination.page,
          limit: state.pagination.limit,
        });

        // Log audit event
        logAuditEvent('DELETE', 'FORM', { resourceId: id, title: state.currentForm?.title });

        return;
      }

      // Real Supabase API call
      await supabaseFormsAPI.deleteForm(id);

      // Clear current form if it's the one being deleted
      if (state.currentForm?._id === id) {
        dispatch({ type: 'CLEAR_CURRENT_FORM' });
      }

      // Refresh forms list with current pagination
      await fetchForms({
        page: state.pagination.page,
        limit: state.pagination.limit,
      });

      // Log audit event
      logAuditEvent('DELETE', 'FORM', { resourceId: id, title: state.currentForm?.title });
    } catch (error: any) {
      console.warn('Form deletion error (demo mode fallback):', error);
      // In demo mode, just clear the form and refresh
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        if (state.currentForm?._id === id) {
          dispatch({ type: 'CLEAR_CURRENT_FORM' });
        }

        await fetchForms({
          page: 1,
          limit: state.pagination.limit,
        });
      } else {
        dispatch({
          type: 'FORMS_ERROR',
          payload: error.message || 'Failed to delete form',
        });
      }
    }
  }, [fetchForms, state.currentForm?._id, state.pagination.page, state.pagination.limit]);

  const clearCurrentForm = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_FORM' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: FormsContextType = {
    ...state,
    fetchForms,
    fetchForm,
    fetchFormForSubmission,
    createForm,
    updateForm,
    deleteForm,
    clearCurrentForm,
    clearError,
  };

  return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
};
