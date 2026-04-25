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
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
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

type FormData = {
  owner: Owner;
  pet: {
    species: "cat";
    breed: string;
    breed_group: string;
    photo_urls: string[];
    gender: "" | Pet["gender"];
    age_years: string;
    age_group: "" | NonNullable<Pet["age_group"]>;
    name: string;
    appearance: string;
    description: string;
    health_info: string;
    behavior: string;
    unique_details: string;
    chipped: "" | "Yes" | "No";
    chip_number: string;
    collar: "" | "Yes" | "No";
    size: "" | Size;
  };
  lostDate: string;
  lostTime: string;
  lost_place: Record<keyof Omit<Address, "coordinates">, string>;
  reward: string;
};

type IntakeErrorResponse = {
  error?: string;
  issues?: { path: string; message: string }[];
};

type Step = {
  title: string;
  description: string;
  icon: typeof Cat;
};

const initialFormData: FormData = {
  owner: {
    name: "",
    email: "",
  },
  pet: {
    species: "cat",
    breed: "",
    breed_group: "",
    photo_urls: [],
    gender: "",
    age_years: "",
    age_group: "",
    name: "",
    appearance: "",
    description: "",
    health_info: "",
    behavior: "",
    unique_details: "",
    chipped: "",
    chip_number: "",
    collar: "",
    size: "",
  },
  lostDate: "",
  lostTime: "",
  lost_place: {
    country: "",
    city: "",
    region: "",
    district: "",
    street: "",
    house_number: "",
    apartment: "",
    postal_code: "",
    full_address: "",
  },
  reward: "",
};

const steps: Step[] = [
  {
    title: "Start here",
    description: "Quick, calm, useful.",
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

export function MissingCatForm() {
  const [intakeId, setIntakeId] = useState(createIntakeId);
  const [createdAt, setCreatedAt] = useState(createTimestamp);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const progress = useMemo(
    () => Math.round(((currentStep + 1) / steps.length) * 100),
    [currentStep]
  );

  const step = steps[currentStep];
  const Icon = step.icon;

  function updateField<Key extends keyof FormData>(key: Key, value: FormData[Key]) {
    setFormData((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function updateOwner<Key extends keyof Owner>(key: Key, value: Owner[Key]) {
    setFormData((current) => ({
      ...current,
      owner: { ...current.owner, [key]: value },
    }));
    setError("");
  }

  function updatePet<Key extends keyof FormData["pet"]>(key: Key, value: FormData["pet"][Key]) {
    setFormData((current) => ({
      ...current,
      pet: { ...current.pet, [key]: value },
    }));
    setError("");
  }

  function updateLostPlace<Key extends keyof FormData["lost_place"]>(key: Key, value: string) {
    setFormData((current) => ({
      ...current,
      lost_place: { ...current.lost_place, [key]: value },
    }));
    setError("");
  }

  function validateStep() {
    if (currentStep === 1) {
      if (!formData.owner.name.trim()) {
        return "Please add your name.";
      }

      if (!formData.owner.email.trim()) {
        return "Please add your email.";
      }
    }

    if (currentStep === 2) {
      if (!formData.pet.name.trim()) {
        return "Please add your cat's name, or write Unknown.";
      }

      if (!formData.pet.gender) {
        return "Please choose your cat's gender.";
      }
    }

    if (currentStep === 3) {
      if (!formData.lostDate) {
        return "Please add the date your cat was last seen.";
      }

      if (!formData.lost_place.city.trim()) {
        return "Please add the city.";
      }
    }

    return "";
  }

  async function goNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
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
    setError("");
  }

  function goBack() {
    setCurrentStep((current) => Math.max(current - 1, 0));
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
    setIntakeId(createIntakeId());
    setCreatedAt(createTimestamp());
    setFormData(initialFormData);
    setCurrentStep(0);
    setError("");
    setSubmitted(false);
  }

  async function persistCase() {
    setIsSaving(true);

    try {
      const petCase = createCaseFromForm(formData, intakeId, createdAt);
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petCase),
      });

      if (!response.ok) {
        return await getIntakeErrorMessage(response);
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
            <span className="font-semibold">Preview case:</span> {formData.pet.name || "Your cat"} last seen in {formData.lost_place.district || "your area"}{formData.lost_place.city ? `, ${formData.lost_place.city}` : ""}.
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
        <div className="flex items-center justify-end gap-4">
          <span className="rounded-full bg-[#f4eee6] px-3 py-1 text-sm font-bold text-[#74675d]">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
        <div className="space-y-2">
          <div className="relative h-8">
            <Badge
              variant="secondary"
              className="absolute top-0 h-8 rounded-full bg-[#ffe6a8] px-3 text-[#7a4b21] shadow-sm transition-[left,transform] duration-300 ease-out"
              style={{ left: `${progress}%`, transform: `translateX(-${progress}%)` }}
            >
              <TriangleAlert className="size-3.5" />
              Almost found your cat
            </Badge>
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
      <CardFooter className="flex items-center justify-between gap-3 bg-white p-5 pt-1 sm:p-6 sm:pt-1">
        <Button
          variant="outline"
          className="h-12 rounded-full border-[#eadfD1] bg-white px-5 text-[#74675d]"
          onClick={goBack}
          disabled={currentStep === 0 || isSaving}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {currentStep === 0 ? (
          <Button className="h-12 rounded-full bg-[#2d251f] px-7 text-white hover:bg-[#46382f]" onClick={goNext} disabled={isSaving}>
            {isSaving ? "Saving" : "Start"}
            <ChevronRight className="size-4" />
          </Button>
        ) : currentStep === steps.length - 1 ? (
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
    </Card>
  );

  function renderStep() {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Your name" required>
                <Input value={formData.owner.name} onChange={(event) => updateOwner("name", event.target.value)} placeholder="Alex" />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={formData.owner.email} onChange={(event) => updateOwner("email", event.target.value)} placeholder="you@example.com" />
              </Field>
            </TwoColumnFields>
            <Field label="Phone number">
              <Input value={formData.owner.phone_number ?? ""} onChange={(event) => updateOwner("phone_number", event.target.value)} placeholder="Optional" />
            </Field>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Cat name" required>
                <Input value={formData.pet.name} onChange={(event) => updatePet("name", event.target.value)} placeholder="Miso" />
              </Field>
              <Field label="Gender" required>
                <OptionGroup options={genderOptions} value={formData.pet.gender} onSelect={(value) => updatePet("gender", value as Pet["gender"])} />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Breed">
                <Input value={formData.pet.breed} onChange={(event) => updatePet("breed", event.target.value)} placeholder="Tabby, Siamese, mixed" />
              </Field>
              <Field label="Breed group">
                <Input value={formData.pet.breed_group} onChange={(event) => updatePet("breed_group", event.target.value)} placeholder="Domestic short hair" />
              </Field>
            </TwoColumnFields>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Date last seen" required>
                <Input type="date" value={formData.lostDate} onChange={(event) => updateField("lostDate", event.target.value)} />
              </Field>
              <Field label="Approximate time">
                <Input type="time" value={formData.lostTime} onChange={(event) => updateField("lostTime", event.target.value)} />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Country">
                <Input value={formData.lost_place.country} onChange={(event) => updateLostPlace("country", event.target.value)} placeholder="US" />
              </Field>
              <Field label="City" required>
                <Input value={formData.lost_place.city} onChange={(event) => updateLostPlace("city", event.target.value)} placeholder="Brooklyn" />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Region">
                <Input value={formData.lost_place.region} onChange={(event) => updateLostPlace("region", event.target.value)} placeholder="NY" />
              </Field>
              <Field label="District or neighborhood">
                <Input value={formData.lost_place.district} onChange={(event) => updateLostPlace("district", event.target.value)} placeholder="Park Slope" />
              </Field>
            </TwoColumnFields>
            <Field label="Full address or landmark">
              <Input value={formData.lost_place.full_address} onChange={(event) => updateLostPlace("full_address", event.target.value)} placeholder="Near 5th Ave and 9th St" />
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
            {formData.pet.photo_urls.length ? (
              <div className="flex flex-wrap gap-2">
                {formData.pet.photo_urls.map((photo) => (
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
              <OptionGroup label="Size" options={sizeOptions} value={formData.pet.size} onSelect={(value) => updatePet("size", value as Size)} />
              <OptionGroup label="Age group" options={ageGroupOptions} value={formData.pet.age_group} onSelect={(value) => updatePet("age_group", value as NonNullable<Pet["age_group"]>)} />
            </TwoColumnFields>
            <Field label="Age in years">
              <Input type="number" min="0" value={formData.pet.age_years} onChange={(event) => updatePet("age_years", event.target.value)} placeholder="3" />
            </Field>
            <Field label="Appearance">
              <Textarea value={formData.pet.appearance} onChange={(event) => updatePet("appearance", event.target.value)} placeholder="Gray tabby, white chest, long fur..." />
            </Field>
            <Field label="Description">
              <Textarea value={formData.pet.description} onChange={(event) => updatePet("description", event.target.value)} placeholder="Responds to treats, shy with strangers..." />
            </Field>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <Field label="Health info">
              <Textarea value={formData.pet.health_info} onChange={(event) => updatePet("health_info", event.target.value)} placeholder="Medication, blind, elderly, injured..." />
            </Field>
            <Field label="Behavior">
              <Textarea value={formData.pet.behavior} onChange={(event) => updatePet("behavior", event.target.value)} placeholder="Friendly, scared, may run, do not chase..." />
            </Field>
            <Field label="Unique details">
              <Textarea value={formData.pet.unique_details} onChange={(event) => updatePet("unique_details", event.target.value)} placeholder="Ear notch, scar, white paws..." />
            </Field>
          </div>
        );
      case 7:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <OptionGroup label="Microchipped" options={yesNoOptions} value={formData.pet.chipped} onSelect={(value) => updatePet("chipped", value as "Yes" | "No")} />
              <OptionGroup label="Wearing collar" options={yesNoOptions} value={formData.pet.collar} onSelect={(value) => updatePet("collar", value as "Yes" | "No")} />
            </TwoColumnFields>
            <Field label="Chip number">
              <Input value={formData.pet.chip_number} onChange={(event) => updatePet("chip_number", event.target.value)} placeholder="Optional" />
            </Field>
          </div>
        );
      case 8:
        return (
          <div className="space-y-5">
            <Field label="Reward">
              <Input value={formData.reward} onChange={(event) => updateField("reward", event.target.value)} placeholder="No reward, reward offered, or amount" />
            </Field>
            <p className="rounded-2xl bg-white/80 p-4 text-sm text-stone-600">
              This is optional and maps directly to the case reward field.
            </p>
          </div>
        );
      default:
        return <ReviewStep formData={formData} />;
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

function createCaseFromForm(formData: FormData, id: string, createdAt: Case["created_at"]): Case {
  const updatedAt = createTimestamp();
  const ageYears = Number(formData.pet.age_years);

  return {
    id,
    owner: {
      name: formData.owner.name.trim(),
      email: formData.owner.email.trim(),
      ...optionalProperty("phone_number", formData.owner.phone_number),
    },
    pet: {
      species: "cat",
      breed: formData.pet.breed.trim(),
      breed_group: formData.pet.breed_group.trim(),
      photo_urls: formData.pet.photo_urls,
      gender: formData.pet.gender || "female",
      ...optionalProperty("age_years", Number.isFinite(ageYears) ? ageYears : undefined),
      ...optionalProperty("age_group", formData.pet.age_group || undefined),
      ...optionalProperty("name", formData.pet.name),
      ...optionalProperty("appearance", formData.pet.appearance),
      ...optionalProperty("description", formData.pet.description),
      ...optionalProperty("health_info", formData.pet.health_info),
      ...optionalProperty("behavior", formData.pet.behavior),
      ...optionalProperty("unique_details", formData.pet.unique_details),
      ...optionalProperty("chipped", yesNoToBoolean(formData.pet.chipped)),
      ...optionalProperty("chip_number", formData.pet.chip_number),
      ...optionalProperty("collar", yesNoToBoolean(formData.pet.collar)),
      ...optionalProperty("size", formData.pet.size || undefined),
    },
    lost_time: createLostTime(formData, updatedAt),
    lost_place: createAddress(formData.lost_place),
    sightings: [],
    created_at: createdAt,
    updated_at: updatedAt,
    ...optionalProperty("reward", formData.reward),
  };
}

function createLostTime(formData: FormData, fallback: Case["updated_at"]) {
  if (!formData.lostDate) {
    return fallback;
  }

  return new Date(`${formData.lostDate}T${formData.lostTime || "00:00"}`).toISOString() as Case["lost_time"];
}

function createAddress(address: FormData["lost_place"]): Address {
  return {
    country: address.country.trim(),
    city: address.city.trim(),
    ...optionalProperty("region", address.region),
    ...optionalProperty("district", address.district),
    ...optionalProperty("street", address.street),
    ...optionalProperty("house_number", address.house_number),
    ...optionalProperty("apartment", address.apartment),
    ...optionalProperty("postal_code", address.postal_code),
    ...optionalProperty("full_address", address.full_address),
  };
}

function optionalProperty<Key extends string, Value>(key: Key, value: Value | undefined) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();

    return trimmedValue ? { [key]: trimmedValue } as Record<Key, string> : {};
  }

  return value === undefined ? {} : { [key]: value } as Record<Key, Value>;
}

function yesNoToBoolean(value: string) {
  if (value === "Yes") {
    return true;
  }

  if (value === "No") {
    return false;
  }
}

function WelcomeStep() {
  return (
    <div className="grid gap-4">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff2d0] px-3 py-1 text-sm font-bold text-[#7a4b21]">
          <Heart className="size-4" />
          Stay hopeful
        </div>
        <p className="mt-4 text-2xl font-black leading-tight text-[#2d251f]">
          A clear post helps people help faster.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.5rem] bg-[#bfe8d5] p-4 text-[#245643]">
          <Camera className="mb-3 size-7" />
          <p className="font-black">Photos</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#ffe6a8] p-4 text-[#7a4b21]">
          <MapPin className="mb-3 size-7" />
          <p className="font-black">Location</p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-bold text-[#2d251f]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
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

function ReviewStep({ formData }: { formData: FormData }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#d07b47]">Preview</p>
            <h3 className="mt-1 text-3xl font-black text-[#2d251f]">
              {formData.pet.name || "Unnamed cat"}
            </h3>
            <p className="mt-1 font-medium text-[#74675d]">
              Last seen {formData.lostDate || "date unknown"} in {formData.lost_place.district || "area unknown"}{formData.lost_place.city ? `, ${formData.lost_place.city}` : ""}.
            </p>
          </div>
          <Cat className="size-10 text-[#d07b47]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Owner" items={[formData.owner.name, formData.owner.email, formData.owner.phone_number ?? ""]} />
        <ReviewCard title="Pet" items={[formData.pet.breed, formData.pet.breed_group, formData.pet.gender, formData.pet.size]} />
        <ReviewCard title="Details" items={[formData.pet.appearance, formData.pet.description, formData.pet.unique_details]} />
        <ReviewCard title="Safety" items={[formData.pet.health_info, formData.pet.behavior]} />
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
