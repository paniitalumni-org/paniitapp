import Image from "next/image";

export interface SponsorTier {
  /** Folder name (e.g. "Title Sponsor") used as the visible row label. */
  name: string;
  /** Public URLs of the tier's logo files. Order = marquee order. */
  logos: string[];
}

// One white card. Each tier is a row inside it: a small label with a
// vertical brand bar, then the logos sliding right-to-left in a smooth
// continuous loop. No sponsor names anywhere in the UI — logos only.
export function SponsorsBoard({ tiers }: { tiers: SponsorTier[] }) {
  const visible = tiers.filter((t) => t.logos.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="rounded-lg border border-brand-100 bg-white p-5">
      <h2 className="text-base font-semibold tracking-tight text-brand-950">
        Sponsors
      </h2>
      <div className="mt-4 flex flex-col gap-5">
        {visible.map((tier) => (
          <TierRow key={tier.name} tier={tier} />
        ))}
      </div>
    </section>
  );
}

function TierRow({ tier }: { tier: SponsorTier }) {
  // Duplicate so the marquee loops seamlessly via translateX(-50%).
  const stream = [...tier.logos, ...tier.logos];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <span className="block h-4 w-[3px] rounded-full bg-brand-800" aria-hidden />
        <h3 className="text-[12px] font-semibold tracking-tight text-brand-900">
          {tier.name}
        </h3>
      </div>
      <div className="overflow-hidden">
        <div className="flex w-max animate-sponsor-slide-rtl items-center gap-8 py-1 sm:gap-10">
          {stream.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="grid h-14 w-28 shrink-0 place-items-center sm:h-16 sm:w-32"
              aria-hidden={i >= tier.logos.length}
            >
              <Image
                src={url}
                alt=""
                width={240}
                height={120}
                unoptimized
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
