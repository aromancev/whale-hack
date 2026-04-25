import type { MatchCandidate } from "./types";

export const MOCK_MATCHES: MatchCandidate[] = [
  {
    caseId: "b9da1c91-be03-4475-828c-87d253906ac1",
    name: "Mis",
    photoUrl:
      "/uploads/cases/b9da1c91-be03-4475-828c-87d253906ac1/photos/4ebbc9da-8abe-44b2-bb0a-dd54c450f361.jpg",
    matchPercent: 92,
    city: "Duiv",
    lostDate: "Apr 23, 2026",
    breed: "Bengal",
    color: "Brown spotted",
    reasoning: [
      "Distinctive spotted and marbled coat pattern matches closely",
      "Athletic build and green eyes are consistent with the missing report",
      "Reported missing nearby on Apr 23",
    ],
  },
  {
    caseId: "demo-luna",
    name: "Luna",
    photoUrl:
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=500&q=80",
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
