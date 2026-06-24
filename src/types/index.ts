import z from "zod";

export const createSecretSchema = z.object({
  secret: z
    .string()
    .min(1, "Secret cannot be empty.")
    .max(5000, "Secret is too long. Keep it under 5000 characters."),
  allowedViews: z
    .number()
    .int()
    .min(1, "Must allow at least 1 view.")
    .max(100, "Cannot exceed 100 views.")
    .optional()
    .default(1),
});

export type SecretRecord = {
  id: string;
  secret: string;
  maxViews: number;
  currentViews: number;
  createdAt: string;
};
