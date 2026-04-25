import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-bold text-[#2d251f]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}

export function TwoColumnFields({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

export function OptionGroup({
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
