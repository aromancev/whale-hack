import { notFound } from "next/navigation";

import { IntakePage } from "@/app/page";
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

  return <IntakePage initialCase={petCase} initialStep={parseStepParam(step)} />;
}

function parseStepParam(value?: string | string[]) {
  const step = Array.isArray(value) ? value[0] : value;
  const parsed = Number(step);

  return Number.isInteger(parsed) ? parsed : undefined;
}
