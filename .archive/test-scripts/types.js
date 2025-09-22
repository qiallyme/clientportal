import { z } from "zod";
export const FormCreate = z.object({
    title: z.string().min(1),
    schema: z.object({ fields: z.array(z.record(z.string(), z.any())) }).default({ fields: [] }),
});
export const SubmissionCreate = z.object({
    form_id: z.string().uuid(),
    data: z.record(z.string(), z.any()),
});
