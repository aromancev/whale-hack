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

type FormData = {
  catName: string;
  nickname: string;
  lastSeenDate: string;
  lastSeenTime: string;
  city: string;
  area: string;
  landmark: string;
  photos: string[];
  breed: string;
  mainColor: string;
  secondaryColors: string;
  size: string;
  furLength: string;
  markings: string[];
  otherMarkings: string;
  gender: string;
  age: string;
  spayedNeutered: string;
  collar: string;
  collarColor: string;
  tags: string;
  microchipped: string;
  indoorOutdoor: string;
  behavior: string[];
  sightingInstructions: string;
  ownerName: string;
  email: string;
  phone: string;
  preferredContact: string;
  medicalNeeds: string;
  reward: string;
  extraNotes: string;
};

type Step = {
  title: string;
  description: string;
  icon: typeof Cat;
};

const initialFormData: FormData = {
  catName: "",
  nickname: "",
  lastSeenDate: "",
  lastSeenTime: "",
  city: "",
  area: "",
  landmark: "",
  photos: [],
  breed: "",
  mainColor: "",
  secondaryColors: "",
  size: "",
  furLength: "",
  markings: [],
  otherMarkings: "",
  gender: "",
  age: "",
  spayedNeutered: "",
  collar: "",
  collarColor: "",
  tags: "",
  microchipped: "",
  indoorOutdoor: "",
  behavior: [],
  sightingInstructions: "Take a photo, do not chase, and report the sighting.",
  ownerName: "",
  email: "",
  phone: "",
  preferredContact: "",
  medicalNeeds: "",
  reward: "",
  extraNotes: "",
};

const steps: Step[] = [
  {
    title: "Start here",
    description: "Quick, calm, useful.",
    icon: Cat,
  },
  {
    title: "Cat's name?",
    description: "Name or nickname.",
    icon: PawPrint,
  },
  {
    title: "Last seen?",
    description: "Approximate is okay.",
    icon: Calendar,
  },
  {
    title: "Where?",
    description: "Area first. Exact address optional.",
    icon: MapPin,
  },
  {
    title: "Add photos",
    description: "Best for matching.",
    icon: Camera,
  },
  {
    title: "Appearance",
    description: "Color, size, fur.",
    icon: Sparkles,
  },
  {
    title: "Unique marks",
    description: "Tiny clues help.",
    icon: BadgeCheck,
  },
  {
    title: "Basic details",
    description: "Unknown is fine.",
    icon: Heart,
  },
  {
    title: "ID details",
    description: "Collar, tag, chip.",
    icon: ShieldCheck,
  },
  {
    title: "Behavior",
    description: "Help people act safely.",
    icon: Cat,
  },
  {
    title: "Contact",
    description: "One way is enough.",
    icon: User,
  },
  {
    title: "Extras",
    description: "Reward, meds, notes.",
    icon: Heart,
  },
  {
    title: "Review",
    description: "Looks good?",
    icon: CheckCircle2,
  },
];

const markingOptions = [
  "White paws",
  "Short tail",
  "Ear notch",
  "Scar",
  "Different-colored eyes",
  "Distinct collar",
  "Limp",
];

const behaviorOptions = [
  "Friendly",
  "Shy",
  "Scared",
  "May run",
  "Do not chase",
  "Comes for food",
];

const sizeOptions = ["Small", "Medium", "Large", "Not sure"];
const furOptions = ["Short", "Medium", "Long", "Not sure"];
const genderOptions = ["Female", "Male", "Unknown"];
const yesNoOptions = ["Yes", "No", "Not sure"];
const indoorOptions = ["Indoor only", "Outdoor access", "Mostly outdoor", "Not sure"];
const contactOptions = ["Email", "Phone", "Either"];

export function MissingCatForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
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

  function toggleListValue(key: "markings" | "behavior", value: string) {
    setFormData((current) => {
      const existing = current[key];
      return {
        ...current,
        [key]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
    setError("");
  }

  function validateStep() {
    if (currentStep === 1 && !formData.catName.trim()) {
      return "Please add your cat's name, or write Unknown.";
    }

    if (currentStep === 2 && !formData.lastSeenDate) {
      return "Please add the date your cat was last seen.";
    }

    if (currentStep === 3) {
      if (!formData.city.trim()) {
        return "Please add the city.";
      }

      if (!formData.area.trim()) {
        return "Please add the area or neighborhood.";
      }
    }

    if (currentStep === 10) {
      if (!formData.ownerName.trim()) {
        return "Please add your name.";
      }

      if (!formData.email.trim() && !formData.phone.trim()) {
        return "Please add an email or phone number.";
      }
    }

    return "";
  }

  function goNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
    setError("");
  }

  function goBack() {
    setCurrentStep((current) => Math.max(current - 1, 0));
    setError("");
  }

  function createCasePreview() {
    setSubmitted(true);
  }

  function startOver() {
    setFormData(initialFormData);
    setCurrentStep(0);
    setError("");
    setSubmitted(false);
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
            No request sent yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[2rem] bg-[#f0fbf5] p-5 text-sm font-medium text-[#245643]">
            <span className="font-semibold">Preview case:</span> {formData.catName || "Your cat"} last seen in {formData.area || "your area"}{formData.city ? `, ${formData.city}` : ""}.
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
        <div className="flex items-center justify-between gap-4">
          <Badge variant="secondary" className="h-8 rounded-full bg-[#ffe6a8] px-4 text-[#7a4b21]">
            Missing cat
          </Badge>
          <span className="rounded-full bg-[#f4eee6] px-3 py-1 text-sm font-bold text-[#74675d]">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-[#f4eee6]" />
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
          disabled={currentStep === 0}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {currentStep === 0 ? (
          <Button className="h-12 rounded-full bg-[#2d251f] px-7 text-white hover:bg-[#46382f]" onClick={goNext}>
            Start
            <ChevronRight className="size-4" />
          </Button>
        ) : currentStep === steps.length - 1 ? (
          <Button className="h-12 rounded-full bg-[#245643] px-7 text-white hover:bg-[#1d4737]" onClick={createCasePreview}>
            Create case
            <CheckCircle2 className="size-4" />
          </Button>
        ) : (
          <Button className="h-12 rounded-full bg-[#2d251f] px-7 text-white hover:bg-[#46382f]" onClick={goNext}>
            Continue
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
          <TwoColumnFields>
            <Field label="Cat name" required>
              <Input value={formData.catName} onChange={(event) => updateField("catName", event.target.value)} placeholder="Miso" />
            </Field>
            <Field label="Nickname or sounds they respond to">
              <Input value={formData.nickname} onChange={(event) => updateField("nickname", event.target.value)} placeholder="Treat bag, pspsps, Mimi" />
            </Field>
          </TwoColumnFields>
        );
      case 2:
        return (
          <TwoColumnFields>
            <Field label="Date last seen" required>
              <Input type="date" value={formData.lastSeenDate} onChange={(event) => updateField("lastSeenDate", event.target.value)} />
            </Field>
            <Field label="Approximate time">
              <Input type="time" value={formData.lastSeenTime} onChange={(event) => updateField("lastSeenTime", event.target.value)} />
            </Field>
          </TwoColumnFields>
        );
      case 3:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="City" required>
                <Input value={formData.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Brooklyn" />
              </Field>
              <Field label="Area or neighborhood" required>
                <Input value={formData.area} onChange={(event) => updateField("area", event.target.value)} placeholder="Park Slope" />
              </Field>
            </TwoColumnFields>
            <Field label="Nearby street, park, building, or landmark">
              <Input value={formData.landmark} onChange={(event) => updateField("landmark", event.target.value)} placeholder="Near 5th Ave and 9th St" />
            </Field>
            <p className="rounded-2xl bg-white/80 p-4 text-sm text-stone-600">
              Exact address can stay private.
            </p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <Label htmlFor="photos">Choose cat photos</Label>
            <label htmlFor="photos" className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-amber-300 bg-white/80 p-6 text-center transition hover:bg-amber-50">
              <Camera className="mb-3 size-9 text-amber-700" />
              <span className="font-semibold text-stone-900">Pick photos</span>
              <span className="mt-1 text-sm text-stone-500">Preview only.</span>
            </label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => updateField("photos", Array.from(event.target.files ?? []).map((file) => file.name))}
            />
            {formData.photos.length ? (
              <div className="flex flex-wrap gap-2">
                {formData.photos.map((photo) => (
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
              <Field label="Breed, if known">
                <Input value={formData.breed} onChange={(event) => updateField("breed", event.target.value)} placeholder="Tabby, Siamese, mixed" />
              </Field>
              <Field label="Main color">
                <Input value={formData.mainColor} onChange={(event) => updateField("mainColor", event.target.value)} placeholder="Gray" />
              </Field>
            </TwoColumnFields>
            <Field label="Secondary colors">
              <Input value={formData.secondaryColors} onChange={(event) => updateField("secondaryColors", event.target.value)} placeholder="White chest, black tail" />
            </Field>
            <OptionGroup label="Size" options={sizeOptions} value={formData.size} onSelect={(value) => updateField("size", value)} />
            <OptionGroup label="Fur length" options={furOptions} value={formData.furLength} onSelect={(value) => updateField("furLength", value)} />
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <ChipGroup label="Recognizable details" options={markingOptions} selected={formData.markings} onToggle={(value) => toggleListValue("markings", value)} />
            <Field label="Other markings or details">
              <Textarea value={formData.otherMarkings} onChange={(event) => updateField("otherMarkings", event.target.value)} placeholder="Tiny white spot on nose, clipped left ear, striped tail..." />
            </Field>
          </div>
        );
      case 7:
        return (
          <div className="space-y-5">
            <OptionGroup label="Gender" options={genderOptions} value={formData.gender} onSelect={(value) => updateField("gender", value)} />
            <Field label="Approximate age">
              <Input value={formData.age} onChange={(event) => updateField("age", event.target.value)} placeholder="3 years, kitten, senior" />
            </Field>
            <OptionGroup label="Spayed or neutered?" options={yesNoOptions} value={formData.spayedNeutered} onSelect={(value) => updateField("spayedNeutered", value)} />
          </div>
        );
      case 8:
        return (
          <div className="space-y-5">
            <OptionGroup label="Was your cat wearing a collar?" options={yesNoOptions} value={formData.collar} onSelect={(value) => updateField("collar", value)} />
            <Field label="Collar color">
              <Input value={formData.collarColor} onChange={(event) => updateField("collarColor", event.target.value)} placeholder="Red with bell" />
            </Field>
            <OptionGroup label="Tags?" options={yesNoOptions} value={formData.tags} onSelect={(value) => updateField("tags", value)} />
            <OptionGroup label="Microchipped?" options={yesNoOptions} value={formData.microchipped} onSelect={(value) => updateField("microchipped", value)} />
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <OptionGroup label="Indoor or outdoor status" options={indoorOptions} value={formData.indoorOutdoor} onSelect={(value) => updateField("indoorOutdoor", value)} />
            <ChipGroup label="Behavior" options={behaviorOptions} selected={formData.behavior} onToggle={(value) => toggleListValue("behavior", value)} />
              <Field label="If spotted">
              <Textarea value={formData.sightingInstructions} onChange={(event) => updateField("sightingInstructions", event.target.value)} />
            </Field>
          </div>
        );
      case 10:
        return (
          <div className="space-y-5">
            <TwoColumnFields>
              <Field label="Your name" required>
                <Input value={formData.ownerName} onChange={(event) => updateField("ownerName", event.target.value)} placeholder="Alex" />
              </Field>
              <Field label="Email">
                <Input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@example.com" />
              </Field>
            </TwoColumnFields>
            <TwoColumnFields>
              <Field label="Phone">
                <Input value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Optional" />
              </Field>
              <OptionGroup label="Preferred contact" options={contactOptions} value={formData.preferredContact} onSelect={(value) => updateField("preferredContact", value)} />
            </TwoColumnFields>
          </div>
        );
      case 11:
        return (
          <div className="space-y-5">
            <Field label="Medical needs">
              <Input value={formData.medicalNeeds} onChange={(event) => updateField("medicalNeeds", event.target.value)} placeholder="Medication, blind, elderly, injured..." />
            </Field>
            <Field label="Reward">
              <Input value={formData.reward} onChange={(event) => updateField("reward", event.target.value)} placeholder="No reward, reward offered, or amount" />
            </Field>
            <Field label="Anything else?">
              <Textarea value={formData.extraNotes} onChange={(event) => updateField("extraNotes", event.target.value)} placeholder="Add anything people should know." />
            </Field>
          </div>
        );
      default:
        return <ReviewStep formData={formData} />;
    }
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
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-bold text-[#2d251f]">{label}</Label>
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

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-bold text-[#2d251f]">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Button
              key={option}
              type="button"
              variant={active ? "default" : "outline"}
              className={`h-11 rounded-full px-4 font-bold ${active ? "bg-[#d07b47] text-white hover:bg-[#b86638]" : "border-0 bg-white text-[#74675d]"}`}
              onClick={() => onToggle(option)}
            >
              {active ? <CheckCircle2 className="size-4" /> : null}
              {option}
            </Button>
          );
        })}
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
              {formData.catName || "Unnamed cat"}
            </h3>
            <p className="mt-1 font-medium text-[#74675d]">
              Last seen {formData.lastSeenDate || "date unknown"} in {formData.area || "area unknown"}{formData.city ? `, ${formData.city}` : ""}.
            </p>
          </div>
          <Cat className="size-10 text-[#d07b47]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Appearance" items={[formData.breed, formData.mainColor, formData.secondaryColors, formData.size, formData.furLength]} />
        <ReviewCard title="Recognizable" items={[...formData.markings, formData.otherMarkings]} />
        <ReviewCard title="Safety" items={[formData.indoorOutdoor, ...formData.behavior, formData.sightingInstructions]} />
        <ReviewCard title="Contact" items={[formData.ownerName, formData.preferredContact, formData.email, formData.phone]} />
      </div>
      <Separator className="bg-[#eadfd1]" />
      <p className="text-sm font-medium text-[#74675d]">Local preview only.</p>
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
