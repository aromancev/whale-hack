import { kvStore, type KvStore } from "@/platform/kv-store";
import { CaseSchema, type Case } from "./case";

const petCaseIndexKey = "pet-cases:index";

export class PetCaseRepository {
  private readonly kv: KvStore;

  constructor(dependencies: { kv?: KvStore } = {}) {
    this.kv = dependencies.kv ?? kvStore;
  }

  async save(petCase: Case) {
    const validCase = CaseSchema.parse(petCase);
    await this.kv.set(this.caseKey(validCase.id), JSON.stringify(validCase));
    await this.addCaseId(validCase.id);
    return validCase;
  }

  get(id: string) {
    return this.getPetCase(id);
  }

  async getMany(ids: string[]) {
    const storedCases = await this.kv.getMany(ids.map((id) => this.caseKey(id)));

    return storedCases
      .map((storedCase) => {
        if (!storedCase) {
          return null;
        }

        return CaseSchema.parse(JSON.parse(storedCase));
      })
      .filter((petCase): petCase is Case => petCase !== null);
  }

  async list() {
    const ids = await this.getCaseIds();

    return this.getMany(ids);
  }

  async delete(id: string) {
    await this.kv.delete(this.caseKey(id));
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
    const storedCase = await this.kv.get(this.caseKey(id));

    if (!storedCase) {
      return null;
    }

    return CaseSchema.parse(JSON.parse(storedCase));
  }

  private async removeCaseId(id: string) {
    const ids = await this.getCaseIds();

    await this.kv.set(
      petCaseIndexKey,
      JSON.stringify(ids.filter((existingId) => existingId !== id)),
    );
  }

  private async addCaseId(id: string) {
    const ids = await this.getCaseIds();

    await this.kv.set(
      petCaseIndexKey,
      JSON.stringify([id, ...ids.filter((existingId) => existingId !== id)]),
    );
  }

  private async getCaseIds() {
    const value = await this.kv.get(petCaseIndexKey);

    if (!value) {
      return [];
    }

    return JSON.parse(value) as string[];
  }

  private caseKey(id: string) {
    return `pet-cases:item:${encodeURIComponent(id)}`;
  }

  private collectionKey(country: string, city: string) {
    return `pet-cases:collection:${encodeURIComponent(country)}/${encodeURIComponent(city)}`;
  }
}

export const petCaseRepository = new PetCaseRepository();
