"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";

export function NoMatchView({ onReset }: { onReset: () => void }) {
  return (
    <div className="result-view flex flex-col items-center text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#d8ffeb] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#245643]">
        <CheckCircle2 className="size-4" />
        No match found
      </span>

      <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
        This cat is not missing.
      </h1>
      <p className="mt-5 max-w-md text-lg font-medium leading-8 text-[#476a58]">
        We didn&apos;t find a matching missing-cat report for this photo. They
        likely have a home nearby — thanks for caring enough to check.
      </p>

      <div className="result-happy-cat mt-10 h-56 w-56" aria-hidden="true">
        <div className="result-cat-tail" />
        <div className="result-cat-body" />
        <div className="result-cat-head">
          <div className="result-cat-ear result-cat-ear-left" />
          <div className="result-cat-ear result-cat-ear-right" />
          <div className="result-cat-eye result-cat-eye-left" />
          <div className="result-cat-eye result-cat-eye-right" />
          <div className="result-cat-nose" />
          <div className="result-cat-mouth" />
        </div>
        <div className="result-cat-paw result-cat-paw-left" />
        <div className="result-cat-paw result-cat-paw-right" />
        <div className="result-cat-heart">♥</div>
      </div>

      <button
        type="button"
        className="mt-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4f9a78] px-6 py-3 text-base font-black text-white shadow-[0_8px_0_#3f8063] transition hover:-translate-y-0.5 hover:bg-[#3f8063] hover:shadow-[0_10px_0_#2f6049] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4f9a78]/30"
        onClick={onReset}
      >
        <RotateCcw className="size-5" />
        Check another photo
      </button>
    </div>
  );
}
