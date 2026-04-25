import { describe, expect, it } from "vitest";
import {
  createInMemoryFileStorage,
  createInMemoryKvStore,
} from "@/platform/testing/in-memory-dependencies";
import { CaseSchema, type Case } from "./case";
import { PetCaseRepository } from "./case-repository";

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

  it("returns an empty collection when no cases are added", async () => {
    const repository = createTestRepository();

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual([]);
  });

  it("adds case ids to a country and city collection", async () => {
    const repository = createTestRepository();

    await repository.addCaseToCollection("nl", "Amsterdam", "case-1");
    await repository.addCaseToCollection("nl", "Amsterdam", "case-2");

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual(
      expect.arrayContaining(["case-1", "case-2"]),
    );
    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toHaveLength(2);
  });

  it("does not duplicate case ids in a collection", async () => {
    const repository = createTestRepository();

    await repository.addCaseToCollection("nl", "Amsterdam", "case-1");
    await repository.addCaseToCollection("nl", "Amsterdam", "case-2");
    await repository.addCaseToCollection("nl", "Amsterdam", "case-1");

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual(
      expect.arrayContaining(["case-1", "case-2"]),
    );
    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toHaveLength(2);
  });

  it("removes case ids from a country and city collection", async () => {
    const repository = createTestRepository();

    await repository.addCaseToCollection("nl", "Amsterdam", "case-1");
    await repository.addCaseToCollection("nl", "Amsterdam", "case-2");
    await repository.removeCaseFromCollection("nl", "Amsterdam", "case-1");

    await expect(repository.getCollection("nl", "Amsterdam")).resolves.toEqual(["case-2"]);
  });

  it("loads multiple cases in one batched read", async () => {
    const repository = createTestRepository();
    const firstCase = createCase("case-1");
    const secondCase = createCase("case-2");

    await repository.save(firstCase);
    await repository.save(secondCase);

    await expect(repository.getMany(["case-1", "case-2"])).resolves.toEqual([firstCase, secondCase]);
  });

  it("validates cases with the zod schema", () => {
    const petCase = createCase("case-1");

    expect(CaseSchema.parse(petCase)).toEqual(petCase);
    expect(CaseSchema.safeParse({ ...petCase, lost_time: "not-a-date" }).success).toBe(false);
  });

  it("normalizes country values when parsing cases", () => {
    const petCase = {
      ...createCase("case-1"),
      lost_place: {
        country: " NL ",
        city: "Amsterdam",
      },
    };

    expect(CaseSchema.parse(petCase).lost_place?.country).toBe("nl");
  });

  it("generates a default id when one is not provided", () => {
    const petCaseWithoutId: Partial<Case> = createCase("case-1");
    delete petCaseWithoutId.id;

    expect(CaseSchema.parse(petCaseWithoutId).id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("accepts draft pet details before gender is selected", () => {
    const petCase = {
      ...createCase("case-1"),
      pet: {
        species: "cat",
        breed: "",
        breed_group: "",
        photo_urls: [],
        gender: "",
      },
    };

    expect(CaseSchema.parse(petCase).pet?.gender).toBeUndefined();
  });
});

function createTestRepository() {
  return new PetCaseRepository({
    kv: createInMemoryKvStore(),
    storage: createInMemoryFileStorage(),
  });
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
