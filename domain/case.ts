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

const petCaseIndexKey = "pet-cases:index";

export class PetCaseRepository {
  private readonly kv: KvStore;
  private readonly storage: FileStorage;

  constructor(dependencies: { kv?: KvStore; storage?: FileStorage } = {}) {
    this.kv = dependencies.kv ?? kvStore;
    this.storage = dependencies.storage ?? fileStorage;
  }

  async save(petCase: Case) {
    const validCase = CaseSchema.parse(petCase);

    await this.storage.put(this.casePathname(validCase.id), JSON.stringify(validCase), {
      contentType: "application/json",
    });
    await this.saveCaseId(validCase.id);

    return validCase;
  }

  get(id: string) {
    return this.getPetCase(id);
  }

  async list() {
    const ids = await this.getCaseIds();
    const cases = await Promise.all(ids.map((id) => this.getPetCase(id)));

    return cases.filter((petCase): petCase is Case => petCase !== null);
  }

  async delete(id: string) {
    await this.storage.delete(this.casePathname(id));
    await this.removeCaseId(id);
  }

  async addCaseToCollection(country: string, city: string, caseId: string) {
    await this.kv.addToSet(this.collectionKey(country, city), caseId);
  }

  async removeCaseFromCollection(country: string, city: string, caseId: string) {
    await this.kv.removeFromSet(this.collectionKey(country, city), caseId);
  }

  async getCollection(country: string, city: string) {
    return this.kv.getSet(this.collectionKey(country, city));
  }

  private async getPetCase(id: string) {
    const storedFile = await this.storage.get(this.casePathname(id));

    if (!storedFile) {
      return null;
    }

    return CaseSchema.parse(JSON.parse(Buffer.from(storedFile.body).toString("utf8")));
  }

  private async saveCaseId(id: string) {
    const ids = await this.getCaseIds();
    const nextIds = [id, ...ids.filter((existingId) => existingId !== id)];

    await this.kv.set(petCaseIndexKey, JSON.stringify(nextIds));
  }

  private async removeCaseId(id: string) {
    const ids = await this.getCaseIds();

    await this.kv.set(
      petCaseIndexKey,
      JSON.stringify(ids.filter((existingId) => existingId !== id)),
    );
  }

  private async getCaseIds() {
    const value = await this.kv.get(petCaseIndexKey);

    if (!value) {
      return [];
    }

    return JSON.parse(value) as string[];
  }

  private casePathname(id: string) {
    return `cases/${encodeURIComponent(id)}.json`;
  }

  private collectionKey(country: string, city: string) {
    return `pet-cases:collection:${encodeURIComponent(country)}/${encodeURIComponent(city)}`;
  }
}

export const petCaseRepository = new PetCaseRepository();
