import z from "zod";
import { PetSchema } from "./pets";
import { SightingSchema } from "./case";

export const ReportSchema = z.object({
    id: z.string().default(() => crypto.randomUUID()),
    pet: PetSchema,
    sighting: SightingSchema,
})

export type Report = z.infer<typeof ReportSchema>
