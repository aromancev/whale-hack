import { CaseMatchSchema, casesService } from "@/service/cases";
import { ReportSchema } from "@/domain/report";
import { reportRepository } from "@/domain/report-repository";
import { z } from "zod";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/reports/[reportId]">,
) {
  const { reportId } = await context.params;
  const report = await reportRepository.get(reportId);

  if (!report) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  const matches = await casesService.matchPet(
    report.pet,
    report.sighting,
    report.sighting.place.country,
    report.sighting.place.city,
  );

  return Response.json({
    report,
    matches: z.array(CaseMatchSchema).parse(matches),
  });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/reports/[reportId]">,
) {
  const { reportId } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = ReportSchema.safeParse({ ...(body as object), id: reportId });

  if (!result.success) {
    return Response.json({ error: "Invalid report." }, { status: 400 });
  }

  const report = await reportRepository.save(result.data);

  return Response.json({ report });
}
