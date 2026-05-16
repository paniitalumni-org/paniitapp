"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SponsorTier {
  /** Folder name (e.g. "Title Sponsor") used as the visible heading. */
  name: string;
  /** Public URLs of the tier's logo files. Order = display cycle order. */
  logos: string[];
}

export function SponsorsBoard({ tiers }: { tiers: SponsorTier[] }) {
  if (tiers.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {tiers.map((tier) => (
        <SponsorTierBlock key={tier.name} tier={tier} />
      ))}
    </div>
  );
}

function SponsorTierBlock({ tier }: { tier: SponsorTier }) {
  if (tier.logos.length === 0) return null;
  return (
    <section className="rounded-lg border border-brand-100 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span
          className="block h-5 w-[3px] rounded-full bg-brand-800"
          aria-hidden
        />
        <h3 className="text-[13px] font-semibold tracking-tight text-brand-950">
          {tier.name}
        </h3>
      </div>
      <div className="mt-3">
        <StepMarquee logos={tier.logos} />
      </div>
    </section>
  );
}

// One logo visible at a time. Holds ~1s rest + ~0.4s crossfade then
// advances to the next; loops seamlessly because the index wraps with
// modulo (no DOM remount, just opacity transitions).
function StepMarquee({ logos }: { logos: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (logos.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((c) => (c + 1) % logos.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [logos.length]);

  return (
    <div
      className="relative mx-auto h-20 w-full max-w-[220px] sm:h-24 sm:max-w-[260px]"
      aria-label="Sponsor logo"
    >
      {logos.map((url, idx) => (
        <div
          key={url}
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out",
            idx === active ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={url}
            alt=""
            width={320}
            height={160}
            unoptimized
            sizes="(max-width: 640px) 220px, 260px"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}
