import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Form } from '../types';
import { supabaseFormsAPI } from '../services/supabaseForms';

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

  const fetchForms = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    try {
      console.log('🚀 FormsContext: fetchForms called with params:', params);
      dispatch({ type: 'FORMS_LOADING' });
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
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to fetch forms',
      });
    }
  }, []);

  const fetchForm = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const form = await supabaseFormsAPI.getForm(id);
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
      const newForm = await supabaseFormsAPI.createForm(formData);
      
      // Refresh forms list
      await fetchForms();
      
      return newForm;
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to create form',
      });
      throw error;
    }
  }, [fetchForms]);

  const updateForm = useCallback(async (id: string, formData: Partial<Form>): Promise<Form> => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
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
      
      // Refresh forms list
      await fetchForms();
      
      return formWithCount;
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to update form',
      });
      throw error;
    }
  }, [fetchForms, state.currentForm?._id]);

  const deleteForm = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      await supabaseFormsAPI.deleteForm(id);
      
      // Clear current form if it's the one being deleted
      if (state.currentForm?._id === id) {
        dispatch({ type: 'CLEAR_CURRENT_FORM' });
      }
      
      // Refresh forms list
      await fetchForms();
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.message || 'Failed to delete form',
      });
    }
  }, [fetchForms, state.currentForm?._id]);

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
