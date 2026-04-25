"use client";

import { Camera, Heart, PawPrint, Upload } from "lucide-react";

export function UploadView({
  isUploading,
  onUpload,
}: {
  isUploading: boolean;
  onUpload: (file: File) => void;
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
        We&apos;ll analyze the photo, prefill the pet details, and then search for
        matching missing-cat cases.
      </p>

      <label className="mt-8 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-[#4f9a78] bg-[#e8fff3] p-8 text-center transition hover:bg-[#d8ffeb] focus-within:ring-4 focus-within:ring-[#4f9a78]/25">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onUpload(file);
              event.target.value = "";
            }
          }}
        />
        <span className="mb-5 flex size-20 items-center justify-center rounded-3xl bg-white text-[#4f9a78] shadow-sm">
          <Upload className="size-10" />
        </span>
        <span className="text-2xl font-black tracking-tight">
          {isUploading ? "Analyzing photo..." : "Choose a cat photo"}
        </span>
        <span className="mt-3 max-w-sm text-sm font-semibold leading-6 text-[#5f796b]">
          JPG, PNG, HEIC, or another image from your device.
        </span>
      </label>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#fff8ec] px-4 py-3 text-sm font-bold text-[#7d5b43]">
        <Camera className="size-5 shrink-0" />
        <span>
          After you upload a photo, we&apos;ll extract pet details and ask where
          and when you found them.
        </span>
      </div>
    </>
  );
}
