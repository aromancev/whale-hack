import { petCaseRepository, type Case, type PetCaseRepository } from "@/domain/case";

export class CasesService {
    constructor(
        private readonly repository: PetCaseRepository,
    ) { }

    save(petCase: Case): Promise<Case> {
        return this.repository.save(petCase);
    }
}

export const casesService = new CasesService(petCaseRepository);
