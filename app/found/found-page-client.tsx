"use client";

import { HomeButton } from "@/components/home-button";
import {
  FoundDetailsForm,
  MatchView,
  NoMatchView,
  UploadView,
  type MatchCandidate,
  type ViewState,
} from "@/components/found-cat";
import type { FoundPetFormValues } from "@/components/found-cat";
import type { Report } from "@/domain/report";
import type { CaseMatch } from "@/service/cases";
import { useState } from "react";

export function FoundPageClient({
  initialReport,
  initialMatches = [],
}: {
  initialReport?: Report;
  initialMatches?: CaseMatch[];
}) {
  const initialMatchCandidates = initialMatches
    .filter((match) => match.score > 0)
    .map(toMatchCandidate);
  const [view, setView] = useState<ViewState>(
    initialReport
      ? initialMatchCandidates.length > 0
        ? "match"
        : "no-match"
      : "upload",
  );
  const [matches, setMatches] = useState<MatchCandidate[]>(initialMatchCandidates);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FoundPetFormValues>(
    initialReport ? createFormValuesFromReport(initialReport) : createEmptyFormValues(),
  );

  async function handleUpload(file: File) {
    setError(null);
    setIsLoading(true);

    try {
      const photoDataUrl = await readFileAsDataUrl(file);
      const response = await fetch("/api/found/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: photoDataUrl }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to analyze that photo."));
      }

      const body = (await response.json()) as { enriched?: EnrichedPetFields };
      setFormValues(createFormValues(body.enriched, photoDataUrl));
      setView("details");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to analyze that photo.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);

    if (!formValues.foundAt || !formValues.city.trim()) {
      setError("Please tell us when and where you found the pet.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/found/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet: toPetPayload(formValues),
          sighting: toSightingPayload(formValues),
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to search for matches."));
      }

      const body = (await response.json()) as {
        report?: Report;
        reportId?: string;
        matches?: CaseMatch[];
      };
      const nextMatches = (body.matches ?? [])
        .filter((match) => match.score > 0)
        .map(toMatchCandidate);

      if (body.reportId) {
        rewriteToFoundReportUrl(body.reportId);
      }

      if (body.report) {
        setFormValues(createFormValuesFromReport(body.report, formValues.photoDataUrl));
      }

      setMatches(nextMatches);
      setView(nextMatches.length > 0 ? "match" : "no-match");
    } catch (matchError) {
      setError(
        matchError instanceof Error
          ? matchError.message
          : "Unable to search for matches.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateFormValue<Key extends keyof FoundPetFormValues>(
    key: Key,
    value: FoundPetFormValues[Key],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setError(null);
    setMatches([]);
    setFormValues(createEmptyFormValues());
    setView("upload");
    rewriteToFoundUrl();
  }

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-[#effff6] px-4 py-6 text-[#20362b] sm:px-8 sm:py-10">
      <div className="absolute -left-24 top-10 size-72 rounded-full bg-[#bfe8d5]/80 blur-3xl" />
      <div className="absolute right-0 top-24 size-80 rounded-full bg-[#ffe6a8]/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[#f8c8a7]/50 blur-3xl" />

      <HomeButton className="text-[#476a58] ring-[#b9dec9] focus-visible:ring-[#4f9a78]/30" />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col justify-center py-8 sm:py-16">
        <div
          className="rounded-[2rem] border-2 border-[#4f9a78] bg-white/85 p-6 shadow-[0_18px_0_#9bcfb4] sm:p-8"
          aria-live="polite"
        >
          {view === "upload" ? (
            <UploadView isUploading={isLoading} onUpload={handleUpload} />
          ) : view === "details" ? (
            <FoundDetailsForm
              values={formValues}
              isSubmitting={isLoading}
              onChange={updateFormValue}
              onReset={reset}
              onSubmit={handleSubmit}
            />
          ) : view === "no-match" ? (
            <NoMatchView onReset={reset} />
          ) : (
            <MatchView matches={matches} onReset={reset} />
          )}
          {error ? (
            <p className="mt-4 text-sm font-bold text-[#b23b3b]">{error}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

type EnrichedPetFields = {
  breed?: string;
  breed_group?: string;
  color?: string;
  unique_details?: string;
  age_group?: FoundPetFormValues["age_group"];
  collar?: boolean;
  size?: FoundPetFormValues["size"];
};

function createFormValues(
  enriched: EnrichedPetFields | undefined,
  photoDataUrl: string,
): FoundPetFormValues {
  return {
    ...createEmptyFormValues(),
    photoDataUrl,
    breed: enriched?.breed ?? "",
    breed_group: enriched?.breed_group ?? "",
    color: enriched?.color ?? "",
    unique_details: enriched?.unique_details ?? "",
    age_group: enriched?.age_group ?? "",
    collar: booleanToCollarValue(enriched?.collar),
    size: enriched?.size ?? "",
  };
}

function createFormValuesFromReport(
  report: Report,
  photoDataUrl = "",
): FoundPetFormValues {
  return {
    photoDataUrl,
    breed: report.pet.breed,
    breed_group: report.pet.breed_group,
    color: report.pet.color ?? "",
    unique_details: report.pet.unique_details ?? "",
    age_group: report.pet.age_group ?? "",
    collar: booleanToCollarValue(report.pet.collar),
    size: report.pet.size ?? "",
    foundAt: toDateTimeLocalInput(report.sighting.time),
    city: report.sighting.place.city,
    district: report.sighting.place.district ?? "",
    fullAddress: report.sighting.place.full_address ?? "",
  };
}

function createEmptyFormValues(): FoundPetFormValues {
  return {
    photoDataUrl: "",
    breed: "",
    breed_group: "",
    color: "",
    unique_details: "",
    age_group: "",
    collar: "unknown",
    size: "",
    foundAt: "",
    city: "",
    district: "",
    fullAddress: "",
  };
}

function toPetPayload(values: FoundPetFormValues) {
  return {
    species: "cat" as const,
    breed: values.breed.trim(),
    breed_group: values.breed_group.trim(),
    photo_urls: [],
    color: optionalString(values.color),
    unique_details: optionalString(values.unique_details),
    age_group: values.age_group || undefined,
    collar: collarValueToBoolean(values.collar),
    size: values.size || undefined,
  };
}

function toSightingPayload(values: FoundPetFormValues) {
  return {
    place: {
      country: "nl" as const,
      city: values.city.trim(),
      district: optionalString(values.district),
      full_address: optionalString(values.fullAddress),
    },
    time: new Date(values.foundAt).toISOString(),
  };
}

function toMatchCandidate(match: CaseMatch): MatchCandidate {
  const pet = match.case.pet;
  const city = match.case.lost_place?.city?.trim() || "Unknown location";

  return {
    caseId: match.case.id,
    name: pet?.name?.trim() || "Missing cat",
    photoUrl: pet?.photo_urls?.[0],
    city,
    lostDate: formatLostDate(match.case.lost_time),
    breed: formatLabel(pet?.breed) || "Unknown breed",
    color: formatLabel(pet?.color) || "Unknown color",
    score: match.score,
    reasoning: match.reasons.length > 0 ? match.reasons : [`Open public missing cat case in ${city}`],
  };
}

function formatLostDate(value?: string) {
  if (!value) {
    return "unknown date";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function toDateTimeLocalInput(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function booleanToCollarValue(value?: boolean): FoundPetFormValues["collar"] {
  if (value === true) {
    return "yes";
  }

  if (value === false) {
    return "no";
  }

  return "unknown";
}

function collarValueToBoolean(value: FoundPetFormValues["collar"]) {
  if (value === "yes") {
    return true;
  }

  if (value === "no") {
    return false;
  }

  return undefined;
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatLabel(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read photo."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read photo.")));
    reader.readAsDataURL(file);
  });
}

function rewriteToFoundReportUrl(reportId: string) {
  window.history.replaceState(null, "", `/found/${encodeURIComponent(reportId)}`);
}

function rewriteToFoundUrl() {
  window.history.replaceState(null, "", "/found");
}
