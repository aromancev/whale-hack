import { SightingSchema } from "@/domain/case";
import { PetSchema } from "@/domain/pets";
import { ReportSchema } from "@/domain/report";
import { reportRepository } from "@/domain/report-repository";
import { CaseMatchSchema, casesService } from "@/service/cases";
import { z } from "zod";

const MatchRequestSchema = z.object({
  pet: PetSchema,
  sighting: SightingSchema,
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsedBody = MatchRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: "Invalid match request." }, { status: 400 });
  }

  const { pet, sighting } = parsedBody.data;

  try {
    const report = await reportRepository.save(ReportSchema.parse({ pet, sighting }));
    const matches = await casesService.matchPet(
      pet,
      sighting,
      sighting.place.country,
      sighting.place.city,
    );

    return Response.json({
      report,
      reportId: report.id,
      matches: z.array(CaseMatchSchema).parse(matches),
    });
  } catch {
    return Response.json(
      { error: "We couldn't search for matches right now. Please try again." },
      { status: 500 },
    );
  }
}
