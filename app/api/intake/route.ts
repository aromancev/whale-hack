import { CaseSchema } from "@/domain/case";
import { casesService } from "@/service/cases";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = CaseSchema.safeParse(body);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return Response.json(
      {
        error: formatValidationError(issues),
        issues,
      },
      { status: 400 },
    );
  }

  const petCase = await casesService.save(result.data);

  return Response.json({ case: petCase });
}

function formatValidationError(issues: { path: string; message: string }[]) {
  const firstIssue = issues[0];

  if (!firstIssue) {
    return "Invalid case.";
  }

  return formatIssueMessage(firstIssue.path, firstIssue.message);
}

function formatIssueMessage(path: string, message: string) {
  const label = fieldLabels[path];

  if (message === "Invalid input" && label) {
    return `Please check ${label}.`;
  }

  return label ? `${label}: ${message}` : message;
}

const fieldLabels: Record<string, string> = {
  "owner.name": "owner name",
  "owner.email": "owner email",
  "pet.name": "cat name",
  "pet.gender": "cat gender",
  "pet.breed": "cat breed",
  "pet.breed_group": "cat breed group",
  "pet.photo_urls": "cat photos",
  lost_time: "last-seen date",
  "lost_place.country": "country",
  "lost_place.city": "city",
  "lost_place.coordinates.latitude": "map latitude",
  "lost_place.coordinates.longitude": "map longitude",
  status: "case status",
  reward: "reward",
};
