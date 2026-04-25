import { z } from "zod";
import { ISODateTimeString } from "@/platform/time";
import { OwnerSchema } from "./owner";
import { PetSchema } from "./pets";

const isoDateTimeStringSchema = z.iso.datetime().transform((value) => value as ISODateTimeString);
const caseStatusSchema = z.enum(["created", "open", "closed"]);

export const countries = ['nl'] as const;
export const CountrySchema = z.enum(countries)
export type Country = z.infer<typeof CountrySchema>

export const AddressSchema = z.object({
  country: CountrySchema,
  city: z.string(),
  region: z.string().optional(),
  district: z.string().optional(),
  street: z.string().optional(),
  house_number: z.string().optional(),
  apartment: z.string().optional(),
  postal_code: z.string().optional(),
  full_address: z.string().optional(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

export const SightingSchema = z.object({
  place: AddressSchema,
  time: isoDateTimeStringSchema,
});

export const CaseSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  status: caseStatusSchema.default("created"),
  owner: OwnerSchema,
  pet: PetSchema.optional(),
  lost_time: isoDateTimeStringSchema.optional(),
  lost_place: AddressSchema.optional(),
  sightings: z.array(SightingSchema),
  created_at: isoDateTimeStringSchema,
  updated_at: isoDateTimeStringSchema,
  reward: z.string().optional(),
});

export type Address = z.infer<typeof AddressSchema>;
export type Sighting = z.infer<typeof SightingSchema>;
export type Case = z.infer<typeof CaseSchema>;
