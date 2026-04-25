import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

export function FormNavigation({
  currentStep,
  stepsLength,
  isSaving,
  onBack,
  onNext,
  onCreate,
}: {
  currentStep: number;
  stepsLength: number;
  isSaving: boolean;
  onBack: () => void;
  onNext: () => void;
  onCreate: () => void;
}) {
  if (currentStep === 0) {
    return null;
  }

  return (
    <CardFooter className="flex items-center justify-between gap-3 bg-white p-5 pt-1 sm:p-6 sm:pt-1">
      <Button
        variant="outline"
        className="h-12 rounded-full border-[#eadfD1] bg-white px-5 text-[#74675d]"
        onClick={onBack}
        disabled={isSaving}
      >
        <ChevronLeft className="size-4" />
        Back
      </Button>
      {currentStep === stepsLength - 1 ? (
        <Button className="h-12 rounded-full bg-[#245643] px-7 text-white hover:bg-[#1d4737]" onClick={onCreate} disabled={isSaving}>
          {isSaving ? "Saving" : "Create case"}
          <CheckCircle2 className="size-4" />
        </Button>
      ) : (
        <Button className="h-12 rounded-full bg-[#2d251f] px-7 text-white hover:bg-[#46382f]" onClick={onNext} disabled={isSaving}>
          {isSaving ? "Saving" : "Continue"}
          <ChevronRight className="size-4" />
        </Button>
      )}
    </CardFooter>
  );
}
