import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pet } from "@/domain/pets";
import { XIcon } from "lucide-react";

import { Field, OptionGroup, TwoColumnFields } from "./fields";
import type { FieldErrorKey, UpdatePet } from "./types";

export function CatBasicsStep({
  pet,
  fieldErrors,
  genderOptions,
  selectedBreedLabel,
  breedSearch,
  visibleBreedOptions,
  isUnknownBreed,
  updatePet,
  updateBreed,
  updateBreedSearch,
  updateUnknownBreed,
}: {
  pet: Pet;
  fieldErrors: Partial<Record<FieldErrorKey, string>>;
  genderOptions: NonNullable<Pet["gender"]>[];
  selectedBreedLabel: string | null;
  breedSearch: string;
  visibleBreedOptions: { value: string; label: string }[];
  isUnknownBreed: boolean;
  updatePet: UpdatePet;
  updateBreed: (value: string | null) => void;
  updateBreedSearch: (value: string) => void;
  updateUnknownBreed: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <TwoColumnFields>
        <Field label="Cat name" required error={fieldErrors["pet.name"]}>
          <Input value={pet.name ?? ""} onChange={(event) => updatePet("name", event.target.value)} placeholder="Miso" aria-invalid={Boolean(fieldErrors["pet.name"])} />
        </Field>
        <Field label="Gender" required error={fieldErrors["pet.gender"]}>
          <OptionGroup options={genderOptions} value={pet.gender ?? ""} onSelect={(value) => updatePet("gender", value as Pet["gender"])} />
        </Field>
      </TwoColumnFields>
      <Field label="Breed">
        <Select value={selectedBreedLabel} onValueChange={updateBreed}>
          <SelectTrigger className="h-12 w-full rounded-full border-0 bg-white px-4 py-2 text-base font-medium text-[#2d251f] shadow-sm" disabled={isUnknownBreed}>
            <SelectValue placeholder="Search breed, e.g. Siamese" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="h-72 max-h-72 rounded-[1.25rem] bg-white p-2">
            <div className="sticky top-0 z-10 bg-white p-1">
              <div className="relative">
                <Input
                  value={breedSearch}
                  onChange={(event) => updateBreedSearch(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder="Search breed"
                  className="pr-11"
                />
                {breedSearch ? (
                  <button
                    type="button"
                    aria-label="Clear breed search"
                    className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#74675d] transition-colors hover:bg-[#f4ece5] hover:text-[#2d251f] focus-visible:ring-3 focus-visible:ring-[#f8c8a7]/60 focus-visible:outline-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => updateBreedSearch("")}
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
            {visibleBreedOptions.length ? (
              visibleBreedOptions.map((breed) => (
                <SelectItem key={breed.value} value={breed.label} className="rounded-xl px-3 py-2 text-[#2d251f]">
                  {breed.label}
                </SelectItem>
              ))
            ) : (
              <p className="px-3 py-2 text-sm font-medium text-[#74675d]">No breeds found.</p>
            )}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#74675d]">
          <Checkbox checked={isUnknownBreed} onCheckedChange={(checked) => updateUnknownBreed(checked === true)} />
          I don&apos;t know
        </label>
      </Field>
    </div>
  );
}
