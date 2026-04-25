import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CaseSchema } from "@/domain/case";
import { closeRedisClient } from "@/platform/kv-store";
import { casesService } from "@/service/cases";

const DEFAULT_INPUT_FILE = resolve("data/cases.jsonl");

async function main() {
  const inputFile = resolve(process.argv[2] ?? DEFAULT_INPUT_FILE);
  const contents = await readFile(inputFile, "utf8");
  const records = parseJsonLines(contents);

  for (const [index, record] of records.entries()) {
    const petCase = CaseSchema.parse(record);
    await casesService.save(petCase);
    console.log(`Imported ${index + 1}/${records.length}: ${petCase.id}`);
  }

  console.log(`Imported ${records.length} cases from ${inputFile}`);
}

function parseJsonLines(contents: string): unknown[] {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSON on line ${index + 1}: ${getErrorMessage(error)}`);
      }
    });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeRedisClient();
  });
