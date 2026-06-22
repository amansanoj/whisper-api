import z from "zod";

export const createSecretSchema = z.object({
  secret: z
    .string()
    .min(1, "Secret cannot be empty.")
    .max(5000, "Secret is too long. Keep it under 5000 characters."),
});

export type SecretRecord = {
  id: string;
  secret: string;
  createdAt: string;
};
