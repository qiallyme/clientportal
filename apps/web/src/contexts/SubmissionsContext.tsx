import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Submission } from '../types';
import { submissionsAPI } from '../services/api';

interface SubmissionsState {
  submissions: Submission[];
  currentSubmission: Submission | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
    onHold: number;
  } | null;
}

interface SubmissionsContextType extends SubmissionsState {
  fetchSubmissions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    formId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  fetchSubmission: (id: string) => Promise<void>;
  updateSubmission: (id: string, submissionData: Partial<Submission>) => Promise<Submission>;
  deleteSubmission: (id: string) => Promise<void>;
  addNote: (id: string, note: { text: string }) => Promise<Submission>;
  fetchStats: (period?: string) => Promise<void>;
  clearCurrentSubmission: () => void;
  clearError: () => void;
}

type SubmissionsAction =
  | { type: 'SUBMISSIONS_LOADING' }
  | { type: 'SUBMISSIONS_SUCCESS'; payload: { submissions: Submission[]; pagination: any } }
  | { type: 'SUBMISSION_SUCCESS'; payload: Submission }
  | { type: 'SUBMISSIONS_ERROR'; payload: string }
  | { type: 'STATS_SUCCESS'; payload: any }
  | { type: 'CLEAR_CURRENT_SUBMISSION' }
  | { type: 'CLEAR_ERROR' };

const initialState: SubmissionsState = {
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  stats: null,
};

const submissionsReducer = (state: SubmissionsState, action: SubmissionsAction): SubmissionsState => {
  switch (action.type) {
    case 'SUBMISSIONS_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'SUBMISSIONS_SUCCESS':
      return {
        ...state,
        loading: false,
        submissions: action.payload.submissions,
        pagination: action.payload.pagination,
        error: null,
      };
    case 'SUBMISSION_SUCCESS':
      return {
        ...state,
        loading: false,
        currentSubmission: action.payload,
        error: null,
      };
    case 'SUBMISSIONS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'STATS_SUCCESS':
      return {
        ...state,
        stats: action.payload,
      };
    case 'CLEAR_CURRENT_SUBMISSION':
      return {
        ...state,
        currentSubmission: null,
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

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export const useSubmissions = () => {
  const context = useContext(SubmissionsContext);
  if (context === undefined) {
    throw new Error('useSubmissions must be used within a SubmissionsProvider');
  }
  return context;
};

interface SubmissionsProviderProps {
  children: ReactNode;
}

export const SubmissionsProvider: React.FC<SubmissionsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(submissionsReducer, initialState);

  const fetchSubmissions = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    formId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    try {
      dispatch({ type: 'SUBMISSIONS_LOADING' });
      const response = await submissionsAPI.getSubmissions(params);
      const { data, total, pages, current } = response.data;
      
      dispatch({
        type: 'SUBMISSIONS_SUCCESS',
        payload: {
          submissions: data,
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
        type: 'SUBMISSIONS_ERROR',
        payload: error.response?.data?.message || 'Failed to fetch submissions',
      });
    }
  };

  const fetchSubmission = async (id: string) => {
    try {
      dispatch({ type: 'SUBMISSIONS_LOADING' });
      const response = await submissionsAPI.getSubmission(id);
      dispatch({
        type: 'SUBMISSION_SUCCESS',
        payload: response.data.data!,
      });
    } catch (error: any) {
      dispatch({
        type: 'SUBMISSIONS_ERROR',
        payload: error.response?.data?.message || 'Failed to fetch submission',
      });
    }
  };

  const updateSubmission = async (id: string, submissionData: Partial<Submission>): Promise<Submission> => {
    try {
      dispatch({ type: 'SUBMISSIONS_LOADING' });
      const response = await submissionsAPI.updateSubmission(id, submissionData);
      const updatedSubmission = response.data.data!;
      
      // Update current submission if it's the one being updated
      if (state.currentSubmission?._id === id) {
        dispatch({
          type: 'SUBMISSION_SUCCESS',
          payload: updatedSubmission,
        });
      }
      
      // Refresh submissions list
      await fetchSubmissions();
      
      return updatedSubmission;
    } catch (error: any) {
      dispatch({
        type: 'SUBMISSIONS_ERROR',
        payload: error.response?.data?.message || 'Failed to update submission',
      });
      throw error;
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      dispatch({ type: 'SUBMISSIONS_LOADING' });
      await submissionsAPI.deleteSubmission(id);
      
      // Clear current submission if it's the one being deleted
      if (state.currentSubmission?._id === id) {
        dispatch({ type: 'CLEAR_CURRENT_SUBMISSION' });
      }
      
      // Refresh submissions list
      await fetchSubmissions();
    } catch (error: any) {
      dispatch({
        type: 'SUBMISSIONS_ERROR',
        payload: error.response?.data?.message || 'Failed to delete submission',
      });
    }
  };

  const addNote = async (id: string, note: { text: string }): Promise<Submission> => {
    try {
      dispatch({ type: 'SUBMISSIONS_LOADING' });
      const response = await submissionsAPI.addNote(id, note);
      const updatedSubmission = response.data.data!;
      
      // Update current submission if it's the one being updated
      if (state.currentSubmission?._id === id) {
        dispatch({
          type: 'SUBMISSION_SUCCESS',
          payload: updatedSubmission,
        });
      }
      
      return updatedSubmission;
    } catch (error: any) {
      dispatch({
        type: 'SUBMISSIONS_ERROR',
        payload: error.response?.data?.message || 'Failed to add note',
      });
      throw error;
    }
  };

  const fetchStats = async (period?: string) => {
    try {
      const response = await submissionsAPI.getStats(period);
      dispatch({
        type: 'STATS_SUCCESS',
        payload: response.data.data,
      });
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const clearCurrentSubmission = () => {
    dispatch({ type: 'CLEAR_CURRENT_SUBMISSION' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: SubmissionsContextType = {
    ...state,
    fetchSubmissions,
    fetchSubmission,
    updateSubmission,
    deleteSubmission,
    addNote,
    fetchStats,
    clearCurrentSubmission,
    clearError,
  };

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
};
