export type ResultState = "no-match" | "match";
export type ViewState = "upload" | ResultState;

export type MatchCandidate = {
  caseId: string;
  name: string;
  matchPercent: number;
  city: string;
  lostDate: string;
  breed: string;
  color: string;
  reasoning: string[];
};
