import { z } from "zod";

export const OwnerSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone_number: z.string().optional(),
});

export type Owner = z.infer<typeof OwnerSchema>;
