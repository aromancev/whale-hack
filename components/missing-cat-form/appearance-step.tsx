import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CAT_COLORS, type CatColor } from "@/domain/cats";
import type { Pet, Size } from "@/domain/pets";

import { Field, OptionGroup, TwoColumnFields } from "./fields";
import type { UpdatePet } from "./types";

export function AppearanceStep({
  pet,
  sizeOptions,
  ageGroupOptions,
  updatePet,
}: {
  pet: Pet;
  sizeOptions: Size[];
  ageGroupOptions: NonNullable<Pet["age_group"]>[];
  updatePet: UpdatePet;
}) {
  const selectedColor = pet.color ? formatCatColor(pet.color) : null;

  return (
    <div className="space-y-5">
      <TwoColumnFields>
        <OptionGroup label="Size" options={sizeOptions} value={pet.size ?? ""} onSelect={(value) => updatePet("size", value as Size)} />
        <OptionGroup label="Age group" options={ageGroupOptions} value={pet.age_group ?? ""} onSelect={(value) => updatePet("age_group", value as NonNullable<Pet["age_group"]>)} />
      </TwoColumnFields>
      <Field label="Age in years">
        <Input type="number" min="0" value={pet.age_years?.toString() ?? ""} onChange={(event) => updatePet("age_years", event.target.value ? Number(event.target.value) : undefined)} placeholder="3" />
      </Field>
      <OptionGroup label="Wearing collar" options={yesNoOptions} value={booleanToYesNo(pet.collar)} onSelect={(value) => updatePet("collar", yesNoToBoolean(value))} />
      <Field label="Color">
        <Select value={selectedColor} onValueChange={(value) => updatePet("color", value ? findCatColor(value) : undefined)}>
          <SelectTrigger className="h-12 w-full rounded-full border-0 bg-white px-4 py-2 text-base font-medium text-[#2d251f] shadow-sm">
            <SelectValue placeholder="Choose color" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="h-72 max-h-72 rounded-[1.25rem] bg-white p-2">
            {CAT_COLORS.map((color) => (
              <SelectItem key={color} value={formatCatColor(color)} className="rounded-xl px-3 py-2 text-[#2d251f]">
                {formatCatColor(color)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Unique details">
        <Textarea value={pet.unique_details ?? ""} onChange={(event) => updatePet("unique_details", event.target.value)} placeholder="Ear notch, scar, white paws..." />
      </Field>
    </div>
  );
}

function findCatColor(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const color = CAT_COLORS.find((option) => formatCatColor(option).toLowerCase() === normalizedValue || option === normalizedValue);

  return color as CatColor | undefined;
}

function formatCatColor(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const yesNoOptions = ["Yes", "No"];

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
