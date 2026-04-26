import { useEffect, useState } from "react";
import { Camera } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Pet } from "@/domain/pets";

import type { UpdatePet } from "./types";

export function PhotosStep({ pet, updatePet, uploadPhotos }: { pet: Pet; updatePet: UpdatePet; uploadPhotos: (files: File[]) => void }) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const visiblePhotos = previewUrls.length ? previewUrls : pet.photo_urls;

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return (
    <div className="space-y-5">
      <Label htmlFor="photos">Choose cat photos</Label>
      <label htmlFor="photos" className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-amber-300 bg-white/80 p-6 text-center transition hover:bg-amber-50">
        <Camera className="mb-3 size-9 text-amber-700" />
        <span className="font-semibold text-stone-900">Pick photos</span>
        <span className="mt-1 text-sm text-stone-500"></span>
      </label>
      <Input
        id="photos"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
          updatePet("photo_urls", []);
          uploadPhotos(files);
          event.target.value = "";
        }}
      />
      {visiblePhotos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visiblePhotos.map((photo, index) => (
            <div
              key={photo}
              aria-label={`Selected cat photo ${index + 1}`}
              className="aspect-square rounded-2xl border border-amber-100 bg-cover bg-center bg-no-repeat shadow-sm"
              role="img"
              style={{ backgroundImage: `url(${photo})` }}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">Add at least one clear photo: JPG, PNG, JPEG</p>
      )}
    </div>
  );
}
