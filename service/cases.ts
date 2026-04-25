import { CaseSchema, Sighting, type Case, type Country } from "@/domain/case";
import { petCaseRepository, type PetCaseRepository } from "@/domain/case-repository";
import type { Pet } from "@/domain/pets";
import z from "zod";

type WeightedMatch = {
    matchedWeight: number;
    totalWeight: number;
    reasons: string[];
}

export const CaseMatchSchema = z.object({
    case: CaseSchema,
    score: z.number().min(0).max(1),
    reasons: z.string().array(),
})

export type CaseMatch = z.infer<typeof CaseMatchSchema>

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

    async matchPet(pet: Pet, sighting: Sighting, country: Country, city: string): Promise<CaseMatch[]> {
        const caseIds = await this.repository.getCollection(country, city);
        const cases = await this.repository.getMany(caseIds);

        return cases
            .map((petCase): CaseMatch => {
                if (petCase.pet === undefined) {
                    return {
                        case: petCase,
                        score: 0,
                        reasons: ['No pet data'],
                    }
                }
                if (petCase.pet.species !== pet.species) {
                    return {
                        case: petCase,
                        score: 0,
                        reasons: ['Wrong species'],
                    }
                }
                if (petCase.pet?.breed_group !== pet.breed_group) {
                    return {
                        case: petCase,
                        score: 0,
                        reasons: ['Wrong breed'],
                    }
                }
                if (petCase.pet?.color !== pet.color) {
                    return {
                        case: petCase,
                        score: 0,
                        reasons: ['Wrong color'],
                    }
                }

                const reasons: string[] = [];
                let score: number = 0;
                let maxScore: number = 0;

                maxScore += 0.1
                if (petCase.pet.size === pet.size) {
                    score += 0.1
                    reasons.push('Similar size')
                }

                maxScore += 0.1
                if (petCase.pet.age_group === pet.age_group) {
                    score += 0.1
                    reasons.push('Similar age group')
                }

                maxScore += 0.1
                if (petCase.pet.collar === pet.collar) {
                    score += 0.1
                    reasons.push('Same collar presence')
                }

                maxScore += 0.5
                if (petCase.lost_time) {
                    const lostTime = new Date(petCase.lost_time).getTime();
                    const sightingTime = new Date(sighting.time).getTime();
                    const hoursDiff = Math.abs(sightingTime - lostTime) / (1000 * 60 * 60);

                    if (hoursDiff <= 24) {
                        score += 0.5
                        reasons.push('Lost time within 24h of sighting')
                    } else if (hoursDiff <= 48) {
                        score += 0.4
                        reasons.push('Lost time within 2 days of sighting')
                    } else if (hoursDiff <= 24 * 7) {
                        score += 0.2
                        reasons.push('Lost time within a week of sighting')
                    } else if (hoursDiff <= 24 * 30) {
                        score += 0.1
                        reasons.push('Lost time within a month of sighting')
                    }
                }

                return {
                    case: petCase,
                    score: score / maxScore,
                    reasons,
                }
            })
            .sort((left, right) => right.score - left.score);
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
