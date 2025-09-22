import { z } from "zod";

export const FormCreate = z.object({
  title: z.string().min(1),
  schema: z.object({ fields: z.array(z.record(z.string(), z.any())) }).default({ fields: [] }),
});

export type FormCreateT = z.infer<typeof FormCreate>;

export const SubmissionCreate = z.object({
  form_id: z.string().uuid(),
  data: z.record(z.string(), z.any()),
});
export type SubmissionCreateT = z.infer<typeof SubmissionCreate>;

export type Claims = {
  iss?: string;
  sub: string;
  email?: string;
  org_id: string;
  role?: string;
  company_ids?: string[];
};
