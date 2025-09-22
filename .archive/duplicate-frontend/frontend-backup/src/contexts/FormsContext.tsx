import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Form } from '../types';
import { formsAPI } from '../services/api';

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

  const fetchForms = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const response = await formsAPI.getForms(params);
      const { data, total, pages, current } = response.data;
      
      dispatch({
        type: 'FORMS_SUCCESS',
        payload: {
          forms: data,
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
        payload: error.response?.data?.message || 'Failed to fetch forms',
      });
    }
  };

  const fetchForm = async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const response = await formsAPI.getForm(id);
      dispatch({
        type: 'FORM_SUCCESS',
        payload: response.data.data!,
      });
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.response?.data?.message || 'Failed to fetch form',
      });
    }
  };

  const fetchFormForSubmission = async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const response = await formsAPI.getFormForSubmission(id);
      dispatch({
        type: 'FORM_SUCCESS',
        payload: response.data.data!,
      });
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.response?.data?.message || 'Failed to fetch form',
      });
    }
  };

  const createForm = async (formData: Partial<Form>): Promise<Form> => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const response = await formsAPI.createForm(formData);
      const newForm = response.data.data!;
      
      // Refresh forms list
      await fetchForms();
      
      return newForm;
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.response?.data?.message || 'Failed to create form',
      });
      throw error;
    }
  };

  const updateForm = async (id: string, formData: Partial<Form>): Promise<Form> => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      const response = await formsAPI.updateForm(id, formData);
      const updatedForm = response.data.data!;
      
      // Update current form if it's the one being updated
      if (state.currentForm?._id === id) {
        dispatch({
          type: 'FORM_SUCCESS',
          payload: updatedForm,
        });
      }
      
      // Refresh forms list
      await fetchForms();
      
      return updatedForm;
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.response?.data?.message || 'Failed to update form',
      });
      throw error;
    }
  };

  const deleteForm = async (id: string) => {
    try {
      dispatch({ type: 'FORMS_LOADING' });
      await formsAPI.deleteForm(id);
      
      // Clear current form if it's the one being deleted
      if (state.currentForm?._id === id) {
        dispatch({ type: 'CLEAR_CURRENT_FORM' });
      }
      
      // Refresh forms list
      await fetchForms();
    } catch (error: any) {
      dispatch({
        type: 'FORMS_ERROR',
        payload: error.response?.data?.message || 'Failed to delete form',
      });
    }
  };

  const clearCurrentForm = () => {
    dispatch({ type: 'CLEAR_CURRENT_FORM' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

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
