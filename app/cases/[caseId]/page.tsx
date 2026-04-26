import { notFound } from "next/navigation";

import { IntakePage } from "@/app/page";
import { OwnerCasePage } from "@/components/owner-case-page";
import { petCaseRepository } from "@/domain/case-repository";

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ step?: string | string[] }>;
}) {
  const { caseId } = await params;
  const { step } = await searchParams;
  const petCase = await petCaseRepository.get(caseId);

  if (!petCase) {
    notFound();
  }

  if (petCase.status === "created") {
    return <IntakePage initialCase={petCase} initialStep={parseStepParam(step)} />;
  }

  return <OwnerCasePage initialCase={petCase} />;
}

function parseStepParam(value?: string | string[]) {
  const step = Array.isArray(value) ? value[0] : value;
  const parsed = Number(step);

  return Number.isInteger(parsed) ? parsed : undefined;
}
