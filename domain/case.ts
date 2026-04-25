import { fileStorage, type FileStorage } from "@/platform/file-storage";
import { kvStore, type KvStore } from "@/platform/kv-store";
import { ISODateTimeString } from "@/platform/time";
import { z } from "zod";
import { OwnerSchema } from "./owner";
import { PetSchema } from "./pets";

const isoDateTimeStringSchema = z.iso.datetime().transform((value) => value as ISODateTimeString);
const caseStatusSchema = z.enum(["created", "open", "closed"]);

export const AddressSchema = z.object({
  country: z.string(),
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

export type PetCaseRepository = {
  save(petCase: Case): Promise<Case>;
  get(id: string): Promise<Case | null>;
  list(): Promise<Case[]>;
  delete(id: string): Promise<void>;
};

const petCaseIndexKey = "pet-cases:index";

export const petCaseRepository = createPetCaseRepository();

export function createPetCaseRepository(
  dependencies: { kv?: KvStore; storage?: FileStorage } = {},
): PetCaseRepository {
  const kv = dependencies.kv ?? kvStore;
  const storage = dependencies.storage ?? fileStorage;

  return {
    async save(petCase) {
      const validCase = CaseSchema.parse(petCase);

      await storage.put(casePathname(validCase.id), JSON.stringify(validCase), {
        contentType: "application/json",
      });
      await saveCaseId(kv, validCase.id);

      return validCase;
    },

    get(id) {
      return getPetCase(storage, id);
    },

    async list() {
      const ids = await getCaseIds(kv);
      const cases = await Promise.all(ids.map((id) => getPetCase(storage, id)));

      return cases.filter((petCase): petCase is Case => petCase !== null);
    },

    async delete(id) {
      await storage.delete(casePathname(id));
      await removeCaseId(kv, id);
    },
  };
}

async function getPetCase(storage: FileStorage, id: string) {
  const storedFile = await storage.get(casePathname(id));

  if (!storedFile) {
    return null;
  }

  return CaseSchema.parse(JSON.parse(Buffer.from(storedFile.body).toString("utf8")));
}

async function saveCaseId(kv: KvStore, id: string) {
  const ids = await getCaseIds(kv);
  const nextIds = [id, ...ids.filter((existingId) => existingId !== id)];

  await kv.set(petCaseIndexKey, JSON.stringify(nextIds));
}

async function removeCaseId(kv: KvStore, id: string) {
  const ids = await getCaseIds(kv);

  await kv.set(
    petCaseIndexKey,
    JSON.stringify(ids.filter((existingId) => existingId !== id)),
  );
}

async function getCaseIds(kv: KvStore) {
  const value = await kv.get(petCaseIndexKey);

  if (!value) {
    return [];
  }

  return JSON.parse(value) as string[];
}

function casePathname(id: string) {
  return `cases/${encodeURIComponent(id)}.json`;
}
