"use client";

import { HomeButton } from "@/components/home-button";
import {
  MOCK_MATCHES,
  MatchView,
  NoMatchView,
  UploadView,
  type ViewState,
} from "@/components/found-cat";
import { useState } from "react";

export default function FoundCatPage() {
  const [view, setView] = useState<ViewState>("upload");

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-[#effff6] px-4 py-6 text-[#20362b] sm:px-8 sm:py-10">
      <div className="absolute -left-24 top-10 size-72 rounded-full bg-[#bfe8d5]/80 blur-3xl" />
      <div className="absolute right-0 top-24 size-80 rounded-full bg-[#ffe6a8]/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[#f8c8a7]/50 blur-3xl" />

      <HomeButton className="text-[#476a58] ring-[#b9dec9] focus-visible:ring-[#4f9a78]/30" />

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col justify-center py-8 sm:py-16">
        <div
          className="rounded-[2rem] border-2 border-[#4f9a78] bg-white/85 p-6 shadow-[0_18px_0_#9bcfb4] sm:p-8"
          aria-live="polite"
        >
          {view === "upload" ? (
            <UploadView onSimulate={(result) => setView(result)} />
          ) : view === "no-match" ? (
            <NoMatchView onReset={() => setView("upload")} />
          ) : (
            <MatchView matches={MOCK_MATCHES} onReset={() => setView("upload")} />
          )}
        </div>
      </section>
    </main>
  );
}
