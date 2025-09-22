import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: { name?: string; role?: string; region?: string }) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: Session } }
  | { type: 'AUTH_FAIL' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        session: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        session: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await auth.getCurrentSession();
        if (error) {
          console.error('Error getting initial session:', error);
          dispatch({ type: 'AUTH_FAIL' });
          return;
        }

        if (session?.user) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: session.user, session },
          });
        } else {
          dispatch({ type: 'AUTH_FAIL' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'AUTH_FAIL' });
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: session.user, session },
        });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: session.user, session },
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.user, session: data.session },
        });
      } else {
        throw new Error('No user or session returned');
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.message || 'Sign in failed';
    }
  };

  const signUp = async (email: string, password: string, userData?: { name?: string; role?: string; region?: string }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data, error } = await auth.signUp(email, password, userData);
      
      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.user, session: data.session },
        });
      } else {
        // User might need to confirm email
        dispatch({ type: 'AUTH_FAIL' });
        throw new Error('Please check your email to confirm your account');
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.message || 'Sign up failed';
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data, error } = await auth.signInWithMagicLink(email);
      
      if (error) {
        throw error;
      }

      // Magic link doesn't immediately sign in, it sends an email
      dispatch({ type: 'AUTH_FAIL' });
      throw new Error('Check your email for the magic link');
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.message || 'Magic link failed';
    }
  };

  const signOut = async () => {
    try {
      const { error } = await auth.signOut();
      if (error) {
        throw error;
      }
      dispatch({ type: 'LOGOUT' });
    } catch (error: any) {
      throw error.message || 'Sign out failed';
    }
  };

  const refreshSession = async () => {
    try {
      const { session, error } = await auth.getCurrentSession();
      if (error) {
        throw error;
      }

      if (session?.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: session.user, session },
        });
      } else {
        dispatch({ type: 'AUTH_FAIL' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.message || 'Session refresh failed';
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    refreshSession,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
