import { MissingCatForm } from "@/components/missing-cat-form";
import type { Case } from "@/domain/case";
import { PawPrint, TriangleAlert } from "lucide-react";

export default function Home() {
  return <IntakePage />;
}

export function IntakePage({ initialCase }: { initialCase?: Case }) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#fff8ec] px-4 py-5 text-[#2d251f] sm:px-6 sm:py-8">
      <div className="absolute -left-24 top-10 size-64 rounded-full bg-[#f8c8a7]/60 blur-3xl" />
      <div className="absolute -right-20 top-52 size-72 rounded-full bg-[#bfe8d5]/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#ffe6a8]/70 blur-3xl" />

      <div className="relative mx-auto mb-6 max-w-3xl text-center">
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
          Let&apos;s find them together.
        </h1>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#bfe8d5] px-3 py-1 text-xs font-bold text-[#245643]">
          <TriangleAlert className="size-3.5" />
          Cats only
        </span>
        <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-3 text-base font-medium leading-7 text-[#74675d]">
          <p>One calm step at a time.</p>
          <span className="relative inline-flex h-7 w-8 shrink-0 -rotate-12 text-[#d07b47]" aria-hidden="true">
            <PawPrint className="absolute bottom-0 left-0 size-4 rotate-[18deg]" />
            <PawPrint className="absolute right-0 top-0 size-4 rotate-[18deg]" />
          </span>
        </div>
      </div>
      <div className="relative">
        <MissingCatForm initialCase={initialCase} />
      </div>
    </main>
  );
}
