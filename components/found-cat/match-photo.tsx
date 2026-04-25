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
  const fit = size === "lg" ? "bg-contain bg-no-repeat" : "bg-cover";

  if (!photoUrl) {
    const iconSize = size === "lg" ? "size-16" : "size-8";

    return (
      <span
        aria-label={`${name} photo placeholder`}
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-[#f3fbf5] text-[#8ebaa5] shadow-[0_5px_0_#dceadf] ${sizing}`}
        role="img"
      >
        <Cat className={iconSize} />
      </span>
    );
  }

  return (
    <span
      aria-label={`${name} photo`}
      className={`block shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-center shadow-[0_5px_0_#dceadf] ${fit} ${sizing}`}
      role="img"
      style={{ backgroundImage: `url(${photoUrl})` }}
    />
  );
}
