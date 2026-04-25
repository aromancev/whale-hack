/* eslint-disable @next/next/no-img-element */
import { Cat } from "lucide-react";

export function MatchPhoto({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string;
  size?: "md" | "lg";
}) {
  const sizing = size === "lg" ? "h-44 w-full sm:h-56" : "size-16";
  const spacing = size === "lg" ? "p-3" : "";
  const imageSizing = size === "lg" ? "max-h-full max-w-full object-contain" : "h-full w-full object-cover";

  if (!photoUrl) {
    const iconSize = size === "lg" ? "size-16" : "size-8";

    return (
      <span
        aria-label={`${name} photo placeholder`}
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-[#f3fbf5] text-[#8ebaa5] shadow-[0_5px_0_#dceadf] ${spacing} ${sizing}`}
        role="img"
      >
        <Cat className={iconSize} />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-[#f3fbf5] shadow-[0_5px_0_#dceadf] ${spacing} ${sizing}`}
    >
      <img
        alt={`${name} photo`}
        className={`rounded-xl ${imageSizing}`}
        src={photoUrl}
      />
    </span>
  );
}
