"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

export function PublicCaseEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={copyEmail}
      className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#e58d57] px-6 py-3 text-base font-black text-white shadow-[0_8px_0_#c0723f] transition hover:-translate-y-0.5 hover:bg-[#d97f47] hover:shadow-[0_10px_0_#a45d33] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e58d57]/30 sm:w-auto"
    >
      <Mail className="size-5" />
      {copied ? "Copied" : "It's them"}
    </button>
  );
}
