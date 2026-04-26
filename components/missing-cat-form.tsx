"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  Camera,
  Cat,
  CheckCircle2,
  Heart,
  PawPrint,
  Sparkles,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppearanceStep } from "@/components/missing-cat-form/appearance-step";
import { CatBasicsStep } from "@/components/missing-cat-form/cat-basics-step";
import { FormNavigation } from "@/components/missing-cat-form/form-navigation";
import { HealthBehaviorStep } from "@/components/missing-cat-form/health-behavior-step";
import { LastSeenStep } from "@/components/missing-cat-form/last-seen-step";
import { OwnerStep } from "@/components/missing-cat-form/owner-step";
import { PhotosStep } from "@/components/missing-cat-form/photos-step";
import { ReviewStep } from "@/components/missing-cat-form/review-step";
import { RewardStep } from "@/components/missing-cat-form/reward-step";
import type { FieldErrorKey, UpdateLostPlaceFromMap } from "@/components/missing-cat-form/types";
import { WelcomeStep } from "@/components/missing-cat-form/welcome-step";
import { CAT_BREEDS_BY_GROUP, CAT_BREED_TO_GROUP, type CatBreed } from "@/domain/cats";
import { type Address, type Case, CaseSchema } from "@/domain/case";
import type { Owner } from "@/domain/owner";
import type { Pet } from "@/domain/pets";
import type { Size } from "@/domain/pets";
import { nowAsISODateTimeString, toISODateTimeString } from "@/platform/time";
import { z } from "zod";

type IntakeErrorResponse = {
  error?: string;
  issues?: { path: string; message: string }[];
};

const intakeSuccessSchema = z.object({ case: CaseSchema });
const caseResponseSchema = z.object({ case: CaseSchema });

type Step = {
  title: string;
  description: string;
  icon: typeof Cat;
};

const steps: Step[] = [
  {
    title: "Start here",
    description: "Every detail brings them closer",
    icon: Cat,
  },
  {
    title: "Your contact",
    description: "Owner details first",
    icon: User,
  },
  {
    title: "Add photos",
    description: "More photos, more chances",
    icon: Camera,
  },
  {
    title: "Cat details",
    description: "Add name, gender, and breed",
    icon: PawPrint,
  },
  {
    title: "Last seen",
    description: "Share location and time when last seen",
    icon: Calendar,
  },
  {
    title: "Appearance",
    description: "Add color, unique details, and more",
    icon: Sparkles,
  },
  {
    title: "Health and behavior",
    description: "Add insights about health and behavior",
    icon: BadgeCheck,
  },
  {
    title: "Reward",
    description: "Optional case reward",
    icon: Heart,
  },
  {
    title: "Review",
    description: "Looks good?",
    icon: CheckCircle2,
  },
];

const sizeOptions: Size[] = ["small", "medium", "large"];
const genderOptions: NonNullable<Pet["gender"]>[] = ["female", "male"];
const ageGroupOptions: NonNullable<Pet["age_group"]>[] = ["young", "adult", "senior"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const unknownBreed = "domestic_cat" satisfies CatBreed;
const catBreedOptions = Object.values(CAT_BREEDS_BY_GROUP)
  .flat()
  .map((breed) => ({
    value: breed,
    label: formatCatOption(breed),
  }));
const progressLabels = [
  "Missing cat",
  "Contact added",
  "Photos added",
  "Cat basics added",
  "Last seen added",
  "Appearance added",
  "Health info added",
  "Reward added",
  "Almost found your cat",
];

export function MissingCatForm({ initialCase, initialStep }: { initialCase?: Case; initialStep?: number }) {
  const [petCase, setPetCase] = useState<Case>(() => initialCase ?? createEmptyCase());
  const [breedSearch, setBreedSearch] = useState(() => formatCatOption(initialCase?.pet?.breed ?? ""));
  const [lostTime, setLostTime] = useState(() => getLostTimeInput(initialCase?.lost_time));
  const [currentStep, setCurrentStep] = useState(() => getInitialStepIndex(initialStep, initialCase));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const progress = useMemo(
    () => Math.round((currentStep / (steps.length - 1)) * 100),
    [currentStep]
  );

  const step = steps[currentStep];
  const Icon = step.icon;
  const progressLabel = progressLabels[currentStep] ?? "Almost found your cat";

  const pet = petCase.pet ?? createEmptyPet();
  const lostPlace = petCase.lost_place ?? createEmptyAddress();
  const lostDate = petCase.lost_time ? petCase.lost_time.slice(0, 10) : "";
  const isUnknownBreed = pet.breed === unknownBreed && pet.breed_group === CAT_BREED_TO_GROUP[unknownBreed];
  const selectedBreed = findCatBreed(pet.breed);
  const selectedBreedLabel = selectedBreed ? formatCatOption(selectedBreed) : null;
  const visibleBreedOptions = catBreedOptions.filter((breed) => breedMatchesSearch(breed.label, breedSearch));

  useEffect(() => {
    rewriteToStepUrl(currentStep);
  }, [currentStep]);

  function updateReward(value: string) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      reward: value.trim() || undefined,
    }));
    setError("");
  }

  function clearFieldError(key: FieldErrorKey) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateOwner<Key extends keyof Owner>(key: Key, value: Owner[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      owner: { ...current.owner, [key]: value },
    }));
    if (key === "name") {
      clearFieldError("owner.name");
    }

    if (key === "email") {
      clearFieldError("owner.email");
    }
    setError("");
  }

  function updatePet<Key extends keyof Pet>(key: Key, value: Pet[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      pet: { ...(current.pet ?? createEmptyPet()), [key]: value },
    }));
    if (key === "name") {
      clearFieldError("pet.name");
    }

    if (key === "gender") {
      clearFieldError("pet.gender");
    }
    setError("");
  }

  function updateBreedSearch(value: string) {
    setBreedSearch(value);
    setError("");
  }

  function updateBreed(value: string | null) {
    if (!value) {
      return;
    }

    const selectedValue = findCatBreed(value);

    if (!selectedValue) {
      return;
    }

    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      pet: {
        ...(current.pet ?? createEmptyPet()),
        breed: selectedValue,
        breed_group: CAT_BREED_TO_GROUP[selectedValue],
      },
    }));
    setError("");
  }

  function updateUnknownBreed(checked: boolean) {
    if (checked) {
      setBreedSearch(formatCatOption(unknownBreed));
      setPetCase((current) => ({
        ...current,
        updated_at: createTimestamp(),
        pet: {
          ...(current.pet ?? createEmptyPet()),
          breed: unknownBreed,
          breed_group: CAT_BREED_TO_GROUP[unknownBreed],
        },
      }));
      setError("");
      return;
    }

    setBreedSearch("");
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      pet: {
        ...(current.pet ?? createEmptyPet()),
        breed: "",
        breed_group: "",
      },
    }));
    setError("");
  }

  function updateLostPlace(key: keyof Omit<Address, "coordinates">, value: string) {
    const nextValue = key === "country"
      ? value.trim().toLowerCase()
      : value;

    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_place: { ...(current.lost_place ?? createEmptyAddress()), [key]: nextValue },
    }));
    if (key === "city") {
      clearFieldError("lost_place.city");
    }
    setError("");
  }

  const updateLostPlaceFromMap: UpdateLostPlaceFromMap = (place) => {
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

    setError("");
  };

  function updateLostDate(value: string) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_time: createLostTime(value, lostTime),
    }));
    clearFieldError("lostDate");
    setError("");
  }

  function updateLostTime(value: string) {
    setLostTime(value);
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_time: createLostTime(lostDate, value),
    }));
    setError("");
  }

  function getStepErrors(stepIndex: number) {
    const nextFieldErrors: Partial<Record<FieldErrorKey, string>> = {};

    if (stepIndex === 1) {
      if (!petCase.owner.name.trim()) {
        nextFieldErrors["owner.name"] = "Please add your name.";
      }

      if (!petCase.owner.email.trim()) {
        nextFieldErrors["owner.email"] = "Please add your email.";
      } else if (!emailPattern.test(petCase.owner.email.trim())) {
        nextFieldErrors["owner.email"] = "Please enter a valid email address.";
      }
    }

    if (stepIndex === 3) {
      if (!pet.name?.trim()) {
        nextFieldErrors["pet.name"] = "Please add your cat's name.";
      }

      if (!pet.gender) {
        nextFieldErrors["pet.gender"] = "Please choose your cat's gender.";
      }
    }

    if (stepIndex === 4) {
      if (!lostDate) {
        nextFieldErrors.lostDate = "Please add the date your cat was last seen.";
      }

      if (!lostPlace.city.trim()) {
        nextFieldErrors["lost_place.city"] = "Please add the city.";
      }
    }

    return nextFieldErrors;
  }

  function validateStep(stepIndex = currentStep) {
    const nextFieldErrors = getStepErrors(stepIndex);

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length === 0;
  }

  async function goNext() {
    if (!validateStep()) {
      setError("");
      return;
    }

    if (currentStep > 0) {
      const saveError = await persistCase();
      if (saveError) {
        setError(saveError);
        return;
      }
    }

    setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
    setFieldErrors({});
    setError("");
  }

  function goBack() {
    setCurrentStep((current) => Math.max(current - 1, 0));
    setFieldErrors({});
    setError("");
  }

  async function createCasePreview() {
    for (const stepIndex of [1, 3, 4]) {
      const nextFieldErrors = getStepErrors(stepIndex);

      if (Object.keys(nextFieldErrors).length > 0) {
        setCurrentStep(stepIndex);
        setFieldErrors(nextFieldErrors);
        setError("");
        return;
      }
    }

    const saveError = await persistCase({
      ...petCase,
      status: "open",
      updated_at: createTimestamp(),
    });

    if (saveError) {
      setError(saveError);
    }
  }

  async function uploadPhotos(files: File[]) {
    if (!files.length) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      for (const file of files) {
        const uploadResponse = await fetch(`/api/cases/${encodeURIComponent(petCase.id)}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Image: await readFileAsDataUrl(file),
          }),
        });

        if (!uploadResponse.ok) {
          setError(await getIntakeErrorMessage(uploadResponse));
          return;
        }
      }

      const caseResponse = await fetch(`/api/cases/${encodeURIComponent(petCase.id)}`);
      if (!caseResponse.ok) {
        setError(await getIntakeErrorMessage(caseResponse));
        return;
      }

      const parsed = caseResponseSchema.safeParse(await caseResponse.json());
      if (parsed.success) {
        setPetCase(parsed.data.case);
        setLostTime(getLostTimeInput(parsed.data.case.lost_time));
        setBreedSearch(formatCatOption(parsed.data.case.pet?.breed ?? ""));
      } else {
        setError("We received an unexpected response from the server.");
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error
        ? uploadError.message
        : "We couldn't upload this photo. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function persistCase(nextCase: Case = petCase, options: { rewriteUrl?: boolean } = {}) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextCase),
      });

      if (!response.ok) {
        return await getIntakeErrorMessage(response);
      }

      const savedCase = intakeSuccessSchema.safeParse(await response.json());
      if (savedCase.success) {
        setPetCase(savedCase.data.case);

        if (savedCase.data.case.status === "open") {
          window.location.assign(`/cases/${encodeURIComponent(savedCase.data.case.id)}`);
        } else if (options.rewriteUrl !== false) {
          rewriteToCaseUrl(savedCase.data.case.id);
        }

        return "";
      }

      return "We received an unexpected response from the server.";
    } catch (saveError) {
      return saveError instanceof Error
        ? saveError.message
        : "We couldn't save this step. Please check your connection and try again.";
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[2.5rem] border-0 bg-white shadow-2xl shadow-[#d9b28b]/25 md:max-w-3xl">
      <CardHeader className="gap-5 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="relative flex h-8 items-center justify-end">
            <Badge
              variant="secondary"
              className="absolute top-0 h-8 rounded-full bg-[#ffe6a8] px-3 text-[#7a4b21] shadow-sm transition-[left,transform] duration-300 ease-out"
              style={{ left: `${progress}%`, transform: `translateX(-${progress}%)` }}
            >
              {progressLabel}
            </Badge>
            <span className="rounded-full bg-[#f4eee6] px-3 py-1 text-sm font-bold text-[#74675d]">
              {currentStep + 1}/{steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-[#f4eee6]" />
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#fff2d0] p-5">
          <div className="absolute -right-8 -top-8 size-28 rounded-full bg-[#f8c8a7]" />
          <div className="absolute -bottom-10 right-10 size-24 rounded-full bg-[#bfe8d5]" />
          <div className="relative flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-white text-[#d07b47] shadow-sm">
              <Icon className="size-8" />
            </div>
            <div>
              <CardTitle className="text-4xl font-black leading-none tracking-tight text-[#2d251f]">
                {step.title}
              </CardTitle>
              <CardDescription className="mt-2 text-base font-semibold text-[#74675d]">
                {step.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6">
        <div className="min-h-[300px] rounded-[2rem] bg-[#f9f3eb] p-5">
          {renderStep()}
        </div>
        {error ? <p className="mt-4 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600">{error}</p> : null}
      </CardContent>
      <FormNavigation
        currentStep={currentStep}
        stepsLength={steps.length}
        isSaving={isSaving}
        onBack={goBack}
        onNext={goNext}
        onCreate={createCasePreview}
      />
    </Card>
  );

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <WelcomeStep isSaving={isSaving} onStart={goNext} />;
      case 1:
        return <OwnerStep petCase={petCase} fieldErrors={fieldErrors} updateOwner={updateOwner} />;
      case 2:
        return <PhotosStep pet={pet} updatePet={updatePet} uploadPhotos={uploadPhotos} />;
      case 3:
        return (
          <CatBasicsStep
            pet={pet}
            fieldErrors={fieldErrors}
            genderOptions={genderOptions}
            selectedBreedLabel={selectedBreedLabel}
            breedSearch={breedSearch}
            visibleBreedOptions={visibleBreedOptions}
            isUnknownBreed={isUnknownBreed}
            updatePet={updatePet}
            updateBreed={updateBreed}
            updateBreedSearch={updateBreedSearch}
            updateUnknownBreed={updateUnknownBreed}
          />
        );
      case 4:
        return (
          <LastSeenStep
            lostDate={lostDate}
            lostTime={lostTime}
            lostPlace={lostPlace}
            fieldErrors={fieldErrors}
            updateLostDate={updateLostDate}
            updateLostTime={updateLostTime}
            updateLostPlace={updateLostPlace}
            updateLostPlaceFromMap={updateLostPlaceFromMap}
          />
        );
      case 5:
        return <AppearanceStep pet={pet} sizeOptions={sizeOptions} ageGroupOptions={ageGroupOptions} updatePet={updatePet} />;
      case 6:
        return <HealthBehaviorStep pet={pet} updatePet={updatePet} />;
      case 7:
        return <RewardStep petCase={petCase} updateReward={updateReward} />;
      default:
        return <ReviewStep petCase={petCase} pet={pet} lostPlace={lostPlace} />;
    }
  }
}

async function getIntakeErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as IntakeErrorResponse;

    if (body.error) {
      return body.error;
    }

    const firstIssue = body.issues?.[0];
    if (firstIssue) {
      return firstIssue.path
        ? `${firstIssue.path}: ${firstIssue.message}`
        : firstIssue.message;
    }
  } catch {
    // Fall back to a generic message when the API does not return JSON.
  }

  return "We couldn't save this step. Please try again.";
}

function createIntakeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function createTimestamp() {
  return nowAsISODateTimeString();
}

function getInitialStepIndex(initialStep: number | undefined, initialCase: Case | undefined) {
  if (initialStep !== undefined && initialStep >= 1 && initialStep <= steps.length) {
    return initialStep - 1;
  }

  return initialCase ? 2 : 0;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read photo."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Unable to read photo.")));
    reader.readAsDataURL(file);
  });
}

function createEmptyCase(): Case {
  const updatedAt = createTimestamp();

  return {
    id: createIntakeId(),
    status: "created",
    owner: {
      name: "",
      email: "",
    },
    pet: createEmptyPet(),
    lost_place: createEmptyAddress(),
    sightings: [],
    created_at: updatedAt,
    updated_at: updatedAt,
  };
}

function createEmptyPet(): Pet {
  return {
    species: "cat",
    breed: "",
    breed_group: "",
    photo_urls: [],
    gender: undefined,
  };
}

function createEmptyAddress(): Address {
  return {
    country: "nl",
    city: "",
    region: "",
    district: "",
    street: "",
    house_number: "",
    apartment: "",
    postal_code: "",
    full_address: "",
  };
}

function removeEmptyMapPlaceFields(place: Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> }) {
  return Object.fromEntries(
    Object.entries(place).filter(([, value]) => value !== undefined && value !== ""),
  ) as Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> };
}

function rewriteToStepUrl(stepIndex: number) {
  const url = new URL(window.location.href);

  if (url.pathname !== "/intake" && !url.pathname.startsWith("/cases/")) {
    return;
  }

  url.searchParams.set("step", String(stepIndex + 1));

  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function createLostTime(date: string, time: string) {
  if (!date) {
    return undefined;
  }

  return toISODateTimeString(`${date}T${time || "00:00"}`);
}

function getLostTimeInput(value?: string) {
  const time = value?.slice(11, 16) ?? "";

  return time === "00:00" ? "" : time;
}

function formatCatOption(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function findCatBreed(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const option = catBreedOptions.find((breed) => breed.label.toLowerCase() === normalizedValue || breed.value === normalizedValue);

  return option?.value;
}

function breedMatchesSearch(label: string, search: string) {
  const normalizedSearch = normalizeBreedSearchText(search);

  if (!normalizedSearch) {
    return true;
  }

  const normalizedLabel = normalizeBreedSearchText(label);

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

function normalizeBreedSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rewriteToCaseUrl(caseId: string) {
  const casePath = `/cases/${encodeURIComponent(caseId)}`;

  if (window.location.pathname !== casePath) {
    window.history.replaceState(null, "", casePath);
  }
}
