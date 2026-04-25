import { Input } from "@/components/ui/input";
import type { Pet } from "@/domain/pets";

import { Field, OptionGroup, TwoColumnFields } from "./fields";
import type { UpdatePet } from "./types";

export function IdDetailsStep({
  pet,
  yesNoOptions,
  booleanToYesNo,
  yesNoToBoolean,
  updatePet,
}: {
  pet: Pet;
  yesNoOptions: string[];
  booleanToYesNo: (value: boolean | undefined) => string;
  yesNoToBoolean: (value: string) => boolean | undefined;
  updatePet: UpdatePet;
}) {
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
}
