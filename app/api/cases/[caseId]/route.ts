import { casesService } from "@/service/cases";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/cases/[caseId]">,
) {
  const { caseId } = await context.params;
  const petCase = await casesService.get(caseId);

  if (!petCase) {
    return Response.json({ error: "Case not found." }, { status: 404 });
  }

  return Response.json({ case: petCase });
}
