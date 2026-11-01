import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUpSchema = signInSchema.extend({
  username: z.string().toLowerCase().regex(/^[a-z0-9_]{3,20}$/),
  rules: z.literal("on"), // persetujuan aturan komunitas
});

export const commentSchema = z.object({
  thread_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  body: z.string().trim().min(1).max(5000),
});
