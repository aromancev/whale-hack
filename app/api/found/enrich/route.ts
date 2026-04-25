import { createAnthropicAiCapabilities } from "@/platform/ai";
import { CatEnricher } from "@/service/cat-enrich";
import { z } from "zod";

const EnrichRequestSchema = z.object({
  base64Image: z.string().min(1),
});

const enricher = new CatEnricher(createAnthropicAiCapabilities());

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsedBody = EnrichRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: "Invalid photo upload." }, { status: 400 });
  }

  try {
    const enriched = await enricher.enrichFromImage(parsedBody.data.base64Image);

    return Response.json({ enriched });
  } catch {
    return Response.json(
      { error: "We couldn't analyze that photo right now. Please try again." },
      { status: 500 },
    );
  }
}
