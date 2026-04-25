import { describe, expect, it } from "vitest";
import type { Case, Sighting } from "@/domain/case";
import type { Pet } from "@/domain/pets";
import { PetCaseRepository } from "@/domain/case-repository";
import { createInMemoryKvStore } from "@/platform/testing/in-memory-dependencies";
import { CasesService } from "./cases";

describe("CasesService", () => {
  it("adds open cases to their country and city collection", async () => {
    const { repository, service } = createTestService();
    const petCase = createCase("case-1", { status: "open" });

    await service.save(petCase);

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual(["case-1"]);
  });

  it("does not add non-open cases to a collection", async () => {
    const { repository, service } = createTestService();
    const petCase = createCase("case-1", { status: "created" });

    await service.save(petCase);

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual([]);
  });

  it("removes a case from its collection when it is no longer open", async () => {
    const { repository, service } = createTestService();

    await service.save(createCase("case-1", { status: "open" }));
    await service.save(createCase("case-1", { status: "closed" }));

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual([]);
  });

  it("throws when an open case does not have a lost place", async () => {
    const { repository, service } = createTestService();
    const petCase = createCase("case-1", { status: "open", lost_place: undefined });

    await expect(service.save(petCase)).rejects.toThrow(
      "Open cases must have a lost place with country and city.",
    );
    await expect(repository.get("case-1")).resolves.toBeNull();
  });

  it("throws when an open case does not have a city", async () => {
    const { repository, service } = createTestService();
    const petCase = createCase("case-1", {
      status: "open",
      lost_place: {
        country: "nl",
        city: "",
      },
    });

    await expect(service.save(petCase)).rejects.toThrow(
      "Open cases must have a lost place with country and city.",
    );
    await expect(repository.get("case-1")).resolves.toBeNull();
  });

  it("returns collection cases sorted by match score", async () => {
    const { service } = createTestService();
    const bestCase = createCase("case-1", { status: "open" });
    const weakerCase = createCase("case-2", {
      status: "open",
      pet: {
        ...createPet(),
        breed: "Persian",
        color: "black",
      },
      lost_time: "2026-03-01T12:00:00.000Z" as Case["lost_time"],
    });
    const closedCase = createCase("case-3", { status: "closed" });
    const pet = createPet();
    const sighting = createSighting();

    await service.save(bestCase);
    await service.save(weakerCase);
    await service.save(closedCase);

    await expect(service.matchPet(pet, sighting, "nl", "Amsterdam")).resolves.toEqual([
      expect.objectContaining({
        case: bestCase,
        score: 1,
        reasons: expect.arrayContaining([
          "Similar size",
          "Same collar presence",
          "Lost time within 24h of sighting",
        ]),
      }),
      expect.objectContaining({
        case: weakerCase,
        score: 0,
        reasons: ["Wrong color"],
      }),
    ]);
  });

  it("adds a reason when lost time is close to sighting time", async () => {
    const { service } = createTestService();
    const pet = createPet();
    const sighting = createSighting({ time: "2026-04-25T15:30:00.000Z" as Sighting["time"] });
    const petCase = createCase("case-1", {
      status: "open",
      lost_time: "2026-04-25T16:00:00.000Z" as Case["lost_time"],
    });

    await service.save(petCase);

    const [match] = await service.matchPet(pet, sighting, "nl", "Amsterdam");

    expect(match.reasons).toContain("Lost time within 24h of sighting");
  });

  it("scores time proximity using the requested buckets", async () => {
    const { service } = createTestService();
    const pet = createPet();
    const sighting = createSighting({
      time: "2026-04-25T12:00:00.000Z" as Sighting["time"],
    });
    const within24Hours = createCase("case-24h", {
      status: "open",
      lost_time: "2026-04-24T12:00:00.000Z" as Case["lost_time"],
      pet: createPet({ size: undefined, age_group: undefined, collar: undefined }),
    });
    const within2Days = createCase("case-2d", {
      status: "open",
      lost_time: "2026-04-23T12:00:00.000Z" as Case["lost_time"],
      pet: createPet({ size: undefined, age_group: undefined, collar: undefined }),
    });
    const withinWeek = createCase("case-week", {
      status: "open",
      lost_time: "2026-04-19T12:00:00.000Z" as Case["lost_time"],
      pet: createPet({ size: undefined, age_group: undefined, collar: undefined }),
    });
    const withinMonth = createCase("case-month", {
      status: "open",
      lost_time: "2026-04-01T12:00:00.000Z" as Case["lost_time"],
      pet: createPet({ size: undefined, age_group: undefined, collar: undefined }),
    });
    const overMonth = createCase("case-over-month", {
      status: "open",
      lost_time: "2026-03-01T12:00:00.000Z" as Case["lost_time"],
      pet: createPet({ size: undefined, age_group: undefined, collar: undefined }),
    });

    await service.save(within24Hours);
    await service.save(within2Days);
    await service.save(withinWeek);
    await service.save(withinMonth);
    await service.save(overMonth);

    const matches = await service.matchPet(pet, sighting, "nl", "Amsterdam");

    expect(matches.map((match) => ({ id: match.case.id, score: match.score }))).toEqual([
      { id: "case-24h", score: 0.7499999999999999 },
      { id: "case-2d", score: 0.625 },
      { id: "case-week", score: 0.37500000000000006 },
      { id: "case-month", score: 0.25 },
      { id: "case-over-month", score: 0.125 },
    ]);
  });
});

function createTestService() {
  const repository = new PetCaseRepository({
    kv: createInMemoryKvStore(),
  });

  return {
    repository,
    service: new CasesService(repository),
  };
}

function createCase(id: string, overrides: Partial<Case> = {}): Case {
  return {
    id,
    status: "created",
    owner: {
      name: "Ada Lovelace",
      email: "ada@example.com",
    },
    pet: createPet(),
    lost_time: "2026-04-25T12:00:00.000Z" as Case["lost_time"],
    lost_place: {
      country: "nl",
      city: "Amsterdam",
      full_address: "123 Example St, Amsterdam",
      district: "Centrum",
    },
    sightings: [],
    created_at: "2026-04-25T12:01:00.000Z" as Case["created_at"],
    updated_at: "2026-04-25T12:02:00.000Z" as Case["updated_at"],
    ...overrides,
  };
}

function createPet(overrides: Partial<Pet> = {}): Pet {
  return {
    species: "cat",
    breed: "Siamese",
    breed_group: "Oriental",
    photo_urls: [],
    gender: "female",
    name: "Miso",
    color: "cream",
    size: "small",
    collar: true,
    ...overrides,
  };
}

function createSighting(overrides: Partial<Sighting> = {}): Sighting {
  return {
    place: {
      country: "nl",
      city: "Amsterdam",
      district: "Centrum",
    },
    time: "2026-04-25T13:00:00.000Z" as Sighting["time"],
    ...overrides,
  };
}
