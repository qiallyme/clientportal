import { supabase } from '../lib/supabase';
import { Form, FormSettings } from '../types';

export interface SupabaseForm {
  id: string;
  org_id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  schema_json: {
    fields?: any[];
    settings?: Partial<FormSettings>;
  } | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedFormsResponse {
  data: Form[];
  total: number;
  pages: number;
  current: number;
}

const defaultFormSettings: FormSettings = {
  allowMultipleSubmissions: false,
  requireAuthentication: true,
  notificationEmail: '',
  autoResponse: {
    enabled: false,
    subject: '',
    message: '',
  },
};

// Convert Supabase form to our Form type with hierarchical structure
const convertSupabaseForm = (supabaseForm: SupabaseForm): Form => {
  return {
    _id: supabaseForm.id,
    tenantId: supabaseForm.org_id, // Map org_id to tenantId for hierarchical access
    departmentId: undefined, // This would be populated from a separate query if needed
    title: supabaseForm.title,
    description: supabaseForm.description || '',
    fields: supabaseForm.schema_json?.fields || [],
    isActive: supabaseForm.is_active,
    isPublic: supabaseForm.is_public,
    createdBy: supabaseForm.owner_id || null,
    settings: {
      ...defaultFormSettings,
      ...(supabaseForm.schema_json?.settings || {}),
    },
    submissionCount: 0, // We'll need to fetch this separately
    createdAt: supabaseForm.created_at,
    updatedAt: supabaseForm.updated_at,
  };
};

export const supabaseFormsAPI = {
  // Get forms with pagination and filtering
  getForms: async (params?: FormsQueryParams): Promise<PaginatedFormsResponse> => {
    const { page = 1, limit = 10, search, isActive } = params || {};
    
    console.log('🔍 Fetching forms with params:', params);
    
    let query = supabase
      .from('forms')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    console.log('🔍 Executing query...');
    const { data, error, count } = await query;

    console.log('🔍 Query result:', { data, error, count });

    if (error) {
      console.error('❌ Error fetching forms:', error);
      throw new Error(error.message);
    }

    const forms = (data || []).map(convertSupabaseForm);
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    console.log('✅ Converted forms:', forms);

    return {
      data: forms,
      total,
      pages,
      current: page,
    };
  },

  // Get a single form by ID
  getForm: async (id: string): Promise<Form> => {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching form:', error);
      throw new Error(error.message);
    }

    return convertSupabaseForm(data);
  },

  // Get form for submission (public forms only)
  getFormForSubmission: async (id: string): Promise<Form> => {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .eq('is_public', true)
      .single();

    if (error) {
      console.error('Error fetching form for submission:', error);
      throw new Error(error.message);
    }

    return convertSupabaseForm(data);
  },

  // Create a new form
  createForm: async (formData: Partial<Form>): Promise<Form> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's org_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const supabaseFormData = {
      org_id: userProfile.org_id,
      owner_id: user.id,
      title: formData.title || '',
      description: formData.description || '',
      schema_json: {
        fields: formData.fields || [],
        settings: formData.settings || defaultFormSettings
      },
      is_active: formData.isActive ?? true,
      is_public: formData.isPublic ?? false,
    };

    const { data, error } = await supabase
      .from('forms')
      .insert(supabaseFormData)
      .select()
      .single();

    if (error) {
      console.error('Error creating form:', error);
      throw new Error(error.message);
    }

    return convertSupabaseForm(data);
  },

  // Update a form
  updateForm: async (id: string, formData: Partial<Form>): Promise<Form> => {
    const updateData: any = {};

    if (formData.title !== undefined) updateData.title = formData.title;
    if (formData.description !== undefined) updateData.description = formData.description;
    if (formData.fields !== undefined || formData.settings !== undefined) {
      updateData.schema_json = {
        fields: formData.fields || [],
        settings: formData.settings || defaultFormSettings
      };
    }
    if (formData.isActive !== undefined) updateData.is_active = formData.isActive;
    if (formData.isPublic !== undefined) updateData.is_public = formData.isPublic;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating form:', error);
      throw new Error(error.message);
    }

    return convertSupabaseForm(data);
  },

  // Delete a form
  deleteForm: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting form:', error);
      throw new Error(error.message);
    }
  },

  // Get form submissions count
  getFormSubmissionsCount: async (formId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId);

    if (error) {
      console.error('Error fetching form submissions count:', error);
      return 0;
    }

    return count || 0;
  },
};
