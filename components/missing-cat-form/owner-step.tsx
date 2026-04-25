import { Input } from "@/components/ui/input";
import type { Case } from "@/domain/case";

import { Field, TwoColumnFields } from "./fields";
import type { FieldErrorKey, UpdateOwner } from "./types";

export function OwnerStep({
  petCase,
  fieldErrors,
  updateOwner,
}: {
  petCase: Case;
  fieldErrors: Partial<Record<FieldErrorKey, string>>;
  updateOwner: UpdateOwner;
}) {
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
}
