import { z } from "zod";

export const ColorSchema = z.literal("");
export const SizeSchema = z.enum(["small", "medium", "large"]);

export const PetSchema = z.object({
  species: z.literal("cat"),
  breed: z.string(),
  breed_group: z.string(),
  photo_urls: z.array(z.string()),
  gender: z.enum(["male", "female"]),
  age_years: z.number().optional(),
  age_group: z.enum(["yong", "adult", "senior"]).optional(),
  name: z.string().optional(),
  appearance: z.string().optional(),
  description: z.string().optional(),
  health_info: z.string().optional(),
  behavior: z.string().optional(),
  unique_details: z.string().optional(),
  chipped: z.boolean().optional(),
  chip_number: z.string().optional(),
  color: ColorSchema.optional(),
  collar: z.boolean().optional(),
  size: SizeSchema.optional(),
});

export type Color = z.infer<typeof ColorSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type Pet = z.infer<typeof PetSchema>;
