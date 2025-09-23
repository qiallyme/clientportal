// Hierarchical User Types for Multi-Tenant Architecture
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'department_admin' | 'user' | 'viewer' | 'contributor';
  tenantId: string;
  departmentId?: string;
  permissions: {
    canCreateForms: boolean;
    canManageUsers: boolean;
    canViewAllSubmissions: boolean;
    canEditSubmissions: boolean;
    canManageDepartments: boolean;
    canViewAuditLogs: boolean;
    canManageTenants: boolean;
    [key: string]: boolean; // Allow additional permissions
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Tenant (Client Organization)
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Department (Sub-organization within Tenant)
export interface Department {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  parentDepartmentId?: string;
  settings: DepartmentSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tenant Settings
export interface TenantSettings {
  allowPublicForms: boolean;
  requireAuthentication: boolean;
  branding: {
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    forms: boolean;
    chat: boolean;
    knowledgeBase: boolean;
    tasks: boolean;
    documents: boolean;
    projects: boolean;
  };
  limits: {
    maxUsers: number;
    maxForms: number;
    maxStorageGB: number;
  };
  [key: string]: any;
}

// Department Settings
export interface DepartmentSettings {
  allowExternalUsers: boolean;
  requireApproval: boolean;
  notificationSettings: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    webhookUrl?: string;
  };
  [key: string]: any;
}

export interface FormSettings {
  allowMultipleSubmissions?: boolean;
  requireAuthentication?: boolean;
  notificationEmail?: string;
  autoResponse?: {
    enabled?: boolean;
    subject?: string;
    message?: string;
  };
  [key: string]: unknown; // Allow additional settings
}

export interface Form {
  _id: string;
  tenantId: string;
  departmentId?: string;
  title: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  isPublic: boolean;
  createdBy: string | null;
  settings: FormSettings;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Submission {
  _id: string;
  tenantId: string;
  departmentId?: string;
  formId: string | { _id: string; title: string; fields?: any[] };
  submittedBy?: User;
  data: Record<string, any>;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: User;
  notes: Note[];
  attachments: Attachment[];
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    region?: string;
    referrer?: string;
  };
  lastUpdatedBy?: User;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  submissionNumber: string;
}

export interface Note {
  text: string;
  addedBy: User;
  addedAt: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  token?: string; // For auth responses that include refreshed tokens
  message?: string;
  errors?: any[];
  count?: number;
  total?: number;
  pages?: number;
  current?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  pages: number;
  current: number;
  data: T[];
}

// Knowledge Base
export interface KnowledgeBase {
  id: string;
  tenantId: string;
  departmentId?: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Chat
export interface Chat {
  id: string;
  tenantId: string;
  departmentId?: string;
  title?: string;
  type: 'group' | 'direct' | 'support';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Message
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  message: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  metadata: Record<string, any>;
  createdAt: string;
}

// Task
export interface Task {
  id: string;
  tenantId: string;
  departmentId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdBy: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Document
export interface Document {
  id: string;
  tenantId: string;
  departmentId?: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  tenantId: string;
  departmentId?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startDate?: string;
  endDate?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Audit Log for compliance
export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Permission system
export interface Permission {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

// Tenant context for multi-tenant operations
export interface TenantContext {
  tenant: Tenant;
  departments: Department[];
  user: User;
  permissions: Permission[];
}

// Hierarchical navigation
export interface NavigationItem {
  id: string;
  name: string;
  type: 'tenant' | 'department' | 'resource';
  tenantId: string;
  departmentId?: string;
  resourceId?: string;
  children?: NavigationItem[];
}
