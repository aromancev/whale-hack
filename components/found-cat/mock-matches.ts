import type { MatchCandidate } from "./types";

export const MOCK_MATCHES: MatchCandidate[] = [
  {
    caseId: "demo-mochi",
    name: "Mochi",
    matchPercent: 92,
    city: "Tel Aviv",
    lostDate: "Apr 21, 2026",
    breed: "Domestic shorthair",
    color: "Tabby & white",
    reasoning: [
      "Coat color and tabby pattern match closely",
      "Same body build and ear shape",
      "Reported missing 4 km away two days ago",
    ],
  },
  {
    caseId: "demo-luna",
    name: "Luna",
    matchPercent: 78,
    city: "Tel Aviv",
    lostDate: "Apr 18, 2026",
    breed: "Domestic shorthair",
    color: "Gray tabby",
    reasoning: [
      "Similar gray tabby coat",
      "Matching white chest marking",
      "Reported missing in nearby neighborhood",
    ],
  },
  {
    caseId: "demo-pixel",
    name: "Pixel",
    matchPercent: 64,
    city: "Ramat Gan",
    lostDate: "Apr 14, 2026",
    breed: "Mixed",
    color: "Brown tabby",
    reasoning: [
      "Comparable size and age range",
      "Coat pattern partially overlaps",
      "Reported missing within 8 km",
    ],
  },
];
