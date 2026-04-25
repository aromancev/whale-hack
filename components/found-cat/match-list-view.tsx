"use client";

import { ArrowRight, MapPin, RotateCcw, Sparkles } from "lucide-react";
import { MatchPercent } from "./match-percent";
import type { MatchCandidate } from "./types";

export function MatchListView({
  matches,
  onOpen,
  onReset,
}: {
  matches: MatchCandidate[];
  onOpen: (caseId: string) => void;
  onReset: () => void;
}) {
  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff3df] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#7d5b43]">
        <Sparkles className="size-4" />
        {matches.length} potential matches
      </span>

      <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
        We may have found their family.
      </h1>
      <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#476a58]">
        Tap a match to see why we think it&apos;s them. The most likely match is
        on top.
      </p>

      <ul className="mt-8 space-y-3">
        {matches.map((match) => (
          <li key={match.caseId}>
            <button
              type="button"
              onClick={() => onOpen(match.caseId)}
              className="group flex w-full items-center gap-4 rounded-2xl border-2 border-[#b9dec9] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#4f9a78] hover:shadow-[0_10px_0_#9bcfb4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4f9a78]/25"
            >
              <MatchPercent percent={match.matchPercent} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xl font-black tracking-tight">
                    {match.name}
                  </span>
                  <span className="text-xs font-bold text-[#5f796b]">
                    {match.breed}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#5f796b]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {match.city}
                  </span>
                  <span>Lost {match.lostDate}</span>
                  <span>{match.color}</span>
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-[#5f796b] transition group-hover:translate-x-0.5 group-hover:text-[#4f9a78]" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onReset}
        className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#476a58] underline-offset-4 hover:underline"
      >
        <RotateCcw className="size-4" />
        Check another photo
      </button>
    </div>
  );
}
