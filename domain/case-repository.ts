import { fileStorage, type FileStorage } from "@/platform/file-storage";
import { kvStore, type KvStore } from "@/platform/kv-store";
import { CaseSchema, type Case } from "./case";

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
