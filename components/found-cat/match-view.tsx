"use client";

import { useState } from "react";
import { MatchDetailView } from "./match-detail-view";
import { MatchListView } from "./match-list-view";
import type { MatchCandidate } from "./types";

export function MatchView({
  matches,
  onReset,
}: {
  matches: MatchCandidate[];
  onReset: () => void;
}) {
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const openMatch =
    matches.find((match) => match.caseId === openCaseId) ?? null;

  if (openMatch) {
    return (
      <MatchDetailView match={openMatch} onBack={() => setOpenCaseId(null)} />
    );
  }

  return (
    <MatchListView
      matches={matches}
      onOpen={(caseId) => setOpenCaseId(caseId)}
      onReset={onReset}
    />
  );
}
