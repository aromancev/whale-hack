"use client";

import { useState } from "react";
import { Heart, PawPrint } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Case } from "@/domain/case";

import { Field } from "./fields";

export function RewardStep({ petCase, updateReward }: { petCase: Case; updateReward: (value: string) => void }) {
  const [isRewardEnabled, setIsRewardEnabled] = useState(() => Boolean(petCase.reward));

  function toggleReward() {
    const nextEnabled = !isRewardEnabled;
    setIsRewardEnabled(nextEnabled);

    if (!nextEnabled) {
      updateReward("");
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        aria-pressed={isRewardEnabled}
        onClick={toggleReward}
        className={`group flex w-full items-center justify-between gap-4 rounded-[2rem] p-4 text-left shadow-sm transition-all ${isRewardEnabled ? "bg-[#2d251f] text-white" : "bg-white text-[#2d251f] hover:-translate-y-0.5"}`}
      >
        <span>
          <span className="block text-lg font-black">Do you want to offer a reward?</span>
          <span className={`mt-1 block text-sm font-medium ${isRewardEnabled ? "text-white/75" : "text-[#74675d]"}`}>
            {isRewardEnabled ? "Paws crossed, reward is enabled." : "Tap the paw if you want to offer a reward."}
          </span>
        </span>
        <span className={`grid size-14 shrink-0 place-items-center rounded-full transition-transform group-hover:rotate-12 ${isRewardEnabled ? "bg-[#f8c8a7] text-[#2d251f]" : "bg-[#f4eee6] text-[#d07b47]"}`}>
          <PawPrint className="size-7" />
        </span>
      </button>

      {isRewardEnabled ? (
        <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto]">
          <Field label="Reward amount">
            <Input value={petCase.reward ?? ""} onChange={(event) => updateReward(event.target.value)} placeholder="100 euro, 200 euro, more?" />
          </Field>
          <div className="relative mx-auto size-32 sm:size-36" aria-hidden="true">
            <div className="absolute -right-2 -top-3 z-10 rounded-full bg-[#f8c8a7] px-3 py-1 text-sm font-black text-[#2d251f] shadow-sm animate-bounce">
              yay!
            </div>
            <Heart className="absolute -left-2 top-6 z-10 size-5 rotate-[-14deg] fill-[#f8c8a7] text-[#d07b47] animate-pulse" />
            <Heart className="absolute right-4 top-10 z-10 size-4 rotate-12 fill-[#f8c8a7] text-[#d07b47] animate-pulse" />
            <Heart className="absolute bottom-5 left-2 z-10 size-4 rotate-[-8deg] fill-[#f8c8a7] text-[#d07b47] animate-pulse" />
            <div className="result-happy-cat size-full">
              <div className="result-cat-tail" />
              <div className="result-cat-body" />
              <div className="result-cat-head">
                <div className="result-cat-ear result-cat-ear-left" />
                <div className="result-cat-ear result-cat-ear-right" />
                <div className="result-cat-eye result-cat-eye-left" />
                <div className="result-cat-eye result-cat-eye-right" />
                <div className="result-cat-nose" />
                <div className="result-cat-mouth" />
              </div>
              <div className="result-cat-paw result-cat-paw-left" />
              <div className="result-cat-paw result-cat-paw-right" />
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
