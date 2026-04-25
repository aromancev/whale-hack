import { describe, expect, it } from "vitest";
import type { Case } from "@/domain/case";
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

  it("returns all cases from the collection when matching a pet", async () => {
    const { service } = createTestService();
    const firstCase = createCase("case-1", { status: "open" });
    const secondCase = createCase("case-2", { status: "open" });
    const closedCase = createCase("case-3", { status: "closed" });

    await service.save(firstCase);
    await service.save(secondCase);
    await service.save(closedCase);

    await expect(service.matchPet(firstCase.pet!, "nl", "Amsterdam")).resolves.toEqual([
      firstCase,
      secondCase,
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
    pet: {
      species: "cat",
      breed: "Siamese",
      breed_group: "Oriental",
      photo_urls: [],
      gender: "female",
      name: "Miso",
    },
    lost_time: "2026-04-25T12:00:00.000Z" as Case["lost_time"],
    lost_place: {
      country: "nl",
      city: "Amsterdam",
      full_address: "123 Example St, Amsterdam",
    },
    sightings: [],
    created_at: "2026-04-25T12:01:00.000Z" as Case["created_at"],
    updated_at: "2026-04-25T12:02:00.000Z" as Case["updated_at"],
    ...overrides,
  };
}
