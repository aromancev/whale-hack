import { describe, expect, it } from "vitest";
import {
  createInMemoryFileStorage,
  createInMemoryKvStore,
} from "@/platform/testing/in-memory-dependencies";
import { CaseSchema, createPetCaseRepository, type Case } from "./case";

describe("petCaseRepository", () => {
  it("saves and loads a case", async () => {
    const repository = createTestRepository();
    const petCase = createCase("case-1");

    await repository.save(petCase);

    await expect(repository.get("case-1")).resolves.toEqual(petCase);
  });

  it("lists saved cases with most recently saved first", async () => {
    const repository = createTestRepository();
    const firstCase = createCase("case-1");
    const secondCase = createCase("case-2");

    await repository.save(firstCase);
    await repository.save(secondCase);

    await expect(repository.list()).resolves.toEqual([secondCase, firstCase]);
  });

  it("updates an existing case without duplicating it in the list", async () => {
    const repository = createTestRepository();
    const originalCase = createCase("case-1", { reward: "100" });
    const updatedCase = createCase("case-1", { reward: "200" });

    await repository.save(originalCase);
    await repository.save(updatedCase);

    await expect(repository.get("case-1")).resolves.toEqual(updatedCase);
    await expect(repository.list()).resolves.toEqual([updatedCase]);
  });

  it("deletes a case and removes it from the list", async () => {
    const repository = createTestRepository();
    const petCase = createCase("case-1");

    await repository.save(petCase);
    await repository.delete("case-1");

    await expect(repository.get("case-1")).resolves.toBeNull();
    await expect(repository.list()).resolves.toEqual([]);
  });

  it("validates cases with the zod schema", () => {
    const petCase = createCase("case-1");

    expect(CaseSchema.parse(petCase)).toEqual(petCase);
    expect(CaseSchema.safeParse({ ...petCase, lost_time: "not-a-date" }).success).toBe(false);
  });
});

function createTestRepository() {
  return createPetCaseRepository({
    kv: createInMemoryKvStore(),
    storage: createInMemoryFileStorage(),
  });
}

function createCase(id: string, overrides: Partial<Case> = {}): Case {
  return {
    id,
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
      country: "US",
      city: "New York",
      full_address: "123 Example St, New York, NY",
    },
    sightings: [],
    created_at: "2026-04-25T12:01:00.000Z" as Case["created_at"],
    updated_at: "2026-04-25T12:02:00.000Z" as Case["updated_at"],
    ...overrides,
  };
}
