import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    region?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: { name?: string; email?: string }) => Promise<void>;
  changePassword: (passwords: { currentPassword: string; newPassword: string }) => Promise<void>;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAIL' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: null,
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
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load and validate it
  useEffect(() => {
    const validateAndRefreshToken = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          const userData = JSON.parse(user);
          
          // Try to validate the token by calling /api/auth/me
          const response = await authAPI.getMe();
          
          // If the response includes a new token, update it
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: response.data.data!, token: response.data.token },
            });
          } else {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: response.data.data!, token },
            });
          }
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_FAIL' });
        }
      } else {
        dispatch({ type: 'AUTH_FAIL' });
      }
    };

    validateAndRefreshToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Try regular login first, fallback to dev-login for testing
      let response;
      try {
        response = await authAPI.login(email, password);
      } catch (error: any) {
        // If regular login fails (404), try dev-login for testing
        if (error.response?.status === 404) {
          console.log('Regular login not available, using dev-login for testing');
          response = await authAPI.devLogin(email);
        } else {
          throw error;
        }
      }
      
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    region?: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error) {
      // If refresh fails, logout the user
      logout();
      throw error;
    }
  };

  const updateProfile = async (userData: { name?: string; email?: string }) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.data!;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      throw error.response?.data?.message || 'Profile update failed';
    }
  };

  const changePassword = async (passwords: { currentPassword: string; newPassword: string }) => {
    try {
      await authAPI.changePassword(passwords);
    } catch (error: any) {
      throw error.response?.data?.message || 'Password change failed';
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
