import { Cat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Address, Case } from "@/domain/case";
import type { Pet } from "@/domain/pets";

export function ReviewStep({ petCase, pet, lostPlace }: { petCase: Case; pet: Pet; lostPlace: Address }) {
  const lostDate = petCase.lost_time ? petCase.lost_time.slice(0, 10) : "";

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#d07b47]">Preview</p>
            <h3 className="mt-1 text-3xl font-black text-[#2d251f]">
              {pet.name || "Unnamed cat"}
            </h3>
            <p className="mt-1 font-medium text-[#74675d]">
              Last seen {lostDate || "date unknown"} in {lostPlace.district || "area unknown"}{lostPlace.city ? `, ${lostPlace.city}` : ""}.
            </p>
          </div>
          <Cat className="size-10 text-[#d07b47]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Owner" items={[petCase.owner.name, petCase.owner.email, petCase.owner.phone_number ?? ""]} />
        <ReviewCard title="Pet" items={[pet.breed, pet.breed_group, pet.gender ?? "", pet.size ?? ""]} />
        <ReviewCard title="Details" items={[pet.appearance ?? "", pet.description ?? "", pet.unique_details ?? ""]} />
        <ReviewCard title="Safety" items={[pet.health_info ?? "", pet.behavior ?? ""]} />
      </div>
      <Separator className="bg-[#eadfd1]" />
      <p className="text-sm font-medium text-[#74675d]">Saved after each completed schema step.</p>
    </div>
  );
}

function ReviewCard({ title, items }: { title: string; items: string[] }) {
  const visibleItems = items.filter(Boolean);

  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
      <h4 className="font-black text-[#2d251f]">{title}</h4>
      {visibleItems.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleItems.map((item) => (
            <Badge key={item} variant="secondary" className="h-auto rounded-full bg-[#f4eee6] px-3 py-1 text-[#74675d]">
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
