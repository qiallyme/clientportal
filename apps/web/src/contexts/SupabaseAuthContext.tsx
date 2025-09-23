import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, Tenant, Department, Permission } from '../types';
import { auth } from '../lib/supabase';

// Notification types for the enterprise portal
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

// Audit log types for enterprise compliance
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  tenantId?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NotificationAction =
  | { type: 'NOTIFICATIONS_LOADING' }
  | { type: 'NOTIFICATIONS_SUCCESS'; payload: Notification[] }
  | { type: 'NOTIFICATIONS_ERROR'; payload: string }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification };

const notificationInitialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};


interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  notifications: NotificationState;
  tenant: Tenant | null;
  departments: Department[];
  userPermissions: Permission[];
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ data: { user: User; session: Session } | null; error: any } | void>;
  signUp: (email: string, password: string, userData?: { name?: string; role?: string; region?: string }) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  // Notification methods
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  // Global search
  globalSearch: (query: string) => Promise<any[]>;
  // RBAC and audit
  logAuditEvent: (action: string, resource: string, details?: any) => void;
  checkPermission: (permission: string) => boolean;
  // Tenant and department management
  switchTenant: (tenantId: string) => Promise<void>;
  switchDepartment: (departmentId: string) => Promise<void>;
  fetchUserTenants: () => Promise<Tenant[]>;
  fetchTenantDepartments: (tenantId: string) => Promise<Department[]>;
  // Hierarchical navigation
  getNavigationTree: () => any[];
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: Session } }
  | { type: 'AUTH_FAIL' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: NotificationState }
  | { type: 'SET_TENANT'; payload: Tenant }
  | { type: 'SET_DEPARTMENTS'; payload: Department[] }
  | { type: 'SET_PERMISSIONS'; payload: Permission[] }
  | { type: 'SWITCH_TENANT'; payload: { tenant: Tenant; departments: Department[] } };

// Convert Supabase User to our User interface
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Unknown',
    email: supabaseUser.email || '',
    role: (supabaseUser.user_metadata?.role as 'super_admin' | 'tenant_admin' | 'department_admin' | 'user' | 'viewer' | 'contributor') || 'user',
    tenantId: supabaseUser.user_metadata?.tenant_id || 'default',
    departmentId: supabaseUser.user_metadata?.department_id,
    permissions: {
      canCreateForms: ['super_admin', 'tenant_admin', 'department_admin'].includes(supabaseUser.user_metadata?.role || ''),
      canManageUsers: ['super_admin', 'tenant_admin'].includes(supabaseUser.user_metadata?.role || ''),
      canViewAllSubmissions: ['super_admin', 'tenant_admin'].includes(supabaseUser.user_metadata?.role || ''),
      canEditSubmissions: ['super_admin', 'tenant_admin', 'department_admin'].includes(supabaseUser.user_metadata?.role || ''),
      canManageDepartments: ['super_admin', 'tenant_admin'].includes(supabaseUser.user_metadata?.role || ''),
      canViewAuditLogs: ['super_admin', 'tenant_admin'].includes(supabaseUser.user_metadata?.role || ''),
      canManageTenants: supabaseUser.user_metadata?.role === 'super_admin',
    },
    isActive: true,
    lastLogin: supabaseUser.last_sign_in_at || undefined,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  };
};

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  notifications: notificationInitialState,
  tenant: null,
  departments: [],
  userPermissions: [],
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
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };
    case 'SET_TENANT':
      return {
        ...state,
        tenant: action.payload,
      };
    case 'SET_DEPARTMENTS':
      return {
        ...state,
        departments: action.payload,
      };
    case 'SET_PERMISSIONS':
      return {
        ...state,
        userPermissions: action.payload,
      };
    case 'SWITCH_TENANT':
      return {
        ...state,
        tenant: action.payload.tenant,
        departments: action.payload.departments,
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
          console.warn('Supabase session error (using demo mode):', error);
          // In demo mode, allow app to work without authentication
          dispatch({ type: 'AUTH_FAIL' });
          return;
        }

        if (session?.user) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: convertSupabaseUser(session.user), session },
          });
        } else {
          // In demo mode, allow app to work without authentication
          console.log('No session found - running in demo mode');
          dispatch({ type: 'AUTH_FAIL' });
        }
      } catch (error) {
        console.warn('Auth initialization error (demo mode):', error);
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
          payload: { user: convertSupabaseUser(session.user), session },
        });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: convertSupabaseUser(session.user), session },
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

      // MVP: Allow any login for demo purposes
      if (email && password && password.length >= 1) {
        // Create a mock user that matches the User interface with hierarchical structure
        const mockUser = {
          id: 'demo-user-' + Date.now(),
          name: email.split('@')[0], // Required by User interface
          email: email,
          role: 'super_admin' as const, // Updated to use hierarchical roles
          tenantId: 'tenant-1', // Required for hierarchical access
          departmentId: 'dept-1', // Optional department
          permissions: {
            canCreateForms: true,
            canManageUsers: true,
            canViewAllSubmissions: true,
            canEditSubmissions: true,
            canManageDepartments: true,
            canViewAuditLogs: true,
            canManageTenants: true,
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockSession = {
          access_token: 'demo-token-' + Date.now(),
          refresh_token: 'demo-refresh-' + Date.now(),
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser as unknown as SupabaseUser
        } as Session;

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: mockUser, session: mockSession },
        });

        return { data: { user: mockUser, session: mockSession }, error: null };
      }

      // Fallback to real Supabase auth
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: convertSupabaseUser(data.user), session: data.session },
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
          payload: { user: convertSupabaseUser(data.user), session: data.session },
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
      const { error } = await auth.signInWithMagicLink(email);
      
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
          payload: { user: convertSupabaseUser(session.user), session },
        });
      } else {
        dispatch({ type: 'AUTH_FAIL' });
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAIL' });
      throw error.message || 'Session refresh failed';
    }
  };

  // Notification methods
  const fetchNotifications = async () => {
    try {
      // In demo mode, return mock notifications
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        const mockNotifications: Notification[] = [
          {
            id: '1',
            userId: state.user?.id || 'demo',
            type: 'info',
            title: 'Welcome to QiAlly Portal!',
            message: 'Your account has been set up successfully. Start by creating your first form.',
            read: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/forms/new',
            actionText: 'Create Form'
          },
          {
            id: '2',
            userId: state.user?.id || 'demo',
            type: 'success',
            title: 'Form Created Successfully',
            message: 'Your "Customer Feedback" form is now live and collecting submissions.',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ];

        const notificationState: NotificationState = {
          notifications: mockNotifications,
          unreadCount: mockNotifications.filter(n => !n.read).length,
          loading: false
        };

        dispatch({
          type: 'UPDATE_NOTIFICATIONS',
          payload: notificationState
        });
        return;
      }

      // Real implementation would fetch from API
      console.log('Fetching notifications for user:', state.user?.id);
    } catch (error: any) {
      console.warn('Failed to fetch notifications:', error);
    }
  };

  const markNotificationRead = (id: string) => {
    const currentNotifications = state.notifications?.notifications || [];
    const updatedNotifications = currentNotifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );

    const notificationState: NotificationState = {
      notifications: updatedNotifications,
      unreadCount: Math.max(0, (state.notifications?.unreadCount || 0) - 1),
      loading: false
    };

    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      payload: notificationState
    });
  };

  const markAllNotificationsRead = () => {
    const currentNotifications = state.notifications?.notifications || [];
    const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));

    const notificationState: NotificationState = {
      notifications: updatedNotifications,
      unreadCount: 0,
      loading: false
    };

    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      payload: notificationState
    });
  };

  const deleteNotification = (id: string) => {
    const currentNotifications = state.notifications?.notifications || [];
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);

    const notificationState: NotificationState = {
      notifications: filteredNotifications,
      unreadCount: currentNotifications.filter(n => !n.read && n.id !== id).length,
      loading: false
    };

    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      payload: notificationState
    });
  };

  // Global search
  const globalSearch = async (query: string) => {
    if (!query.trim()) return [];

    const isDemoMode = process.env.REACT_APP_DEMO_MODE === 'true';

    if (isDemoMode) {
      // Mock search results
      const mockResults = [
        {
          type: 'form',
          id: 'demo-form-1',
          title: 'Customer Feedback Form',
          description: 'Collect feedback from customers',
          url: '/forms/demo-form-1'
        },
        {
          type: 'form',
          id: 'demo-form-2',
          title: 'Event Registration',
          description: 'Register for company events',
          url: '/forms/demo-form-2'
        },
        {
          type: 'user',
          id: 'demo-user-1',
          title: 'Admin User',
          description: 'admin@demo.com',
          url: '/users/demo-user-1'
        }
      ].filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );

      return mockResults;
    }

    // Real implementation would search across forms, users, submissions, etc.
    console.log('Global search for:', query);
    return [];
  };

  // RBAC and audit logging
  const logAuditEvent = (action: string, resource: string, details?: any) => {
    const auditEvent: AuditLog = {
      id: 'audit-' + Date.now(),
      userId: state.user?.id || 'anonymous',
      userEmail: state.user?.email || 'anonymous@demo.com',
      action,
      resource,
      resourceId: details?.resourceId,
      details,
      timestamp: new Date().toISOString(),
      tenantId: state.user?.id || 'demo-tenant'
    };

    // In production, this would be sent to audit log storage
    console.log('🔒 AUDIT LOG:', auditEvent);

    // In demo mode, also create a notification for important actions
    if (process.env.REACT_APP_DEMO_MODE === 'true') {
      const notification: Notification = {
        id: 'audit-notif-' + Date.now(),
        userId: state.user?.id || 'demo',
        type: 'info',
        title: 'Activity Logged',
        message: `${action} on ${resource}`,
        read: false,
        createdAt: new Date().toISOString()
      };

      // Add to notifications
      const currentNotifications = state.notifications?.notifications || [];
      const notificationState: NotificationState = {
        notifications: [notification, ...currentNotifications],
        unreadCount: (state.notifications?.unreadCount || 0) + 1,
        loading: false
      };

      dispatch({
        type: 'UPDATE_NOTIFICATIONS',
        payload: notificationState
      });
    }
  };

  const checkPermission = (permission: string): boolean => {
    const user = state.user;
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'super_admin') return true;

    // Permission-based check
    switch (permission) {
      case 'create:forms':
        return user.permissions.canCreateForms;
      case 'manage:users':
        return user.permissions.canManageUsers;
      case 'view:submissions':
        return user.permissions.canViewAllSubmissions;
      case 'edit:submissions':
        return user.permissions.canEditSubmissions;
      case 'manage:departments':
        return user.permissions.canManageDepartments;
      case 'view:audit_logs':
        return user.permissions.canViewAuditLogs;
      case 'manage:tenants':
        return user.permissions.canManageTenants;
      default:
        return false;
    }
  };

  // Tenant and department management
  const switchTenant = async (tenantId: string) => {
    try {
      // In demo mode, create mock tenant data
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        const mockTenant: Tenant = {
          id: tenantId,
          name: `Demo Company ${tenantId}`,
          slug: `demo-${tenantId}`,
          settings: {
            allowPublicForms: false,
            requireAuthentication: true,
            branding: {
              primaryColor: '#2563eb',
              secondaryColor: '#1d4ed8'
            },
            features: {
              forms: true,
              chat: true,
              knowledgeBase: true,
              tasks: true,
              documents: true,
              projects: true
            },
            limits: {
              maxUsers: 100,
              maxForms: 50,
              maxStorageGB: 10
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockDepartments: Department[] = [
          {
            id: 'dept-1',
            tenantId: tenantId,
            name: 'Marketing',
            slug: 'marketing',
            settings: {
              allowExternalUsers: false,
              requireApproval: true,
              notificationSettings: {
                emailNotifications: true,
                slackNotifications: false
              }
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'dept-2',
            tenantId: tenantId,
            name: 'Sales',
            slug: 'sales',
            settings: {
              allowExternalUsers: true,
              requireApproval: false,
              notificationSettings: {
                emailNotifications: true,
                slackNotifications: true
              }
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        dispatch({
          type: 'SWITCH_TENANT',
          payload: { tenant: mockTenant, departments: mockDepartments }
        });

        return;
      }

      // Real implementation would fetch from API
      console.log('Switching to tenant:', tenantId);
    } catch (error: any) {
      console.warn('Failed to switch tenant:', error);
    }
  };

  const switchDepartment = async (departmentId: string) => {
    try {
      // Update user's department context
      console.log('Switching to department:', departmentId);

      // In demo mode, just log the action
      if (process.env.REACT_APP_DEMO_MODE === 'true') {
        logAuditEvent('SWITCH_DEPARTMENT', 'DEPARTMENT', { departmentId });
      }
    } catch (error: any) {
      console.warn('Failed to switch department:', error);
    }
  };

  const fetchUserTenants = async (): Promise<Tenant[]> => {
    // In demo mode, return mock tenants
    if (process.env.REACT_APP_DEMO_MODE === 'true') {
      return [
        {
          id: 'tenant-1',
          name: 'Demo Corporation',
          slug: 'demo-corp',
          settings: {
            allowPublicForms: false,
            requireAuthentication: true,
            branding: {
              primaryColor: '#2563eb',
              secondaryColor: '#1d4ed8'
            },
            features: {
              forms: true,
              chat: true,
              knowledgeBase: true,
              tasks: true,
              documents: true,
              projects: true
            },
            limits: {
              maxUsers: 100,
              maxForms: 50,
              maxStorageGB: 10
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tenant-2',
          name: 'Test Company',
          slug: 'test-company',
          settings: {
            allowPublicForms: true,
            requireAuthentication: false,
            branding: {
              primaryColor: '#dc2626',
              secondaryColor: '#b91c1c'
            },
            features: {
              forms: true,
              chat: false,
              knowledgeBase: false,
              tasks: false,
              documents: true,
              projects: false
            },
            limits: {
              maxUsers: 25,
              maxForms: 10,
              maxStorageGB: 2
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }

    // Real implementation would fetch from API
    console.log('Fetching user tenants');
    return [];
  };

  const fetchTenantDepartments = async (tenantId: string): Promise<Department[]> => {
    // In demo mode, return mock departments
    if (process.env.REACT_APP_DEMO_MODE === 'true') {
      return [
        {
          id: 'dept-1',
          tenantId: tenantId,
          name: 'Marketing',
          slug: 'marketing',
          settings: {
            allowExternalUsers: false,
            requireApproval: true,
            notificationSettings: {
              emailNotifications: true,
              slackNotifications: false
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'dept-2',
          tenantId: tenantId,
          name: 'Sales',
          slug: 'sales',
          settings: {
            allowExternalUsers: true,
            requireApproval: false,
            notificationSettings: {
              emailNotifications: true,
              slackNotifications: true
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'dept-3',
          tenantId: tenantId,
          name: 'Support',
          slug: 'support',
          settings: {
            allowExternalUsers: true,
            requireApproval: true,
            notificationSettings: {
              emailNotifications: true,
              slackNotifications: true
            }
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }

    // Real implementation would fetch from API
    console.log('Fetching departments for tenant:', tenantId);
    return [];
  };

  const getNavigationTree = () => {
    const user = state.user;
    const tenant = state.tenant;
    const departments = state.departments;

    if (!user || !tenant) return [];

    return [
      {
        id: tenant.id,
        name: tenant.name,
        type: 'tenant',
        tenantId: tenant.id,
        children: departments.map(dept => ({
          id: dept.id,
          name: dept.name,
          type: 'department',
          tenantId: tenant.id,
          departmentId: dept.id,
          children: [
            {
              id: 'forms',
              name: 'Forms',
              type: 'resource',
              tenantId: tenant.id,
              departmentId: dept.id,
              resourceId: 'forms'
            },
            {
              id: 'submissions',
              name: 'Submissions',
              type: 'resource',
              tenantId: tenant.id,
              departmentId: dept.id,
              resourceId: 'submissions'
            },
            {
              id: 'chat',
              name: 'Chat',
              type: 'resource',
              tenantId: tenant.id,
              departmentId: dept.id,
              resourceId: 'chat'
            },
            {
              id: 'tasks',
              name: 'Tasks',
              type: 'resource',
              tenantId: tenant.id,
              departmentId: dept.id,
              resourceId: 'tasks'
            }
          ]
        }))
      }
    ];
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    refreshSession,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    globalSearch,
    logAuditEvent,
    checkPermission,
    switchTenant,
    switchDepartment,
    fetchUserTenants,
    fetchTenantDepartments,
    getNavigationTree,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
