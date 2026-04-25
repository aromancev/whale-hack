"use client";

import { MatchListView } from "./match-list-view";
import type { MatchCandidate } from "./types";

export function MatchView({
  matches,
  onReset,
}: {
  matches: MatchCandidate[];
  onReset: () => void;
}) {
  return <MatchListView matches={matches} onReset={onReset} />;
}
