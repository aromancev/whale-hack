import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAnthropicAiCapabilities } from "@/platform/ai";
import { CatEnricher, EnrichSchema } from "./cat-enrich";

describe("CatEnricher", () => {
  it("enriches a cat from an image with real AI", { tags: ["external"], timeout: 30_000 }, async () => {
    const ai = createAnthropicAiCapabilities({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 512,
    });
    const enricher = new CatEnricher(ai);

    const result = await enricher.enrichFromImage(readExamplePetImage());

    console.info(result);
    expect(EnrichSchema.safeParse(result).success).toBe(true);
    expect(result.description).toEqual(expect.any(String));
  });
});

function readExamplePetImage() {
  const aiTestPath = new URL("../platform/ai.test.ts", import.meta.url);
  const aiTest = readFileSync(aiTestPath, "utf8");
  const match = aiTest.match(/const base64Image = "([^"]+)";/);

  if (!match) {
    throw new Error("Could not read example pet image from platform/ai.test.ts");
  }

  return match[1];
}
