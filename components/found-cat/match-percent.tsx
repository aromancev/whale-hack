export function MatchPercent({
  percent,
  size = "md",
}: {
  percent: number;
  size?: "md" | "lg";
}) {
  const tone =
    percent >= 85
      ? "bg-[#4f9a78] text-white"
      : percent >= 70
        ? "bg-[#fff3df] text-[#7d5b43] ring-1 ring-inset ring-[#e7b888]"
        : "bg-white text-[#476a58] ring-1 ring-inset ring-[#b9dec9]";

  const sizing = size === "lg" ? "size-20 text-xl" : "size-14 text-sm";

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl font-black ${sizing} ${tone}`}
      aria-label={`${percent}% match`}
    >
      {percent}%
    </span>
  );
}
