import { CaseSchema, type Case } from "@/domain/case";
import type { Pet } from "@/domain/pets";
import { createAnthropicAiCapabilities } from "@/platform/ai";
import { fileStorage } from "@/platform/file-storage";
import { CatEnricher, EnrichSchema, NonCatImageError, type CatEnrich } from "@/service/cat-enrich";
import { casesService } from "@/service/cases";
import { z } from "zod";

const PhotoUploadSchema = z.object({
  base64Image: z.string().min(1, "Please choose a photo to upload."),
});

const enricher = new CatEnricher(createAnthropicAiCapabilities());

export async function POST(
  request: Request,
  context: RouteContext<"/api/cases/[caseId]/photo">,
) {
  const { caseId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsedBody = PhotoUploadSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      { error: formatValidationError(parsedBody.error.issues) },
      { status: 400 },
    );
  }

  const existingCase = await casesService.get(caseId);
  if (!existingCase) {
    return Response.json({ error: "Case not found." }, { status: 404 });
  }

  try {
    const image = parseBase64Image(parsedBody.data.base64Image);
    const storedPhoto = await fileStorage.put(
      `cases/${encodeURIComponent(caseId)}/photos/${crypto.randomUUID()}.${getImageExtension(image.contentType)}`,
      image.body,
      { contentType: image.contentType },
    );
    const enriched = await enricher.enrichFromImage(parsedBody.data.base64Image);
    const updatedCase = CaseSchema.parse({
      ...existingCase,
      pet: mergeEnrichedPet(existingCase.pet, enriched, storedPhoto.url),
      updated_at: new Date().toISOString(),
    });

    await casesService.save(updatedCase);

    return Response.json({ case: updatedCase });
  } catch (error) {
    if (error instanceof NonCatImageError) {
      return Response.json(
        { error: "Please upload a clear photo of your cat." },
        { status: 400 },
      );
    }

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: formatValidationError(error.issues) },
        { status: 400 },
      );
    }

    return Response.json(
      { error: "We couldn't upload and analyze this photo right now. Please try again." },
      { status: 500 },
    );
  }
}

function formatValidationError(issues: { message: string }[]) {
  const firstIssue = issues[0];

  if (!firstIssue) {
    return "Invalid photo upload.";
  }

  return firstIssue.message;
}

function mergeEnrichedPet(pet: Case["pet"], enriched: CatEnrich, photoUrl: string): Pet {
  const currentPet: Pet = pet ?? {
    species: "cat",
    breed: "",
    breed_group: "",
    photo_urls: [],
  };
  const nextPet: Pet = { ...currentPet };

  for (const key of EnrichSchema.keyof().options) {
    if (!isSet(nextPet[key]) && isSet(enriched[key])) {
      nextPet[key] = enriched[key] as never;
    }
  }

  if (!nextPet.photo_urls.includes(photoUrl)) {
    nextPet.photo_urls = [...nextPet.photo_urls, photoUrl];
  }

  return nextPet;
}

function parseBase64Image(base64Image: string) {
  const match = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  const contentType = match?.[1] ?? "image/jpeg";
  const data = match?.[2] ?? base64Image;

  return {
    body: Buffer.from(data, "base64"),
    contentType,
  };
}

function getImageExtension(contentType: string) {
  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/gif") {
    return "gif";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function isSet(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}
