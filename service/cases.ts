import type { Case, Country } from "@/domain/case";
import { petCaseRepository, type PetCaseRepository } from "@/domain/case-repository";
import type { Pet } from "@/domain/pets";

export class CasesService {
    constructor(private readonly repository: PetCaseRepository) { }

    async save(petCase: Case): Promise<Case> {
        if (petCase.status === "open") {
            this.assertOpenCaseHasAddress(petCase);
        }

        const savedCase = await this.repository.save(petCase);
        const savedCollectionAddress = this.getCollectionAddress(savedCase);

        if (savedCase.status !== "open" && savedCollectionAddress) {
            await this.repository.removeCaseFromCollection(
                savedCollectionAddress.country,
                savedCollectionAddress.city,
                savedCase.id,
            );
        }

        if (savedCase.status === "open") {
            this.assertOpenCaseHasAddress(savedCase);
            await this.repository.addCaseToCollection(
                savedCase.lost_place.country,
                savedCase.lost_place.city,
                savedCase.id,
            );
        }

        return savedCase;
    }

    get(id: string): Promise<Case | null> {
        return this.repository.get(id);
    }

    async matchPet(_pet: Pet, country: Country, city: string): Promise<Case[]> {
        const caseIds = await this.repository.getCollection(country, city);

        return this.repository.getMany(caseIds);
    }

    private assertOpenCaseHasAddress(petCase: Case): asserts petCase is Case & {
        lost_place: Case["lost_place"] & { country: string; city: string };
    } {
        if (!petCase.lost_place?.country || !petCase.lost_place.city) {
            throw new Error("Open cases must have a lost place with country and city.");
        }
    }

    private getCollectionAddress(petCase: Case | null) {
        if (!petCase?.lost_place?.country || !petCase.lost_place.city) {
            return null;
        }

        return {
            country: petCase.lost_place.country,
            city: petCase.lost_place.city,
        };
    }
}

export const casesService = new CasesService(petCaseRepository);
