import { MissingCatForm } from "@/components/missing-cat-form";
import { HomeButton } from "@/components/home-button";
import type { Case } from "@/domain/case";
import { BarChart3, Cat, Heart, PawPrint, Search } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="cat-landing relative flex min-h-svh overflow-hidden bg-[#fff8ec] px-5 py-8 text-[#2d251f] sm:px-8 lg:px-14">
      <div className="absolute -left-28 top-8 size-72 rounded-full bg-[#f8c8a7]/65 blur-3xl" />
      <div className="absolute right-0 top-12 size-80 rounded-full bg-[#bfe8d5]/75 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-96 -translate-x-1/2 rounded-full bg-[#ffe6a8]/75 blur-3xl" />

      <section className="relative z-10 flex w-full max-w-5xl flex-col justify-center py-10 sm:py-16 lg:py-24">
        <div className="mb-5 flex w-fit items-center gap-2">
          <a
            href="/report.html"
            target="_blank"
            rel="noreferrer"
            aria-label="Learn more about missing cats"
            title="Learn more about missing cats"
            className="group relative inline-flex items-center gap-2 rounded-full border-2 border-[#e58d57] bg-[#fff3df] py-2 pl-2 pr-4 text-sm font-black text-[#9b5733] shadow-[0_5px_0_#e7b888] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ffe5c2] hover:shadow-[0_8px_0_#d99863] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e58d57]/30"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-white/70 transition group-hover:scale-105">
              <BarChart3 className="size-4 transition group-hover:rotate-6 group-hover:scale-105" />
            </span>
            Learn about missing cats
          </a>
          <p className="rounded-full bg-[#e8fff3]/90 px-4 py-2 text-sm font-bold tracking-wide text-[#476a58] shadow-sm ring-1 ring-[#9bcfb4]">
            Find Them Together
          </p>
        </div>

        <h1 className="max-w-3xl text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
          Every pet deserves a quick way home.
        </h1>

        <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-[#74675d] sm:text-xl">
          Start with one simple choice. We&apos;ll help turn panic into a clear
          next steps.
        </p>

        <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 sm:gap-5">
          <Link href="/intake" className="lost-cat-button group min-h-44 rounded-[2rem] border-2 border-[#e58d57] bg-[#fff3df] p-7 text-left shadow-[0_18px_0_#e7b888] transition duration-300 hover:-translate-y-1 hover:bg-[#ffe5c2] hover:shadow-[0_24px_0_#d99863] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e58d57]/35">
            <span className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-[#e58d57] text-white transition group-hover:rotate-[-8deg] group-hover:scale-105">
              <Search className="size-7" />
            </span>
            <span className="block text-3xl font-black tracking-tight sm:text-4xl">
              I&apos;ve lost a cat
            </span>
            <span className="mt-3 block text-base font-semibold leading-6 text-[#7d5b43]">
              Create a missing cat case and get organized fast.
            </span>
          </Link>

          <Link href="/found" className="found-cat-button group min-h-44 rounded-[2rem] border-2 border-[#4f9a78] bg-[#e8fff3] p-7 text-left shadow-[0_18px_0_#9bcfb4] transition duration-300 hover:-translate-y-1 hover:bg-[#d8ffeb] hover:shadow-[0_24px_0_#76b994] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4f9a78]/35">
            <span className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-[#4f9a78] text-white transition group-hover:rotate-6 group-hover:scale-105">
              <Heart className="size-7" />
            </span>
            <span className="block text-3xl font-black tracking-tight sm:text-4xl">
              I found a cat
            </span>
            <span className="mt-3 block text-base font-semibold leading-6 text-[#476a58]">
              Share a sighting so their person can find them.
            </span>
          </Link>
        </div>

      </section>

      <div className="home-cat pointer-events-none absolute bottom-0 right-0 z-0 h-64 w-64 translate-x-8 translate-y-7 sm:h-80 sm:w-80 sm:translate-x-6 sm:translate-y-10 lg:h-[26rem] lg:w-[26rem]" aria-hidden="true">
        <div className="cat-tail" />
        <div className="cat-body" />
        <div className="cat-head">
          <div className="cat-ear cat-ear-left" />
          <div className="cat-ear cat-ear-right" />
          <div className="cat-eye cat-eye-left" />
          <div className="cat-eye cat-eye-right" />
          <div className="cat-nose" />
          <div className="cat-mouth" />
          <div className="cat-blush cat-blush-left" />
          <div className="cat-blush cat-blush-right" />
        </div>
        <div className="cat-paw cat-paw-left" />
        <div className="cat-paw cat-paw-right" />
        <div className="cat-bubble cat-bubble-lost">I&apos;ll help search!</div>
        <div className="cat-bubble cat-bubble-found">Thank you, hero!</div>
      </div>
    </main>
  );
}

export function IntakePage({ initialCase, initialStep }: { initialCase?: Case; initialStep?: number }) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#fff8ec] px-4 py-5 text-[#2d251f] sm:px-6 sm:py-8">
      <div className="absolute -left-24 top-10 size-64 rounded-full bg-[#f8c8a7]/60 blur-3xl" />
      <div className="absolute -right-20 top-52 size-72 rounded-full bg-[#bfe8d5]/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#ffe6a8]/70 blur-3xl" />

      <HomeButton className="text-[#7b563e] ring-[#efd8bd] focus-visible:ring-[#e58d57]/30" />

      <div className="relative mx-auto mb-6 max-w-3xl text-center">
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
          Let&apos;s find them together.
        </h1>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#bfe8d5] px-3 py-1 text-xs font-bold text-[#245643]">
          Cats only for now
          <Cat className="size-3.5" />
        </span>
        <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-3 text-base font-medium leading-7 text-[#74675d]">
          <p>One calm step at a time.</p>
          <span className="relative inline-flex h-7 w-8 shrink-0 -rotate-12 text-[#d07b47]" aria-hidden="true">
            <PawPrint className="absolute bottom-0 left-0 size-4 rotate-[18deg]" />
            <PawPrint className="absolute right-0 top-0 size-4 rotate-[18deg]" />
          </span>
        </div>
      </div>
      <div className="relative">
        <MissingCatForm initialCase={initialCase} initialStep={initialStep} />
      </div>
    </main>
  );
}
