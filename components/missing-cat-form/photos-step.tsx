import { Camera } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Pet } from "@/domain/pets";

import type { UpdatePet } from "./types";

export function PhotosStep({ pet, updatePet, uploadPhotos }: { pet: Pet; updatePet: UpdatePet; uploadPhotos: (files: File[]) => void }) {
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
          updatePet("photo_urls", files.map((file) => file.name));
          uploadPhotos(files);
        }}
      />
      {pet.photo_urls.length ? (
        <div className="flex flex-wrap gap-2">
          {pet.photo_urls.map((photo) => (
            <Badge key={photo} variant="outline" className="h-7 rounded-full bg-white px-3 text-stone-700">
              {photo}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">Add at least one clear photo: JPG, PNG, JPEG</p>
      )}
    </div>
  );
}
