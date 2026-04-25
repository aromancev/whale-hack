"use client";

import { Camera, Heart, PawPrint, Upload } from "lucide-react";
import type { ResultState } from "./types";

export function UploadView({
  onSimulate,
}: {
  onSimulate: (result: ResultState) => void;
}) {
  return (
    <>
      <div className="mb-7 flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#4f9a78] text-white">
          <Heart className="size-7" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d8ffeb] px-3 py-1 text-xs font-bold text-[#245643]">
          Found cat photo
          <PawPrint className="size-3.5" />
        </span>
      </div>

      <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
        Upload a photo of the cat you found.
      </h1>
      <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-[#476a58]">
        We&apos;ll check whether this looks like one of the missing cats.
      </p>

      <label className="mt-8 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-[#4f9a78] bg-[#e8fff3] p-8 text-center transition hover:bg-[#d8ffeb] focus-within:ring-4 focus-within:ring-[#4f9a78]/25">
        <input type="file" accept="image/*" className="sr-only" />
        <span className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-white text-[#4f9a78] shadow-sm">
          <Upload className="size-10" />
        </span>
        <span className="text-2xl font-black tracking-tight">Choose a cat photo</span>
        <span className="mt-3 max-w-sm text-sm font-semibold leading-6 text-[#5f796b]">
          JPG, PNG, HEIC, or another image from your device.
        </span>
      </label>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#fff8ec] px-4 py-3 text-sm font-bold text-[#7d5b43]">
        <Camera className="size-5 shrink-0" />
        <span>After selecting a photo, we&apos;ll show you the result here.</span>
      </div>

      <div className="mt-8 rounded-2xl border-2 border-dashed border-[#cdb892] bg-[#fffaf0] p-4">
        <p className="text-xs font-black uppercase tracking-wide text-[#a07a3f]">
          Dev preview
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#7d5b43]">
          Backend isn&apos;t wired up yet. Use these to jump into a flow.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSimulate("no-match")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f9a78] px-4 py-2 text-sm font-black text-white transition hover:bg-[#3f8063] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4f9a78]/30"
          >
            Simulate: no match
          </button>
          <button
            type="button"
            onClick={() => onSimulate("match")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#cdb892] bg-white px-4 py-2 text-sm font-black text-[#7d5b43] transition hover:bg-[#fff3df] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e58d57]/30"
          >
            Simulate: match found
          </button>
        </div>
      </div>
    </>
  );
}
