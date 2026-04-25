"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import type { FoundPetFormValues } from "./types";

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
                <Input
                  value={values.breed}
                  onChange={(event) => onChange("breed", event.target.value)}
                  placeholder="siamese"
                />
              </Field>
              <Field label="Breed group">
                <Input
                  value={values.breed_group}
                  onChange={(event) => onChange("breed_group", event.target.value)}
                  placeholder="slim_big_ears"
                />
              </Field>
              <Field label="Color">
                <Input
                  value={values.color}
                  onChange={(event) => onChange("color", event.target.value)}
                  placeholder="cream"
                />
              </Field>
              <Field label="Age group">
                <Select
                  value={values.age_group}
                  onChange={(event) => onChange("age_group", event.target.value as FoundPetFormValues["age_group"])}
                >
                  <option value="">Unknown</option>
                  <option value="young">Young</option>
                  <option value="adult">Adult</option>
                  <option value="senior">Senior</option>
                </Select>
              </Field>
              <Field label="Size">
                <Select
                  value={values.size}
                  onChange={(event) => onChange("size", event.target.value as FoundPetFormValues["size"])}
                >
                  <option value="">Unknown</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Select>
              </Field>
              <Field label="Collar">
                <Select
                  value={values.collar}
                  onChange={(event) => onChange("collar", event.target.value as FoundPetFormValues["collar"])}
                >
                  <option value="unknown">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
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
              <Field label="District or area">
                <Input
                  value={values.district}
                  onChange={(event) => onChange("district", event.target.value)}
                  placeholder="Centrum"
                />
              </Field>
              <Field label="Exact place">
                <Input
                  value={values.fullAddress}
                  onChange={(event) => onChange("fullAddress", event.target.value)}
                  placeholder="Near Vondelpark"
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

function Select({ className = "", ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={`h-12 w-full rounded-full border-0 bg-white px-4 py-2 text-base font-medium text-[#2d251f] shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-[#f8c8a7]/60 ${className}`}
      {...props}
    />
  );
}
