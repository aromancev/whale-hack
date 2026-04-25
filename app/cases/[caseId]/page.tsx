import { notFound } from "next/navigation";

import { IntakePage } from "@/app/page";
import { petCaseRepository } from "@/domain/case-repository";

export default async function CasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const petCase = await petCaseRepository.get(caseId);

  if (!petCase) {
    notFound();
  }

  return <IntakePage initialCase={petCase} />;
}
