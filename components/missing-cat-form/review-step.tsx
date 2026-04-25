import { Cat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Address, Case } from "@/domain/case";
import type { Pet } from "@/domain/pets";

export function ReviewStep({ petCase, pet, lostPlace }: { petCase: Case; pet: Pet; lostPlace: Address }) {
  const lostDate = petCase.lost_time ? petCase.lost_time.slice(0, 10) : "";
  const lostArea = `${lostPlace.district || "area unknown"}${lostPlace.city ? `, ${lostPlace.city}` : ""}`;
  const photoUrl = pet.photo_urls[0];

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="mt-1 text-3xl font-black text-[#2d251f]">
              {pet.name || "Unnamed cat"}
            </h3>
            <div className="mt-2 space-y-1 font-medium text-[#74675d]">
              <p>Last seen: {lostDate || "date unknown"}</p>
              <p>{lostArea}</p>
            </div>
          </div>
          {photoUrl ? (
            <div
              role="img"
              aria-label={pet.name ? `${pet.name} photo` : "Cat photo"}
              className="size-16 shrink-0 rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(${photoUrl})` }}
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[#f4eee6] text-[#d07b47]">
              <Cat className="size-8" />
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Owner" items={[petCase.owner.name, petCase.owner.email, petCase.owner.phone_number ?? ""]} />
        <ReviewCard title="Pet" items={[formatCatValue(pet.breed), pet.gender ? formatCatValue(pet.gender) : "", pet.size ? formatCatValue(pet.size) : "", formatAge(pet)]} />
        <ReviewCard title="Appearance" items={[pet.color ? formatCatValue(pet.color) : "", formatCollar(pet.collar), pet.unique_details ?? ""]} />
        <ReviewCard title="Other info" items={[formatTaggedInfo("Reward", petCase.reward), formatTaggedInfo("Health", pet.health_info), formatTaggedInfo("Behavior", pet.behavior)]} />
      </div>
    </div>
  );
}

function formatCatValue(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAge(pet: Pet) {
  const ageYears = pet.age_years === undefined ? "" : `${pet.age_years} ${pet.age_years === 1 ? "year" : "years"} old`;
  const ageGroup = pet.age_group ? formatCatValue(pet.age_group) : "";

  if (ageYears && ageGroup) {
    return `${ageYears} (${ageGroup})`;
  }

  return ageYears || ageGroup;
}

function formatCollar(collar: Pet["collar"]) {
  if (collar === undefined) {
    return "";
  }

  return collar ? "Wearing collar" : "No collar";
}

function formatTaggedInfo(label: string, value: string | undefined) {
  return value ? `${label}: ${value}` : "";
}

function ReviewCard({ title, items }: { title: string; items: string[] }) {
  const visibleItems = items.filter(Boolean);

  return (
    <div className="min-w-0 rounded-[1.5rem] bg-white p-4 shadow-sm">
      <h4 className="font-black text-[#2d251f]">{title}</h4>
      {visibleItems.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleItems.map((item) => (
            <Badge key={item} variant="secondary" className="h-auto max-w-full whitespace-normal break-words rounded-full bg-[#f4eee6] px-3 py-1 text-[#74675d]">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[#74675d]">Empty.</p>
      )}
    </div>
  );
}
