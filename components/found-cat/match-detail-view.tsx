"use client";

import { ArrowRight, ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { MatchPhoto } from "./match-photo";
import { MatchPercent } from "./match-percent";
import type { MatchCandidate } from "./types";

export function MatchDetailView({
  match,
  onBack,
}: {
  match: MatchCandidate;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-black text-[#476a58] hover:text-[#245643]"
      >
        <ChevronLeft className="size-4" />
        Back to matches
      </button>

      {match.photoUrl ? (
        <div className="mt-5">
          <MatchPhoto name={match.name} photoUrl={match.photoUrl} size="lg" />
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-4">
        <MatchPercent percent={match.matchPercent} size="lg" />
        <div>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            {match.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-[#5f796b]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {match.city}
            </span>
            <span>Lost {match.lostDate}</span>
          </div>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Breed" value={match.breed} />
        <Field label="Color" value={match.color} />
      </dl>

      <div className="mt-7 rounded-2xl bg-[#f3fbf5] p-5">
        <p className="text-xs font-black uppercase tracking-wide text-[#245643]">
          Why we think it&apos;s a match
        </p>
        <ul className="mt-3 space-y-2">
          {match.reasoning.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#20362b]"
            >
              <span className="mt-1 inline-flex size-2 shrink-0 rounded-full bg-[#4f9a78]" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={`/public-case/${encodeURIComponent(match.caseId)}`}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e58d57] px-6 py-3 text-base font-black text-white shadow-[0_8px_0_#c0723f] transition hover:-translate-y-0.5 hover:bg-[#d97f47] hover:shadow-[0_10px_0_#a45d33] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e58d57]/30"
      >
        This is the pet
        <ArrowRight className="size-5" />
      </Link>
      <p className="mt-3 text-center text-xs font-semibold text-[#5f796b]">
        Confirming opens the public case so you can contact the owner.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dceadf] bg-white p-3">
      <dt className="text-[10px] font-black uppercase tracking-wide text-[#5f796b]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-bold text-[#20362b]">{value}</dd>
    </div>
  );
}
