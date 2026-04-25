import { fileStorage, type FileStorage } from "@/platform/file-storage";
import { kvStore, type KvStore } from "@/platform/kv-store";
import { ISODateTimeString } from "@/platform/time";
import { Owner } from "./owner";
import { Pet } from "./pets";

export type Sighting = {
  place: Address;
  time: ISODateTimeString;
};

export type Case = {
  id: string;
  owner: Owner;
  pet: Pet;
  lost_time: ISODateTimeString;
  lost_place: Address;
  sightings: Sighting[];
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  reward?: string;
};

export type PetCaseRepository = {
  save(petCase: Case): Promise<Case>;
  get(id: string): Promise<Case | null>;
  list(): Promise<Case[]>;
  delete(id: string): Promise<void>;
};

type Address = {
  country: string;
  city: string;
  region?: string;
  district?: string;
  street?: string;
  house_number?: string;
  apartment?: string;
  postal_code?: string;
  full_address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
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
      await storage.put(casePathname(petCase.id), JSON.stringify(petCase), {
        contentType: "application/json",
      });
      await saveCaseId(kv, petCase.id);

      return petCase;
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

  return JSON.parse(Buffer.from(storedFile.body).toString("utf8")) as Case;
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
