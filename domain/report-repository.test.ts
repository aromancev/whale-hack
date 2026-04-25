import { describe, expect, it } from "vitest";
import { createInMemoryKvStore } from "@/platform/testing/in-memory-dependencies";
import { ReportRepository } from "./report-repository";
import type { Report } from "./report";

describe("ReportRepository", () => {
  it("saves and loads reports", async () => {
    const repository = new ReportRepository({ kv: createInMemoryKvStore() });
    const report = createReport("report-1");

    await repository.save(report);

    await expect(repository.get("report-1")).resolves.toEqual(report);
  });

  it("lists reports with newest first", async () => {
    const repository = new ReportRepository({ kv: createInMemoryKvStore() });

    await repository.save(createReport("report-1"));
    await repository.save(createReport("report-2"));

    await expect(repository.list()).resolves.toEqual([
      createReport("report-2"),
      createReport("report-1"),
    ]);
  });
});

function createReport(id: string): Report {
  return {
    id,
    pet: {
      species: "cat",
      breed: "siamese",
      breed_group: "slim_big_ears",
      photo_urls: [],
      color: "cream",
      collar: true,
      size: "small",
    },
    sighting: {
      place: {
        country: "nl",
        city: "Amsterdam",
      },
      time: "2026-04-25T13:00:00.000Z",
    },
  };
}
