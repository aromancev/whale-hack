import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
}
