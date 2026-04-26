"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { CheckCircle2, ImagePlus, Printer, ShieldCheck, XCircle, XIcon } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { LocationPickerMap } from "@/components/location-picker-map";
import { RewardStep } from "@/components/missing-cat-form/reward-step";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAT_BREEDS_BY_GROUP, CAT_BREED_TO_GROUP, CAT_COLORS, type CatColor } from "@/domain/cats";
import { CaseSchema, type Address, type Case } from "@/domain/case";
import type { Owner } from "@/domain/owner";
import type { Pet, Size } from "@/domain/pets";
import { nowAsISODateTimeString, toISODateTimeString } from "@/platform/time";

const caseResponseSchema = z.object({ case: CaseSchema });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genderOptions: NonNullable<Pet["gender"]>[] = ["female", "male"];
const sizeOptions: Size[] = ["small", "medium", "large"];
const ageGroupOptions: NonNullable<Pet["age_group"]>[] = ["young", "adult", "senior"];
const yesNoOptions = ["Yes", "No"];
const catBreedOptions = Object.values(CAT_BREEDS_BY_GROUP)
  .flat()
  .map((breed) => ({ value: breed, label: formatCatOption(breed) }));
const catColorOptions = CAT_COLORS.map((color) => ({ value: color, label: formatCatOption(color) }));

type FieldErrorKey =
  | "owner.name"
  | "owner.email"
  | "pet.name"
  | "pet.gender"
  | "pet.age_years"
  | "lostDate"
  | "lost_place.city";

export function OwnerCasePage({ initialCase }: { initialCase: Case }) {
  const [petCase, setPetCase] = useState(initialCase);
  const [breedSearch, setBreedSearch] = useState(() => formatCatOption(initialCase.pet?.breed ?? ""));
  const [colorSearch, setColorSearch] = useState(() => formatCatOption(initialCase.pet?.color ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});

  const pet = petCase.pet ?? createEmptyPet();
  const lostPlace = petCase.lost_place ?? createEmptyAddress();
  const selectedBreedLabel = findCatBreed(pet.breed)?.label ?? null;
  const selectedColorLabel = findCatColor(pet.color)?.label ?? null;
  const visibleBreedOptions = catBreedOptions.filter((breed) => optionMatchesSearch(breed.label, breedSearch));
  const visibleColorOptions = catColorOptions.filter((color) => optionMatchesSearch(color.label, colorSearch));

  function updateOwner<Key extends keyof Owner>(key: Key, value: Owner[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      owner: { ...current.owner, [key]: emptyToUndefined(value) },
    }));
    if (key === "name") clearFieldError("owner.name");
    if (key === "email") clearFieldError("owner.email");
    clearNotices();
  }

  function updatePet<Key extends keyof Pet>(key: Key, value: Pet[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      pet: { ...(current.pet ?? createEmptyPet()), [key]: emptyToUndefined(value) },
    }));
    if (key === "name") clearFieldError("pet.name");
    if (key === "gender") clearFieldError("pet.gender");
    if (key === "age_years") clearFieldError("pet.age_years");
    clearNotices();
  }

  function updateBreed(value: string | null) {
    const selectedBreed = findCatBreed(value ?? "");

    if (!selectedBreed) {
      return;
    }

    setBreedSearch(selectedBreed.label);
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      pet: {
        ...(current.pet ?? createEmptyPet()),
        breed: selectedBreed.value,
        breed_group: CAT_BREED_TO_GROUP[selectedBreed.value],
      },
    }));
    clearNotices();
  }

  function updateColor(value: string | null) {
    const selectedColor = findCatColor(value ?? "");

    if (!selectedColor) {
      return;
    }

    setColorSearch(selectedColor.label);
    updatePet("color", selectedColor.value as CatColor);
  }

  function updateLostPlace<Key extends keyof Address>(key: Key, value: Address[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_place: { ...(current.lost_place ?? createEmptyAddress()), [key]: emptyToUndefined(value) },
    }));
    if (key === "city") clearFieldError("lost_place.city");
    clearNotices();
  }

  function updateLostPlaceFromMap(place: Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> }) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_place: {
        ...(current.lost_place ?? createEmptyAddress()),
        ...removeEmptyMapPlaceFields(place),
      },
    }));

    if (place.city?.trim()) {
      clearFieldError("lost_place.city");
    }

    clearNotices();
  }

  function updateReward(value: string) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      reward: value.trim() || undefined,
    }));
    clearNotices();
  }

  function updateLostDate(value: string) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_time: createLostTime(value, getLostTimeInput(current.lost_time)),
    }));
    clearFieldError("lostDate");
    clearNotices();
  }

  function updateLostTime(value: string) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_time: createLostTime(getLostDateInput(current.lost_time), value),
    }));
    clearNotices();
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setIsSaving(true);
    clearNotices();

    try {
      for (const file of Array.from(files)) {
        const uploadResponse = await fetch(`/api/cases/${encodeURIComponent(petCase.id)}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: await readFileAsDataUrl(file) }),
        });

        if (!uploadResponse.ok) {
          setError(await getErrorMessage(uploadResponse));
          return;
        }
      }

      const response = await fetch(`/api/cases/${encodeURIComponent(petCase.id)}`);
      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      const parsed = caseResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        setError("We received an unexpected response from the server.");
        return;
      }

      setPetCase(parsed.data.case);
      setMessage("Photos uploaded.");
    } catch {
      setError("We couldn't upload these photos. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveCase(nextCase: Case = petCase, successMessage = "Case details saved.") {
    if (!validateCase(nextCase)) {
      setMessage("");
      setError("Please fix the highlighted details before saving.");
      return;
    }

    setIsSaving(true);
    clearNotices();

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextCase, updated_at: createTimestamp() }),
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      const parsed = caseResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        setError("We received an unexpected response from the server.");
        return;
      }

      setPetCase(parsed.data.case);
      setMessage(successMessage);
    } catch {
      setError("We couldn't save this case. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function closeCase() {
    void saveCase({ ...petCase, status: "closed", updated_at: createTimestamp() }, "Case closed.");
  }

  function reopenCase() {
    void saveCase({ ...petCase, status: "open", updated_at: createTimestamp() }, "Case reopened.");
  }

  function clearNotices() {
    setMessage("");
    setError("");
  }

  function clearFieldError(key: FieldErrorKey) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateCase(nextCase: Case) {
    const nextFieldErrors: Partial<Record<FieldErrorKey, string>> = {};
    const nextPet = nextCase.pet ?? createEmptyPet();

    if (!nextCase.owner.name.trim()) {
      nextFieldErrors["owner.name"] = "Please add your name.";
    }

    if (!nextCase.owner.email.trim()) {
      nextFieldErrors["owner.email"] = "Please add your email.";
    } else if (!emailPattern.test(nextCase.owner.email.trim())) {
      nextFieldErrors["owner.email"] = "Please enter a valid email address.";
    }

    if (!nextPet.name?.trim()) {
      nextFieldErrors["pet.name"] = "Please add your cat's name.";
    }

    if (!nextPet.gender) {
      nextFieldErrors["pet.gender"] = "Please choose your cat's gender.";
    }

    if (nextPet.age_years !== undefined && (!Number.isFinite(nextPet.age_years) || nextPet.age_years < 0)) {
      nextFieldErrors["pet.age_years"] = "Please enter a valid age.";
    }

    if (!nextCase.lost_time) {
      nextFieldErrors.lostDate = "Please add the date your cat was last seen.";
    }

    if (!nextCase.lost_place?.city.trim()) {
      nextFieldErrors["lost_place.city"] = "Please add the city.";
    }

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length === 0;
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#fff8ec] px-4 py-5 text-[#2d251f] sm:px-6 sm:py-8">
      <div className="absolute -left-24 top-10 size-64 rounded-full bg-[#f8c8a7]/60 blur-3xl" />
      <div className="absolute -right-20 top-52 size-72 rounded-full bg-[#bfe8d5]/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#ffe6a8]/70 blur-3xl" />

      <section className="relative mx-auto max-w-4xl">
        <div className="space-y-5">
          <Card className="overflow-hidden rounded-[2rem] border-0 bg-white/90 shadow-2xl shadow-[#d9b28b]/25">
            <CardHeader className="gap-4 p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bfe8d5] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#245643]">
                    <ShieldCheck className="size-3.5" />
                    Owner page
                  </span>
                  <CardTitle className="mt-4 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                    {pet.name?.trim() || "Missing cat"}
                  </CardTitle>
                  <CardDescription className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#74675d]">
                    Manage every detail in one place. Changes update the public case.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/public-case/${encodeURIComponent(petCase.id)}`} className="inline-flex h-11 items-center rounded-full bg-[#245643] px-5 text-sm font-bold text-white hover:bg-[#1d4737]">
                    Public page
                  </Link>
                  {petCase.status === "closed" ? (
                    <Button type="button" disabled={isSaving} onClick={reopenCase} className="h-11 rounded-full bg-[#2d251f] px-5 text-white hover:bg-[#46382f]">
                      Reopen case
                    </Button>
                  ) : (
                    <Button type="button" disabled={isSaving} onClick={closeCase} className="h-11 rounded-full bg-red-600 px-5 text-white hover:bg-red-700">
                      Close case
                    </Button>
                  )}
                </div>
              </div>
              <div className={`flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-black ${petCase.status === "closed" ? "bg-red-50 text-red-700" : "bg-[#fff2d0] text-[#7a4b21]"}`}>
                {petCase.status === "closed" ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                Status: {petCase.status}
              </div>
              <div className="flex justify-end">
                <a
                  href={`/case/${encodeURIComponent(petCase.id)}/flyer/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#fff2d0] px-5 text-sm font-bold text-[#7a4b21] hover:bg-[#ffe6a8]"
                >
                  <Printer className="size-4" />
                  Open printable poster
                </a>
              </div>
            </CardHeader>
          </Card>

          <EditableSection title="Owner details">
            <TwoColumns>
              <Field label="Name" required error={fieldErrors["owner.name"]}>
                <Input value={petCase.owner.name} onChange={(event) => updateOwner("name", event.target.value)} placeholder="Alex" aria-invalid={Boolean(fieldErrors["owner.name"])} />
              </Field>
              <Field label="Email" required error={fieldErrors["owner.email"]}>
                <Input type="email" value={petCase.owner.email} onChange={(event) => updateOwner("email", event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(fieldErrors["owner.email"])} />
              </Field>
            </TwoColumns>
            <Field label="Phone"><Input value={petCase.owner.phone_number ?? ""} onChange={(event) => updateOwner("phone_number", event.target.value)} placeholder="Optional, e.g. +31 6 1234 5678" /></Field>
          </EditableSection>

          <EditableSection title="Photos">
            <div className="grid gap-3 sm:grid-cols-3">
              {pet.photo_urls.map((url) => (
                <div key={url} className="flex h-44 items-center justify-center rounded-2xl bg-[#f3fbf5] p-2">
                  <img alt="Cat photo" src={url} className="max-h-full max-w-full rounded-xl object-contain" />
                </div>
              ))}
              <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d9b28b] bg-white text-center text-sm font-black text-[#7b563e] transition hover:bg-[#fff7eb]">
                <ImagePlus className="size-8" />
                Upload photos
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => void uploadPhotos(event.target.files)} />
              </label>
            </div>
          </EditableSection>

          <EditableSection title="Cat details">
            <TwoColumns>
              <Field label="Name" required error={fieldErrors["pet.name"]}>
                <Input value={pet.name ?? ""} onChange={(event) => updatePet("name", event.target.value)} placeholder="Miso" aria-invalid={Boolean(fieldErrors["pet.name"])} />
              </Field>
              <Field label="Gender" required error={fieldErrors["pet.gender"]}>
                <OptionGroup options={genderOptions} value={pet.gender ?? ""} onSelect={(value) => updatePet("gender", value as Pet["gender"])} />
              </Field>
              <Field label="Breed">
                <SearchableOptionSelect
                  placeholder="Search breed, e.g. Siamese"
                  searchPlaceholder="Search breed"
                  search={breedSearch}
                  options={visibleBreedOptions}
                  value={selectedBreedLabel}
                  onSearchChange={setBreedSearch}
                  onValueChange={updateBreed}
                />
              </Field>
              <Field label="Color">
                <SearchableOptionSelect
                  placeholder="Choose color"
                  searchPlaceholder="Search color"
                  search={colorSearch}
                  options={visibleColorOptions}
                  value={selectedColorLabel}
                  onSearchChange={setColorSearch}
                  onValueChange={updateColor}
                />
              </Field>
              <OptionGroup label="Size" options={sizeOptions} value={pet.size ?? ""} onSelect={(value) => updatePet("size", value as Size)} />
              <OptionGroup label="Age group" options={ageGroupOptions} value={pet.age_group ?? ""} onSelect={(value) => updatePet("age_group", value as NonNullable<Pet["age_group"]>)} />
              <Field label="Age years" error={fieldErrors["pet.age_years"]}>
                <Input type="number" min="0" value={pet.age_years?.toString() ?? ""} onChange={(event) => updatePet("age_years", event.target.value ? Number(event.target.value) : undefined)} placeholder="3" aria-invalid={Boolean(fieldErrors["pet.age_years"])} />
              </Field>
            </TwoColumns>
            <div className="flex flex-wrap gap-5">
              <OptionGroup label="Wearing collar" options={yesNoOptions} value={booleanToYesNo(pet.collar)} onSelect={(value) => updatePet("collar", yesNoToBoolean(value))} />
            </div>
            <Field label="Unique details"><Textarea value={pet.unique_details ?? ""} onChange={(event) => updatePet("unique_details", event.target.value)} placeholder="Ear notch, scar, white paws..." /></Field>
            <Field label="Health info"><Textarea value={pet.health_info ?? ""} onChange={(event) => updatePet("health_info", event.target.value)} placeholder="Medication, blind, elderly, injured..." /></Field>
            <Field label="Behavior"><Textarea value={pet.behavior ?? ""} onChange={(event) => updatePet("behavior", event.target.value)} placeholder="Friendly, scared, may run, do not chase..." /></Field>
          </EditableSection>

          <EditableSection title="Last seen">
            <TwoColumns>
              <Field label="Date" required error={fieldErrors.lostDate}>
                <Input type="date" value={getLostDateInput(petCase.lost_time)} onChange={(event) => updateLostDate(event.target.value)} aria-invalid={Boolean(fieldErrors.lostDate)} />
              </Field>
              <Field label="Time"><Input type="time" value={getLostTimeInput(petCase.lost_time)} onChange={(event) => updateLostTime(event.target.value)} /></Field>
            </TwoColumns>
            <TwoColumns>
              <Field label="Country"><Input value={lostPlace.country.toUpperCase()} readOnly aria-readonly="true" className="bg-white/60 text-[#74675d]" /></Field>
              <Field label="City" required error={fieldErrors["lost_place.city"]}>
                <Input value={lostPlace.city} onChange={(event) => updateLostPlace("city", event.target.value)} placeholder="Amsterdam" aria-invalid={Boolean(fieldErrors["lost_place.city"])} />
              </Field>
            </TwoColumns>
            <LocationPickerMap
              country={lostPlace.country}
              coordinates={lostPlace.coordinates}
              onLocationChange={updateLostPlaceFromMap}
              title="Set the last-seen pin"
              description="Drag the marker, tap the map, or search for the place where your cat was last seen."
              autoFillAddressDetails
            />
          </EditableSection>

          <EditableSection title="Reward">
            <RewardStep petCase={petCase} updateReward={updateReward} />
          </EditableSection>

          <div className="sticky bottom-4 z-10 flex flex-col gap-2 rounded-[1.5rem] bg-white/95 p-3 shadow-xl shadow-[#d9b28b]/25 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-bold">
              {message ? <span className="text-[#245643]">{message}</span> : null}
              {error ? <span className="text-red-600">{error}</span> : null}
            </div>
            <Button disabled={isSaving} onClick={() => void saveCase()} className="h-12 rounded-full bg-[#2d251f] px-8 text-white hover:bg-[#46382f]">
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function EditableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[2rem] border-0 bg-white/90 shadow-lg shadow-[#d9b28b]/15">
      <CardHeader className="pb-3"><CardTitle className="text-2xl font-black">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-bold text-[#2d251f]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

function TwoColumns({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function SearchableOptionSelect({
  placeholder,
  searchPlaceholder,
  search,
  options,
  value,
  onSearchChange,
  onValueChange,
}: {
  placeholder: string;
  searchPlaceholder: string;
  search: string;
  options: { value: string; label: string }[];
  value: string | null;
  onSearchChange: (value: string) => void;
  onValueChange: (value: string | null) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
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
                className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#74675d] transition-colors hover:bg-[#f4ece5] hover:text-[#2d251f] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#f8c8a7]/60"
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
          <p className="px-3 py-2 text-sm font-medium text-[#74675d]">No options found.</p>
        )}
      </SelectContent>
    </Select>
  );
}

function OptionGroup({ label, options, value, onSelect }: { label?: string; options: string[]; value: string; onSelect: (value: string) => void }) {
  return (
    <div className="space-y-2">
      {label ? <Label className="font-bold text-[#2d251f]">{label}</Label> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "default" : "outline"}
            className={`h-11 rounded-full px-4 font-bold ${value === option ? "bg-[#2d251f] text-white" : "border-[#e8d7be] bg-white text-[#74675d] hover:bg-[#fff7eb]"}`}
            onClick={() => onSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

function yesNoToBoolean(value: string) {
  if (value === "Yes") return true;
  if (value === "No") return false;
}

function booleanToYesNo(value: boolean | undefined) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string; issues?: { path: string; message: string }[] };
    if (body.error) return body.error;
    if (body.issues?.[0]) return `${body.issues[0].path}: ${body.issues[0].message}`;
  } catch {
    // Fall through to generic error.
  }

  return "Something went wrong. Please try again.";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read photo.")));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read photo.")));
    reader.readAsDataURL(file);
  });
}

function createTimestamp() {
  return nowAsISODateTimeString();
}

function createEmptyPet(): Pet {
  return { species: "cat", breed: "", breed_group: "", photo_urls: [], gender: undefined };
}

function createEmptyAddress(): Address {
  return { country: "nl", city: "" };
}

function removeEmptyMapPlaceFields(place: Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> }) {
  return Object.fromEntries(
    Object.entries(place).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> };
}

function emptyToUndefined<T>(value: T) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function createLostTime(date: string, time: string) {
  if (!date) return undefined;
  return toISODateTimeString(`${date}T${time || "00:00"}`);
}

function getLostDateInput(value?: string) {
  return value?.slice(0, 10) ?? "";
}

function getLostTimeInput(value?: string) {
  const time = value?.slice(11, 16) ?? "";
  return time === "00:00" ? "" : time;
}

function findCatBreed(value: string | undefined) {
  const normalizedValue = value?.trim().toLowerCase() ?? "";
  return catBreedOptions.find((breed) => breed.label.toLowerCase() === normalizedValue || breed.value === normalizedValue);
}

function findCatColor(value: string | undefined) {
  const normalizedValue = value?.trim().toLowerCase() ?? "";
  return catColorOptions.find((color) => color.label.toLowerCase() === normalizedValue || color.value === normalizedValue);
}

function formatCatOption(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function optionMatchesSearch(label: string, search: string) {
  const normalizedSearch = normalizeSearchText(search);

  if (!normalizedSearch) return true;

  const normalizedLabel = normalizeSearchText(label);
  if (normalizedLabel.includes(normalizedSearch)) return true;

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
