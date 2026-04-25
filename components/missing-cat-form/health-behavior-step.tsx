import { Textarea } from "@/components/ui/textarea";
import type { Pet } from "@/domain/pets";

import { Field } from "./fields";
import type { UpdatePet } from "./types";

export function HealthBehaviorStep({ pet, updatePet }: { pet: Pet; updatePet: UpdatePet }) {
  return (
    <div className="space-y-5">
      <Field label="Health info">
        <Textarea value={pet.health_info ?? ""} onChange={(event) => updatePet("health_info", event.target.value)} placeholder="Medication, blind, elderly, injured..." />
      </Field>
      <Field label="Behavior">
        <Textarea value={pet.behavior ?? ""} onChange={(event) => updatePet("behavior", event.target.value)} placeholder="Friendly, scared, may run, do not chase..." />
      </Field>
    </div>
  );
}
