import { CaseSchema, petCaseRepository } from "@/domain/case";

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

  const petCase = await petCaseRepository.save(result.data);

  return Response.json({ id: petCase.id });
}

function formatValidationError(issues: { path: string; message: string }[]) {
  const firstIssue = issues[0];

  if (!firstIssue) {
    return "Invalid case.";
  }

  return firstIssue.path
    ? `${firstIssue.path}: ${firstIssue.message}`
    : firstIssue.message;
}
