import { Input } from "@/components/ui/input";
import type { Case } from "@/domain/case";

import { Field } from "./fields";

export function RewardStep({ petCase, updateReward }: { petCase: Case; updateReward: (value: string) => void }) {
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
}
