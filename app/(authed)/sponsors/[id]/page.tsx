import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, ExternalLink, Gift, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CopyCode } from "./copy-code";

export const dynamic = "force-dynamic";

interface SponsorRow {
  id: string;
  name: string;
  tier: "title" | "platinum" | "gold" | "silver" | "partner";
  description: string | null;
  offer: string | null;
  offer_code: string | null;
  booth_number: string | null;
  website_url: string | null;
  logo_url: string | null;
}

const tierLabel: Record<SponsorRow["tier"], string> = {
  title: "Title sponsor",
  platinum: "Platinum partner",
  gold: "Gold partner",
  silver: "Silver partner",
  partner: "Partner",
};

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let sponsor: SponsorRow | null = null;
  let envOk = true;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sponsors")
      .select(
        "id, name, tier, description, offer, offer_code, booth_number, website_url, logo_url"
      )
      .eq("id", id)
      .maybeSingle();
    sponsor = (data as SponsorRow | null) ?? null;
  } catch {
    envOk = false;
  }

  if (!sponsor && envOk) notFound();
  if (!sponsor) {
    return (
      <div className="px-4 pt-4">
        <Link
          href="/sponsors"
          className="inline-flex items-center gap-1 text-sm text-navy-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Sponsors
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="bg-paniit-gradient px-4 pb-6 pt-4 text-white">
        <Link
          href="/sponsors"
          className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Sponsors
        </Link>
        <div className="mt-4 flex items-start gap-4">
          {sponsor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sponsor.logo_url}
              alt={sponsor.name}
              className="h-16 w-16 rounded-lg bg-white p-2 object-contain ring-1 ring-white/20"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-white/15 ring-1 ring-white/20">
              <span className="font-serif text-lg font-bold">{sponsor.name[0]}</span>
            </div>
          )}
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-200">
              <Award className="h-3 w-3" />
              {tierLabel[sponsor.tier]}
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold text-balance">{sponsor.name}</h1>
            {sponsor.booth_number ? (
              <div className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">
                <MapPin className="h-3 w-3" />
                Booth {sponsor.booth_number}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {sponsor.description ? (
        <section className="mt-6 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            About
          </h2>
          <p className="font-serif text-[15px] leading-relaxed text-navy-800">
            {sponsor.description}
          </p>
        </section>
      ) : null}

      {sponsor.offer ? (
        <section className="mt-6 px-4">
          <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-gold-700" />
              <h3 className="text-sm font-semibold text-gold-700">Attendee offer</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-navy-800">{sponsor.offer}</p>
            {sponsor.offer_code ? <CopyCode code={sponsor.offer_code} /> : null}
          </div>
        </section>
      ) : null}

      <section className="mt-6 px-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          {sponsor.booth_number ? (
            <Button variant="outline" asChild className="flex-1">
              <Link href="/map">
                <MapPin className="h-4 w-4" />
                Find on map
              </Link>
            </Button>
          ) : null}
          {sponsor.website_url ? (
            <Button variant="outline" asChild className="flex-1">
              <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Visit website
              </a>
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

