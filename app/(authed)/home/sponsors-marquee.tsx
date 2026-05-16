"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Building2 } from "lucide-react";

interface SponsorCard {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

interface SponsorGroup {
  id: string;
  name: string;
  sponsors: SponsorCard[];
}

export function SponsorsMarquee({ groups }: { groups: SponsorGroup[] }) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <h3 className="text-[12px] font-semibold tracking-tight text-brand-900">
            {group.name}
          </h3>
          <SponsorRow sponsors={group.sponsors} />
        </div>
      ))}
    </div>
  );
}

function SponsorRow({ sponsors }: { sponsors: SponsorCard[] }) {
  const stream = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div className="overflow-hidden py-1">
      <div className="flex w-max animate-sponsor-road-rtl gap-3 pr-3">
        {stream.map((sponsor, index) => (
          <SponsorTile
            key={`${sponsor.id}-${index}`}
            sponsor={sponsor}
            liftDelay={`${(index % sponsors.length) * 0.18}s`}
          />
        ))}
      </div>
    </div>
  );
}

function SponsorTile({
  sponsor,
  liftDelay,
}: {
  sponsor: SponsorCard;
  liftDelay: string;
}) {
  const tile = (
    <div
      className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-3 shadow-sm ring-1 ring-brand-100 sm:size-28"
      style={{ "--sponsor-lift-delay": liftDelay } as CSSProperties}
    >
      <div className="grid size-full animate-sponsor-road-lift place-items-center">
        {sponsor.logo_url ? (
          <Image
            src={sponsor.logo_url}
            alt={sponsor.name}
            width={112}
            height={112}
            className="size-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            <Building2 className="size-5 text-brand-800/65" strokeWidth={1.5} />
            <span className="text-[10px] font-semibold leading-tight text-brand-900/85">
              {sponsor.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!sponsor.website) return tile;

  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={sponsor.name}
      className="transition-opacity hover:opacity-85"
    >
      {tile}
    </a>
  );
}

export function SponsorsLink() {
  return (
    <Link
      href="/sponsors"
      className="text-[12px] font-semibold text-brand-800 hover:text-brand-900"
    >
      View all
    </Link>
  );
}
