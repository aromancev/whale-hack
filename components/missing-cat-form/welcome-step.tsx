import { ChevronRight, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";

export function WelcomeStep({ isSaving, onStart }: { isSaving: boolean; onStart: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#fff2d0] px-3 py-1 text-sm font-bold text-[#7a4b21]">
          <Heart className="size-4" />
          Stay hopeful
        </div>
        <p className="mt-4 text-2xl font-black leading-tight text-[#2d251f]">
          A clear post helps people find beloved pet faster.
        </p>
      </div>
      <Button className="mt-5 h-20 rounded-[1.5rem] bg-[#2d251f] text-xl font-black text-white shadow-lg shadow-[#d9b28b]/40 hover:bg-[#46382f]" onClick={onStart} disabled={isSaving}>
        Start
        <ChevronRight className="size-6" />
      </Button>
    </div>
  );
}
