export type ResultState = "no-match" | "match";
export type ViewState = "upload" | "details" | ResultState;

export type FoundPetFormValues = {
  photoDataUrl: string;
  breed: string;
  breed_group: string;
  color: string;
  unique_details: string;
  age_group: "" | "young" | "adult" | "senior";
  collar: "unknown" | "yes" | "no";
  size: "" | "small" | "medium" | "large";
  foundAt: string;
  city: string;
  district: string;
  fullAddress: string;
};

export type MatchCandidate = {
  caseId: string;
  name: string;
  photoUrl?: string;
  city: string;
  lostDate: string;
  breed: string;
  color: string;
  score: number;
  reasoning: string[];
};
