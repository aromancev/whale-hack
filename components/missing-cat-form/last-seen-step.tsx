import { Input } from "@/components/ui/input";
import { LocationPickerMap } from "@/components/location-picker-map";
import type { Address } from "@/domain/case";

import { Field, TwoColumnFields } from "./fields";
import type { FieldErrorKey, UpdateLostPlace, UpdateLostPlaceFromMap } from "./types";

export function LastSeenStep({
  lostDate,
  lostTime,
  lostPlace,
  fieldErrors,
  updateLostDate,
  updateLostTime,
  updateLostPlace,
  updateLostPlaceFromMap,
}: {
  lostDate: string;
  lostTime: string;
  lostPlace: Address;
  fieldErrors: Partial<Record<FieldErrorKey, string>>;
  updateLostDate: (value: string) => void;
  updateLostTime: (value: string) => void;
  updateLostPlace: UpdateLostPlace;
  updateLostPlaceFromMap: UpdateLostPlaceFromMap;
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
          <Input value={lostPlace.country.toUpperCase()} readOnly aria-readonly="true" className="bg-white/60 text-[#74675d]" />
        </Field>
        <Field label="City" required error={fieldErrors["lost_place.city"]}>
          <Input value={lostPlace.city} onChange={(event) => updateLostPlace("city", event.target.value)} placeholder="Brooklyn" aria-invalid={Boolean(fieldErrors["lost_place.city"])} />
        </Field>
      </TwoColumnFields>
      <LocationPickerMap
        country={lostPlace.country}
        coordinates={lostPlace.coordinates}
        onLocationChange={updateLostPlaceFromMap}
        title="Set the last-seen pin"
        description="Drag the marker or tap the map to place it."
      />
    </div>
  );
}
