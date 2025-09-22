import axios, { AxiosResponse } from 'axios';
import { AuthResponse, ApiResponse, PaginatedResponse, User, Form, Submission } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://client-portal.qilife.workers.dev';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => {
    // If response includes a new token, update it
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await api.post('/auth/refresh');
        const { token } = refreshResponse.data;
        
        // Update the token and retry the original request
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    region?: string;
  }): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', userData),
  
  getMe: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/auth/me'),
  
  refreshToken: (): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/refresh'),
  
  updateProfile: (userData: { name?: string; email?: string }): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put('/auth/profile', userData),
  
  changePassword: (passwords: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put('/auth/change-password', passwords),
};

// Forms API
export const formsAPI = {
  getForms: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<AxiosResponse<PaginatedResponse<Form>>> =>
    api.get('/forms', { params }),
  
  getForm: (id: string): Promise<AxiosResponse<ApiResponse<Form>>> =>
    api.get(`/forms/${id}`),
  
  getFormForSubmission: (id: string): Promise<AxiosResponse<ApiResponse<Form>>> =>
    api.get(`/forms/${id}/submit`),
  
  createForm: (formData: Partial<Form>): Promise<AxiosResponse<ApiResponse<Form>>> =>
    api.post('/forms', formData),
  
  updateForm: (id: string, formData: Partial<Form>): Promise<AxiosResponse<ApiResponse<Form>>> =>
    api.put(`/forms/${id}`, formData),
  
  deleteForm: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete(`/forms/${id}`),
  
  getFormSubmissions: (id: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    assignedTo?: string;
  }): Promise<AxiosResponse<PaginatedResponse<Submission>>> =>
    api.get(`/forms/${id}/submissions`, { params }),
  
  getFormStats: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/forms/${id}/stats`),
};

// Submissions API
export const submissionsAPI = {
  getSubmissions: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    formId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AxiosResponse<PaginatedResponse<Submission>>> =>
    api.get('/submissions', { params }),
  
  getSubmission: (id: string): Promise<AxiosResponse<ApiResponse<Submission>>> =>
    api.get(`/submissions/${id}`),
  
  createSubmission: (submissionData: {
    formId: string;
    data: Record<string, any>;
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<Submission>>> =>
    api.post('/submissions', submissionData),
  
  updateSubmission: (id: string, submissionData: Partial<Submission>): Promise<AxiosResponse<ApiResponse<Submission>>> =>
    api.put(`/submissions/${id}`, submissionData),
  
  deleteSubmission: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete(`/submissions/${id}`),
  
  addNote: (id: string, note: { text: string }): Promise<AxiosResponse<ApiResponse<Submission>>> =>
    api.post(`/submissions/${id}/notes`, note),
  
  getStats: (period?: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/submissions/stats/overview', { params: { period } }),
};

// Users API
export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    region?: string;
    isActive?: boolean;
  }): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get('/users', { params }),
  
  getUser: (id: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get(`/users/${id}`),
  
  createUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    region?: string;
    permissions?: any;
  }): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.post('/users', userData),
  
  updateUser: (id: string, userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete(`/users/${id}`),
  
  updatePermissions: (id: string, permissions: any): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put(`/users/${id}/permissions`, { permissions }),
  
  toggleActive: (id: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.put(`/users/${id}/toggle-active`),
  
  getStats: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/users/stats/overview'),
};

// Health check
export const healthAPI = {
  check: (): Promise<AxiosResponse<{ status: string; timestamp: string; region: string }>> =>
    api.get('/health'),
};

export default api;
