import { reportRepository } from "@/domain/report-repository";
import { casesService } from "@/service/cases";
import { notFound } from "next/navigation";
import { FoundPageClient } from "../found-page-client";

export default async function FoundReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = await reportRepository.get(reportId);

  if (!report) {
    notFound();
  }

  const matches = await casesService.matchPet(
    report.pet,
    report.sighting,
    report.sighting.place.country,
    report.sighting.place.city,
  );

  return (
    <FoundPageClient
      initialReport={report}
      initialMatches={matches}
    />
  );
}
