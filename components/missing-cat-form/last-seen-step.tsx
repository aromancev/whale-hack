import { Input } from "@/components/ui/input";
import type { Address } from "@/domain/case";

import { Field, TwoColumnFields } from "./fields";
import type { FieldErrorKey, UpdateLostPlace } from "./types";

export function LastSeenStep({
  lostDate,
  lostTime,
  lostPlace,
  fieldErrors,
  updateLostDate,
  updateLostTime,
  updateLostPlace,
}: {
  lostDate: string;
  lostTime: string;
  lostPlace: Address;
  fieldErrors: Partial<Record<FieldErrorKey, string>>;
  updateLostDate: (value: string) => void;
  updateLostTime: (value: string) => void;
  updateLostPlace: UpdateLostPlace;
}) {
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
          <Input value={lostPlace.country} onChange={(event) => updateLostPlace("country", event.target.value)} placeholder="nl" />
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
}
