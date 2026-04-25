"use client";

import { HomeButton } from "@/components/home-button";
import {
  MatchView,
  NoMatchView,
  UploadView,
  type MatchCandidate,
  type ViewState,
} from "@/components/found-cat";
import { useState } from "react";

export default function FoundCatPage() {
  const [view, setView] = useState<ViewState>("upload");
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResult(result: "no-match" | "match") {
    setError(null);

    if (result === "no-match") {
      setMatches([]);
      setView("no-match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/public-cases", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to load public cases.");
      }

      const body = (await response.json()) as { cases?: PublicCase[] };
      const nextMatches = (body.cases ?? []).map(toMatchCandidate);

      setMatches(nextMatches);
      setView(nextMatches.length > 0 ? "match" : "no-match");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load public cases.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setError(null);
    setMatches([]);
    setView("upload");
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
            <>
              <UploadView onSimulate={handleResult} />
              {isLoading ? (
                <p className="mt-4 text-sm font-bold text-[#476a58]">
                  Loading public cases...
                </p>
              ) : null}
              {error ? (
                <p className="mt-4 text-sm font-bold text-[#b23b3b]">{error}</p>
              ) : null}
            </>
          ) : view === "no-match" ? (
            <NoMatchView onReset={reset} />
          ) : (
            <MatchView matches={matches} onReset={reset} />
          )}
        </div>
      </section>
    </main>
  );
}

type PublicCase = {
  id: string;
  pet?: {
    name?: string;
    photo_urls?: string[];
    breed?: string;
    color?: string;
    appearance?: string;
    unique_details?: string;
  };
  lost_time?: string;
  lost_place?: {
    city?: string;
  };
};

function toMatchCandidate(petCase: PublicCase): MatchCandidate {
  const pet = petCase.pet;
  const city = petCase.lost_place?.city?.trim() || "Unknown location";
  const details = [pet?.appearance, pet?.unique_details]
    .map((detail) => detail?.trim())
    .filter((detail): detail is string => Boolean(detail));

  return {
    caseId: petCase.id,
    name: pet?.name?.trim() || "Missing cat",
    photoUrl: pet?.photo_urls?.[0],
    city,
    lostDate: formatLostDate(petCase.lost_time),
    breed: pet?.breed?.trim() || "Unknown breed",
    color: pet?.color?.trim() || "Unknown color",
    reasoning:
      details.length > 0
        ? details
        : [`Open public missing cat case in ${city}`],
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
