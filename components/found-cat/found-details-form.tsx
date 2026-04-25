"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAT_BREEDS_BY_GROUP, CAT_COLORS } from "@/domain/cats";
import { RotateCcw, Search, Sparkles, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { FoundPetFormValues } from "./types";

const breedOptions = Object.values(CAT_BREEDS_BY_GROUP)
  .flat()
  .map((breed) => ({ value: breed, label: formatLabel(breed) }));
const colorOptions = CAT_COLORS.map((color) => ({ value: color, label: formatLabel(color) }));
const sizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];
const collarOptions = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function FoundDetailsForm({
  values,
  isSubmitting,
  onChange,
  onReset,
  onSubmit,
}: {
  values: FoundPetFormValues;
  isSubmitting: boolean;
  onChange: <Key extends keyof FoundPetFormValues>(key: Key, value: FoundPetFormValues[Key]) => void;
  onReset: () => void;
  onSubmit: () => void;
}) {
  const [breedSearch, setBreedSearch] = useState("");
  const [colorSearch, setColorSearch] = useState("");
  const selectedBreed = findOptionLabel(breedOptions, values.breed);
  const selectedColor = findOptionLabel(colorOptions, values.color);
  const selectedSize = findOptionLabel(sizeOptions, values.size);
  const selectedCollar = findOptionLabel(collarOptions, values.collar);
  const visibleBreedOptions = breedOptions.filter((option) => optionMatchesSearch(option.label, breedSearch));
  const visibleColorOptions = colorOptions.filter((option) => optionMatchesSearch(option.label, colorSearch));

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff3df] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#7d5b43]">
        <Sparkles className="size-4" />
        Photo parsed
      </span>

      <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
        Confirm the details before we search.
      </h1>
      <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#476a58]">
        We prefilled what we could from the photo. Fix anything that looks off,
        then tell us when and where you found the pet.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-[1.75rem] bg-[#f3fbf5] p-4">
          {values.photoDataUrl ? (
            <Image
              src={values.photoDataUrl}
              alt="Uploaded pet"
              width={320}
              height={320}
              unoptimized
              className="aspect-square w-full rounded-[1.25rem] object-cover"
            />
          ) : null}
        </div>

        <div className="grid gap-6">
          <section className="rounded-[1.75rem] bg-[#f9f3eb] p-5">
            <h2 className="text-sm font-black uppercase tracking-wide text-[#7d5b43]">
              Pet details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Breed">
                <SearchableSelect
                  value={selectedBreed}
                  placeholder="Search breed, e.g. Siamese"
                  searchPlaceholder="Search breed"
                  search={breedSearch}
                  emptyMessage="No breeds found."
                  options={visibleBreedOptions}
                  onSearchChange={setBreedSearch}
                  onValueChange={(label) => onChange("breed", findOptionValue(breedOptions, label) ?? "")}
                />
              </Field>
              <Field label="Color">
                <SearchableSelect
                  value={selectedColor}
                  placeholder="Search color, e.g. Cream"
                  searchPlaceholder="Search color"
                  search={colorSearch}
                  emptyMessage="No colors found."
                  options={visibleColorOptions}
                  onSearchChange={setColorSearch}
                  onValueChange={(label) => onChange("color", findOptionValue(colorOptions, label) ?? "")}
                />
              </Field>
              <Field label="Size">
                <SimpleSelect
                  value={selectedSize}
                  placeholder="Unknown"
                  options={sizeOptions}
                  onValueChange={(label) => onChange("size", (findOptionValue(sizeOptions, label) ?? "") as FoundPetFormValues["size"])}
                />
              </Field>
              <Field label="Collar">
                <SimpleSelect
                  value={selectedCollar}
                  placeholder="Unknown"
                  options={collarOptions}
                  onValueChange={(label) => onChange("collar", (findOptionValue(collarOptions, label) ?? "unknown") as FoundPetFormValues["collar"])}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Unique details">
                  <Textarea
                    value={values.unique_details}
                    onChange={(event) => onChange("unique_details", event.target.value)}
                    placeholder="White paws, clipped ear, scar, unusual markings..."
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-[#f3fbf5] p-5">
            <h2 className="text-sm font-black uppercase tracking-wide text-[#245643]">
              Required sighting details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="When did you find the pet?">
                <Input
                  type="datetime-local"
                  value={values.foundAt}
                  onChange={(event) => onChange("foundAt", event.target.value)}
                  required
                />
              </Field>
              <Field label="City">
                <Input
                  value={values.city}
                  onChange={(event) => onChange("city", event.target.value)}
                  placeholder="Amsterdam"
                  required
                />
              </Field>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          className="h-12 rounded-2xl bg-[#4f9a78] px-6 text-base font-black text-white hover:bg-[#3f8063]"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          <Search className="size-5" />
          {isSubmitting ? "Searching..." : "Find matches"}
        </Button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#b9dec9] bg-white px-6 text-base font-black text-[#476a58] transition hover:bg-[#f3fbf5]"
          disabled={isSubmitting}
        >
          <RotateCcw className="size-5" />
          Start over
        </button>
      </div>
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#5f796b]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SearchableSelect({
  emptyMessage,
  onSearchChange,
  onValueChange,
  options,
  placeholder,
  search,
  searchPlaceholder,
  value,
}: {
  emptyMessage: string;
  onSearchChange: (value: string) => void;
  onValueChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  search: string;
  searchPlaceholder: string;
  value: string | null;
}) {
  return (
    <UiSelect value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full rounded-full border-0 bg-white px-4 py-2 text-base font-medium text-[#2d251f] shadow-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="h-72 max-h-72 rounded-[1.25rem] bg-white p-2">
        <div className="sticky top-0 z-10 bg-white p-1">
          <div className="relative">
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              className="pr-11"
            />
            {search ? (
              <button
                type="button"
                aria-label={`Clear ${searchPlaceholder.toLowerCase()}`}
                className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#74675d] transition-colors hover:bg-[#f4ece5] hover:text-[#2d251f] focus-visible:ring-3 focus-visible:ring-[#f8c8a7]/60 focus-visible:outline-none"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSearchChange("")}
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
        {options.length ? (
          options.map((option) => (
            <SelectItem key={option.value} value={option.label} className="rounded-xl px-3 py-2 text-[#2d251f]">
              {option.label}
            </SelectItem>
          ))
        ) : (
          <p className="px-3 py-2 text-sm font-medium text-[#74675d]">{emptyMessage}</p>
        )}
      </SelectContent>
    </UiSelect>
  );
}

function SimpleSelect({
  onValueChange,
  options,
  placeholder,
  value,
}: {
  onValueChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  value: string | null;
}) {
  return (
    <UiSelect value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 w-full rounded-full border-0 bg-white px-4 py-2 text-base font-medium text-[#2d251f] shadow-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="rounded-[1.25rem] bg-white p-2">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.label} className="rounded-xl px-3 py-2 text-[#2d251f]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </UiSelect>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function findOptionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value || option.label.toLowerCase() === value.toLowerCase())?.label ?? null;
}

function findOptionValue(options: { value: string; label: string }[], label: string | null) {
  if (!label) {
    return undefined;
  }

  const normalizedLabel = label.trim().toLowerCase();
  return options.find((option) => option.label.toLowerCase() === normalizedLabel || option.value === normalizedLabel)?.value;
}

function optionMatchesSearch(label: string, search: string) {
  const normalizedSearch = normalizeSearchText(search);

  if (!normalizedSearch) {
    return true;
  }

  const normalizedLabel = normalizeSearchText(label);

  if (normalizedLabel.includes(normalizedSearch)) {
    return true;
  }

  let searchIndex = 0;

  for (const symbol of normalizedLabel) {
    if (symbol === normalizedSearch[searchIndex]) {
      searchIndex += 1;
    }

    if (searchIndex === normalizedSearch.length) {
      return true;
    }
  }

  return false;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
