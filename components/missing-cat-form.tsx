"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  Camera,
  Cat,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  PawPrint,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Address, Case } from "@/domain/case";
import type { Owner } from "@/domain/owner";
import type { Pet } from "@/domain/pets";
import type { Size } from "@/domain/pets";

type IntakeErrorResponse = {
  error?: string;
  issues?: { path: string; message: string }[];
};

type Step = {
  title: string;
  description: string;
  icon: typeof Cat;
};

type FieldErrorKey = "owner.name" | "owner.email" | "pet.name" | "pet.gender" | "lostDate" | "lost_place.city";

const steps: Step[] = [
  {
    title: "Start here",
    description: "Every detail brings them closer.",
    icon: Cat,
  },
  {
    title: "Your contact",
    description: "Owner details first.",
    icon: User,
  },
  {
    title: "Cat basics",
    description: "Core pet schema fields.",
    icon: PawPrint,
  },
  {
    title: "Last seen",
    description: "Case time and place.",
    icon: Calendar,
  },
  {
    title: "Add photos",
    description: "Photo URLs for the case.",
    icon: Camera,
  },
  {
    title: "Appearance",
    description: "Structured pet details.",
    icon: Sparkles,
  },
  {
    title: "Health and behavior",
    description: "Useful search context.",
    icon: BadgeCheck,
  },
  {
    title: "ID details",
    description: "Collar and chip fields.",
    icon: ShieldCheck,
  },
  {
    title: "Reward",
    description: "Optional case reward.",
    icon: Heart,
  },
  {
    title: "Review",
    description: "Looks good?",
    icon: CheckCircle2,
  },
];

const sizeOptions: Size[] = ["small", "medium", "large"];
const genderOptions: Pet["gender"][] = ["female", "male"];
const ageGroupOptions: NonNullable<Pet["age_group"]>[] = ["yong", "adult", "senior"];
const yesNoOptions = ["Yes", "No"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const progressLabels = [
  "Missing cat",
  "Contact added",
  "Cat basics added",
  "Last seen added",
  "Photos added",
  "Appearance added",
  "Health info added",
  "ID details added",
  "Reward added",
  "Almost found your cat",
];

export function MissingCatForm({ initialCase }: { initialCase?: Case }) {
  const [petCase, setPetCase] = useState<Case>(() => initialCase ?? createEmptyCase());
  const [currentStep, setCurrentStep] = useState(() => initialCase ? 2 : 0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
  const lostTime = petCase.lost_time ? petCase.lost_time.slice(11, 16) : "";

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
    if (key === "name" || key === "email") {
      clearFieldError(`owner.${key}`);
    }
    setError("");
  }

  function updatePet<Key extends keyof Pet>(key: Key, value: Pet[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      pet: { ...(current.pet ?? createEmptyPet()), [key]: value },
    }));
    if (key === "name" || key === "gender") {
      clearFieldError(`pet.${key}`);
    }
    setError("");
  }

  function updateLostPlace<Key extends keyof Omit<Address, "coordinates">>(key: Key, value: Address[Key]) {
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_place: { ...(current.lost_place ?? createEmptyAddress()), [key]: value },
    }));
    if (key === "city") {
      clearFieldError("lost_place.city");
    }
    setError("");
  }

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
    setPetCase((current) => ({
      ...current,
      updated_at: createTimestamp(),
      lost_time: createLostTime(lostDate, value),
    }));
    setError("");
  }

  function validateStep() {
    const nextFieldErrors: Partial<Record<FieldErrorKey, string>> = {};

    if (currentStep === 1) {
      if (!petCase.owner.name.trim()) {
        nextFieldErrors["owner.name"] = "Please add your name.";
      }

      if (!petCase.owner.email.trim()) {
        nextFieldErrors["owner.email"] = "Please add your email.";
      } else if (!emailPattern.test(petCase.owner.email.trim())) {
        nextFieldErrors["owner.email"] = "Please enter a valid email address.";
      }
    }

    if (currentStep === 2) {
      if (!pet.name?.trim()) {
        nextFieldErrors["pet.name"] = "Please add your cat's name.";
      }

      if (!pet.gender) {
        nextFieldErrors["pet.gender"] = "Please choose your cat's gender.";
      }
    }

    if (currentStep === 3) {
      if (!lostDate) {
        nextFieldErrors.lostDate = "Please add the date your cat was last seen.";
      }

      if (!lostPlace.city.trim()) {
        nextFieldErrors["lost_place.city"] = "Please add the city.";
      }
    }

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
    const saveError = await persistCase();
    if (saveError) {
      setError(saveError);
      return;
    }

    setSubmitted(true);
  }

  function startOver() {
    setPetCase(createEmptyCase());
    setCurrentStep(0);
    setFieldErrors({});
    setError("");
    setSubmitted(false);
    rewriteToHomeUrl();
  }

  async function persistCase() {
    setIsSaving(true);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petCase),
      });

      if (!response.ok) {
        return await getIntakeErrorMessage(response);
      }

      const savedCase = await response.json() as { id?: string };
      if (savedCase.id) {
        rewriteToCaseUrl(savedCase.id);
      }

      return "";
    } catch {
      return "We couldn't save this step. Please check your connection and try again.";
    } finally {
      setIsSaving(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[2.5rem] border-0 bg-white shadow-2xl shadow-[#d9b28b]/25 md:max-w-3xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-24 items-center justify-center rounded-[2rem] bg-[#bfe8d5] text-[#245643]">
            <CheckCircle2 className="size-11" />
          </div>
          <CardTitle className="text-4xl font-black tracking-tight text-[#2d251f]">
            Preview ready
          </CardTitle>
          <CardDescription className="max-w-xs text-base font-medium text-[#74675d]">
            Saved to the case repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[2rem] bg-[#f0fbf5] p-5 text-sm font-medium text-[#245643]">
            <span className="font-semibold">Preview case:</span> {pet.name || "Your cat"} last seen in {lostPlace.district || "your area"}{lostPlace.city ? `, ${lostPlace.city}` : ""}.
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button className="h-12 rounded-full bg-[#2d251f] px-7 text-white hover:bg-[#46382f]" onClick={startOver}>
            Start another report
          </Button>
        </CardFooter>
      </Card>
    );
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
      {currentStep > 0 ? (
        <CardFooter className="flex items-center justify-between gap-3 bg-white p-5 pt-1 sm:p-6 sm:pt-1">
          <Button
            variant="outline"
            className="h-12 rounded-full border-[#eadfD1] bg-white px-5 text-[#74675d]"
            onClick={goBack}
            disabled={isSaving}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button className="h-12 rounded-full bg-[#245643] px-7 text-white hover:bg-[#1d4737]" onClick={createCasePreview} disabled={isSaving}>
              {isSaving ? "Saving" : "Create case"}
              <CheckCircle2 className="size-4" />
            </Button>
          ) : (
            <Button className="h-12 rounded-full bg-[#2d251f] px-7 text-white hover:bg-[#46382f]" onClick={goNext} disabled={isSaving}>
              {isSaving ? "Saving" : "Continue"}
              <ChevronRight className="size-4" />
            </Button>
          )}
        </CardFooter>
      ) : null}
    </Card>
  );

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <WelcomeStep isSaving={isSaving} onStart={goNext} />;
      case 1:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Your name" required error={fieldErrors["owner.name"]}>
                <Input value={petCase.owner.name} onChange={(event) => updateOwner("name", event.target.value)} placeholder="Alex" aria-invalid={Boolean(fieldErrors["owner.name"])} />
              </Field>
              <Field label="Email" required error={fieldErrors["owner.email"]}>
                <Input type="email" value={petCase.owner.email} onChange={(event) => updateOwner("email", event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(fieldErrors["owner.email"])} />
              </Field>
            </TwoColumnFields>
            <Field label="Phone number">
              <Input value={petCase.owner.phone_number ?? ""} onChange={(event) => updateOwner("phone_number", event.target.value)} placeholder="Optional, e.g. +1 555 123 4567" />
            </Field>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Cat name" required error={fieldErrors["pet.name"]}>
                <Input value={pet.name ?? ""} onChange={(event) => updatePet("name", event.target.value)} placeholder="Miso" aria-invalid={Boolean(fieldErrors["pet.name"])} />
              </Field>
              <Field label="Gender" required error={fieldErrors["pet.gender"]}>
                <OptionGroup options={genderOptions} value={pet.gender} onSelect={(value) => updatePet("gender", value as Pet["gender"])} />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Breed">
                <Input value={pet.breed} onChange={(event) => updatePet("breed", event.target.value)} placeholder="Tabby, Siamese, mixed" />
              </Field>
              <Field label="Breed group">
                <Input value={pet.breed_group} onChange={(event) => updatePet("breed_group", event.target.value)} placeholder="Domestic short hair" />
              </Field>
            </TwoColumnFields>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Date last seen" required error={fieldErrors.lostDate}>
                <Input type="date" value={lostDate} onChange={(event) => updateLostDate(event.target.value)} aria-invalid={Boolean(fieldErrors.lostDate)} />
              </Field>
              <Field label="Approximate time">
                <Input type="time" value={lostTime} onChange={(event) => updateLostTime(event.target.value)} />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Country">
                <Input value={lostPlace.country} onChange={(event) => updateLostPlace("country", event.target.value)} placeholder="US" />
              </Field>
              <Field label="City" required error={fieldErrors["lost_place.city"]}>
                <Input value={lostPlace.city} onChange={(event) => updateLostPlace("city", event.target.value)} placeholder="Brooklyn" aria-invalid={Boolean(fieldErrors["lost_place.city"])} />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Region">
                <Input value={lostPlace.region ?? ""} onChange={(event) => updateLostPlace("region", event.target.value)} placeholder="NY" />
              </Field>
              <Field label="District or neighborhood">
                <Input value={lostPlace.district ?? ""} onChange={(event) => updateLostPlace("district", event.target.value)} placeholder="Park Slope" />
              </Field>
            </TwoColumnFields>
            <Field label="Full address or landmark">
              <Input value={lostPlace.full_address ?? ""} onChange={(event) => updateLostPlace("full_address", event.target.value)} placeholder="Near 5th Ave and 9th St" />
            </Field>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <Label htmlFor="photos">Choose cat photos</Label>
            <label htmlFor="photos" className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-amber-300 bg-white/80 p-6 text-center transition hover:bg-amber-50">
              <Camera className="mb-3 size-9 text-amber-700" />
              <span className="font-semibold text-stone-900">Pick photos</span>
              <span className="mt-1 text-sm text-stone-500">File names are saved as photo URLs for now.</span>
            </label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => updatePet("photo_urls", Array.from(event.target.files ?? []).map((file) => file.name))}
            />
            {pet.photo_urls.length ? (
              <div className="flex flex-wrap gap-2">
                {pet.photo_urls.map((photo) => (
                  <Badge key={photo} variant="outline" className="h-7 rounded-full bg-white px-3 text-stone-700">
                    {photo}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Optional, but helpful.</p>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <OptionGroup label="Size" options={sizeOptions} value={pet.size ?? ""} onSelect={(value) => updatePet("size", value as Size)} />
              <OptionGroup label="Age group" options={ageGroupOptions} value={pet.age_group ?? ""} onSelect={(value) => updatePet("age_group", value as NonNullable<Pet["age_group"]>)} />
            </TwoColumnFields>
            <Field label="Age in years">
              <Input type="number" min="0" value={pet.age_years?.toString() ?? ""} onChange={(event) => updatePet("age_years", event.target.value ? Number(event.target.value) : undefined)} placeholder="3" />
            </Field>
            <Field label="Appearance">
              <Textarea value={pet.appearance ?? ""} onChange={(event) => updatePet("appearance", event.target.value)} placeholder="Gray tabby, white chest, long fur..." />
            </Field>
            <Field label="Description">
              <Textarea value={pet.description ?? ""} onChange={(event) => updatePet("description", event.target.value)} placeholder="Responds to treats, shy with strangers..." />
            </Field>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <Field label="Health info">
              <Textarea value={pet.health_info ?? ""} onChange={(event) => updatePet("health_info", event.target.value)} placeholder="Medication, blind, elderly, injured..." />
            </Field>
            <Field label="Behavior">
              <Textarea value={pet.behavior ?? ""} onChange={(event) => updatePet("behavior", event.target.value)} placeholder="Friendly, scared, may run, do not chase..." />
            </Field>
            <Field label="Unique details">
              <Textarea value={pet.unique_details ?? ""} onChange={(event) => updatePet("unique_details", event.target.value)} placeholder="Ear notch, scar, white paws..." />
            </Field>
          </div>
        );
      case 7:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
                <OptionGroup label="Microchipped" options={yesNoOptions} value={booleanToYesNo(pet.chipped)} onSelect={(value) => updatePet("chipped", yesNoToBoolean(value))} />
                <OptionGroup label="Wearing collar" options={yesNoOptions} value={booleanToYesNo(pet.collar)} onSelect={(value) => updatePet("collar", yesNoToBoolean(value))} />
            </TwoColumnFields>
            <Field label="Chip number">
              <Input value={pet.chip_number ?? ""} onChange={(event) => updatePet("chip_number", event.target.value)} placeholder="Optional" />
            </Field>
          </div>
        );
      case 8:
        return (
          <div className="space-y-5">
            <Field label="Reward">
              <Input value={petCase.reward ?? ""} onChange={(event) => updateReward(event.target.value)} placeholder="No reward, reward offered, or amount" />
            </Field>
            <p className="rounded-2xl bg-white/80 p-4 text-sm text-stone-600">
              This is optional and maps directly to the case reward field.
            </p>
          </div>
        );
      default:
        return <ReviewStep petCase={petCase} />;
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
  return new Date().toISOString() as Case["created_at"];
}

function createEmptyCase(): Case {
  const updatedAt = createTimestamp();

  return {
    id: createIntakeId(),
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
    gender: "female",
  };
}

function createEmptyAddress(): Address {
  return {
    country: "",
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

function createLostTime(date: string, time: string) {
  if (!date) {
    return undefined;
  }

  return new Date(`${date}T${time || "00:00"}`).toISOString() as Case["lost_time"];
}

function yesNoToBoolean(value: string) {
  if (value === "Yes") {
    return true;
  }

  if (value === "No") {
    return false;
  }
}

function booleanToYesNo(value: boolean | undefined) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "";
}

function rewriteToCaseUrl(caseId: string) {
  const casePath = `/cases/${encodeURIComponent(caseId)}`;

  if (window.location.pathname !== casePath) {
    window.history.replaceState(null, "", casePath);
  }
}

function rewriteToHomeUrl() {
  if (window.location.pathname !== "/") {
    window.history.replaceState(null, "", "/");
  }
}

function WelcomeStep({ isSaving, onStart }: { isSaving: boolean; onStart: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff2d0] px-3 py-1 text-sm font-bold text-[#7a4b21]">
          <Heart className="size-4" />
          Stay hopeful
        </div>
        <p className="mt-4 text-2xl font-black leading-tight text-[#2d251f]">
          A clear post helps people find beloved pet faster.
        </p>
      </div>
      <Button className="mt-5 h-20 rounded-[1.5rem] bg-[#2d251f] text-xl font-black text-white shadow-lg shadow-[#d9b28b]/40 hover:bg-[#46382f]" onClick={onStart} disabled={isSaving}>
        Start
        <ChevronRight className="size-6" />
      </Button>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
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

function TwoColumnFields({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function OptionGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label?: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {label ? <Label className="font-bold text-[#2d251f]">{label}</Label> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={value === option ? "default" : "outline"}
            className={`h-11 rounded-full px-4 font-bold ${value === option ? "bg-[#2d251f] text-white" : "border-0 bg-white text-[#74675d]"}`}
            onClick={() => onSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ReviewStep({ petCase }: { petCase: Case }) {
  const pet = petCase.pet ?? createEmptyPet();
  const lostPlace = petCase.lost_place ?? createEmptyAddress();
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
        <ReviewCard title="Pet" items={[pet.breed, pet.breed_group, pet.gender, pet.size ?? ""]} />
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
