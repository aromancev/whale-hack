import { HomeIcon } from "lucide-react";
import Link from "next/link";

export function HomeButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Back home"
      className={`absolute left-4 top-5 z-20 inline-flex size-11 items-center justify-center rounded-full bg-white/75 shadow-sm ring-1 transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 sm:left-6 sm:top-8 ${className}`}
    >
      <HomeIcon className="size-5" />
    </Link>
  );
}
