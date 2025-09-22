export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  region: 'us' | 'china' | 'global';
  permissions: {
    canCreateForms: boolean;
    canManageUsers: boolean;
    canViewAllSubmissions: boolean;
    canEditSubmissions: boolean;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Form {
  _id: string;
  title: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  isPublic: boolean;
  createdBy: User;
  settings: {
    allowMultipleSubmissions: boolean;
    requireAuthentication: boolean;
    notificationEmail?: string;
    autoResponse?: {
      enabled: boolean;
      subject?: string;
      message?: string;
    };
  };
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
