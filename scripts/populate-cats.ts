import { mkdir, rename, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { CaseSchema, type Address, type Case } from "@/domain/case";
import { createAnthropicAiCapabilities } from "@/platform/ai";
import { nowAsISODateTimeString } from "@/platform/time";
import { CatEnricher } from "@/service/cat-enrich";

const INPUT_FILE = resolve("data/cats.jsonl");
const OUTPUT_FILE = resolve("data/cases.jsonl");
const MAX_RECORDS = 50;
const DEFAULT_COUNTRY = "nl";
const DEFAULT_CITY = "Amsterdam";

const MOCK_OWNER_NAMES = [
  "Sanne de Vries",
  "Jasper van Leeuwen",
  "Noor Bakker",
  "Mila Smit",
  "Tijn Visser",
  "Lotte Meijer",
];
const MOCK_STREETS = [
  "Prinsengracht",
  "Rozengracht",
  "Overtoom",
  "Javastraat",
  "Ceintuurbaan",
  "Wibautstraat",
];
const MOCK_POSTAL_CODES = ["1015AA", "1017HL", "1054ET", "1094HA", "1072GN", "1091GH"];
const MOCK_DISTRICTS = ["Centrum", "Jordaan", "De Pijp", "Oost", "West", "Zuid"];
const MOCK_REGIONS = ["Noord-Holland"];
const MOCK_COORDINATES = [
  { latitude: 52.3731, longitude: 4.8922 },
  { latitude: 52.3676, longitude: 4.9041 },
  { latitude: 52.3547, longitude: 4.8945 },
  { latitude: 52.3609, longitude: 4.9297 },
  { latitude: 52.3702, longitude: 4.8486 },
];
const MOCK_PET_NAMES = ["Miso", "Pip", "Nori", "Pixel", "Muffin", "Bram"];
const MOCK_APPEARANCES = [
  "Alert cat with a compact build and expressive eyes.",
  "Slim cat with a neat coat and distinctive facial markings.",
  "Medium-sized cat with a calm posture and tidy fur.",
  "Curious-looking cat with a balanced frame and bright eyes.",
];
const MOCK_DESCRIPTIONS = [
  "Often seen exploring nearby gardens and quiet residential streets.",
  "Usually stays close to home but can hide in sheltered outdoor spaces.",
  "Friendly with familiar people and tends to respond to soft voices.",
  "May be cautious around strangers and loud traffic.",
];
const MOCK_HEALTH_INFO = [
  "No known medical conditions.",
  "Needs regular meals and access to fresh water.",
  "Indoor-outdoor cat with no reported medication needs.",
  "Generally healthy but can be stressed in unfamiliar places.",
];
const MOCK_BEHAVIORS = [
  "Shy around strangers but food-motivated.",
  "Usually approachable after a few minutes.",
  "Can hide under cars, bushes, or stairwells.",
  "Responds best to calm voices and slow movements.",
];
const MOCK_REWARDS = [undefined, undefined, undefined, "50", "100", "150"];

const enricher = new CatEnricher(createAnthropicAiCapabilities());

async function main() {
  const input = await readFile(INPUT_FILE, "utf8");
  const records = parseJsonLines(input).slice(0, MAX_RECORDS);
  const cases: Case[] = [];

  for (const [index, record] of records.entries()) {
    console.log(`Processing ${index + 1}/${records.length}`);

    const base64Image = await downloadImageAsBase64(record.image_url);
    const enriched = await enricher.enrichFromImage(base64Image);
    const petCase = CaseSchema.parse(toCase(record, enriched));

    cases.push(petCase);
  }

  const contents = cases.map((petCase) => JSON.stringify(petCase)).join("\n");
  const tmpFile = `${OUTPUT_FILE}.tmp`;

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(tmpFile, contents ? `${contents}\n` : "");
  await rename(tmpFile, OUTPUT_FILE);

  console.log(`Wrote ${cases.length} records to ${OUTPUT_FILE}`);
}

function parseJsonLines(contents: string): Array<Record<string, unknown>> {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch (error) {
        throw new Error(`Invalid JSON on line ${index + 1}: ${getErrorMessage(error)}`);
      }
    });
}

async function downloadImageAsBase64(imageUrl: unknown) {
  if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
    throw new Error("Missing image_url in source record");
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

function toCase(record: Record<string, unknown>, enriched: Record<string, unknown>): Case {
  const createdAt = nowAsISODateTimeString();
  const updatedAt = createdAt;
  const lostTime = createdAt;
  const ageYears = pick([1, 2, 3, 5, 7, 10]);

  return {
    id: randomUUID(),
    status: "open",
    owner: {
      name: pick(MOCK_OWNER_NAMES),
      email: toMockEmail(randomUUID()),
      phone_number: randomPhoneNumber(),
    },
    pet: {
      species: "cat",
      breed: toRequiredString(enriched.breed, "enriched.breed"),
      breed_group: toRequiredString(enriched.breed_group, "enriched.breed_group"),
      photo_urls: [toRequiredString(record.image_url, "record.image_url")],
      gender: pick(["male", "female"]),
      age_years: ageYears,
      age_group: toAgeGroupFromEnriched(enriched.age_group) ?? toAgeGroup(ageYears) ?? pick(["young", "adult", "senior"]),
      name: pick(MOCK_PET_NAMES),
      appearance: buildAppearance(enriched) ?? pick(MOCK_APPEARANCES),
      description: pick(MOCK_DESCRIPTIONS),
      health_info: pick(MOCK_HEALTH_INFO),
      behavior: pick(MOCK_BEHAVIORS),
      unique_details: toNonEmptyString(enriched.unique_details) ?? pick(MOCK_DESCRIPTIONS),
      chipped: pick([true, false]),
      chip_number: randomChipNumber(),
      color: toNonEmptyString(enriched.color) ?? pick(["black", "gray", "orange_tabby", "tabby_and_white", "calico"]),
      collar: toBoolean(enriched.collar) ?? pick([true, false]),
      size: toSize(enriched.size) ?? pick(["small", "medium", "large"]),
    },
    lost_time: lostTime,
    lost_place: createMockAmsterdamAddress(),
    sightings: [],
    created_at: createdAt,
    updated_at: updatedAt,
    reward: pick(MOCK_REWARDS),
  };
}

function createMockAmsterdamAddress(): Address {
  const street = pick(MOCK_STREETS);
  const houseNumber = String(pick([3, 7, 12, 18, 24, 41]));
  const postalCode = pick(MOCK_POSTAL_CODES);

  return {
    country: DEFAULT_COUNTRY,
    city: DEFAULT_CITY,
    region: pick(MOCK_REGIONS),
    district: pick(MOCK_DISTRICTS),
    street,
    house_number: houseNumber,
    postal_code: postalCode,
    full_address: `${street} ${houseNumber}, ${postalCode}, ${DEFAULT_CITY}`,
    coordinates: pick(MOCK_COORDINATES),
  };
}

function buildAppearance(enriched: Record<string, unknown>) {
  const enrichedColor = toNonEmptyString(enriched.color);
  const size = toSize(enriched.size);
  const parts = [enrichedColor, size].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function toAgeGroup(ageYears: number | undefined) {
  if (ageYears === undefined) {
    return undefined;
  }

  if (ageYears < 1) {
    return "young" as const;
  }

  if (ageYears < 8) {
    return "adult" as const;
  }

  return "senior" as const;
}

function toAgeGroupFromEnriched(value: unknown) {
  return value === "young" || value === "adult" || value === "senior" ? value : undefined;
}

function toBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function toSize(value: unknown) {
  return value === "small" || value === "medium" || value === "large" ? value : undefined;
}

function toNonEmptyString(value: unknown, key?: string) {
  const candidate = key && isRecord(value) ? value[key] : value;
  return typeof candidate === "string" && candidate.trim() !== "" ? candidate.trim() : undefined;
}

function toRequiredString(value: unknown, field: string) {
  const result = toNonEmptyString(value);
  if (!result) {
    throw new Error(`Missing required ${field}`);
  }
  return result;
}

function toMockEmail(seed: string) {
  const normalized = seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${normalized || "cat-owner"}@example.com`;
}

function randomPhoneNumber() {
  return pick([
    "+31610101010",
    "+31620202020",
    "+31630303030",
    "+31640404040",
    "+31650505050",
  ]);
}

function randomChipNumber() {
  return `5281${Math.floor(Math.random() * 10_000_000_000)
    .toString()
    .padStart(10, "0")}`;
}

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
