import { z } from 'zod';

// Common schemas
export const UUID = z.string().uuid();
export const Timestamp = z.string().datetime();

// User schemas
export const UserSchema = z.object({
  id: UUID,
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  region: z.string().default('global'),
  org_id: UUID,
  is_active: z.boolean().default(true),
  permissions: z.record(z.any()).default({}),
  created_at: Timestamp,
  updated_at: Timestamp
});

// Organization schemas
export const OrganizationSchema = z.object({
  id: UUID,
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  created_at: Timestamp,
  updated_at: Timestamp
});

// Form field schema
export const FormFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio']),
  label: z.string().min(1),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
});

// Form schemas
export const FormSchema = z.object({
  id: UUID,
  org_id: UUID,
  owner_id: UUID,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  schema_json: z.object({
    fields: z.array(FormFieldSchema)
  }),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(false),
  created_at: Timestamp,
  updated_at: Timestamp
});

// Submission schemas
export const SubmissionSchema = z.object({
  id: UUID,
  org_id: UUID,
  form_id: UUID,
  submitter_id: UUID.optional(),
  data_json: z.record(z.any()),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().optional(),
  created_at: Timestamp,
  updated_at: Timestamp
});

// Request schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8)
});

export const CreateFormRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  schema: z.object({
    fields: z.array(FormFieldSchema)
  })
});

export const CreateSubmissionRequestSchema = z.object({
  form_id: UUID,
  data: z.record(z.any())
});

export const UpdateSubmissionRequestSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional()
});

// Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number()
  }).optional()
});

export const AuthResponseSchema = ApiResponseSchema.extend({
  token: z.string().optional(),
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
    role: true,
    region: true,
    org_id: true,
    permissions: true
  }).optional()
});

// Validation helper
export function validateRequest(schema, data) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    return { 
      success: false, 
      errors: error.errors?.map(err => ({
        field: err.path.join('.'),
        message: err.message
      })) || ['Validation failed']
    };
  }
}
