import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";

interface SponsorRow {
  id: string;
  name: string;
  tier: "title" | "platinum" | "gold" | "silver" | "partner";
  description: string | null;
  offer: string | null;
  booth_number: string | null;
}

const tierOrder: Record<SponsorRow["tier"], number> = {
  title: 0,
  platinum: 1,
  gold: 2,
  silver: 3,
  partner: 4,
};

const tierStyles: Record<SponsorRow["tier"], { label: string; card: string; pill: string }> = {
  title: {
    label: "Title sponsor",
    card: "border-gold-300 bg-gold-50",
    pill: "bg-gold-400 text-navy-900",
  },
  platinum: {
    label: "Platinum",
    card: "border-slate-300 bg-slate-50",
    pill: "bg-slate-300 text-navy-900",
  },
  gold: {
    label: "Gold",
    card: "border-gold-200 bg-white",
    pill: "bg-gold-300 text-navy-900",
  },
  silver: {
    label: "Silver",
    card: "border-slate-200 bg-white",
    pill: "bg-slate-200 text-navy-900",
  },
  partner: {
    label: "Partner",
    card: "border-navy-100 bg-white",
    pill: "bg-navy-100 text-navy-700",
  },
};

export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  let sponsors: SponsorRow[] = [];
  let error: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error: dbErr } = await supabase
      .from("sponsors")
      .select("id, name, tier, description, offer, booth_number");
    if (dbErr) error = dbErr.message;
    sponsors = (data as SponsorRow[] | null) ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  sponsors.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
  const byTier = sponsors.reduce<Map<SponsorRow["tier"], SponsorRow[]>>((acc, s) => {
    if (!acc.has(s.tier)) acc.set(s.tier, []);
    acc.get(s.tier)!.push(s);
    return acc;
  }, new Map());

  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Sponsors</h1>
        <p className="text-sm text-navy-500">The companies making this summit happen.</p>
      </header>

      {error || sponsors.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Sponsors coming soon"
          description={
            error
              ? "We can't reach the sponsor list yet. Configure Supabase to see them here."
              : "Sponsor partners are being finalized. Check back closer to May."
          }
        />
      ) : (
        <div className="space-y-6">
          {Array.from(byTier.entries()).map(([tier, items]) => {
            const t = tierStyles[tier];
            return (
              <section key={tier}>
                <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
                  <Award className="h-3.5 w-3.5 text-gold-500" />
                  {t.label}
                </div>
                <ul className="space-y-2">
                  {items.map((s) => (
                    <li
                      key={s.id}
                      className={`rounded-xl border p-4 transition hover:shadow-sm ${t.card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-navy-900">{s.name}</div>
                          {s.description ? (
                            <p className="mt-0.5 text-xs leading-relaxed text-navy-600">
                              {s.description}
                            </p>
                          ) : null}
                          {s.offer ? (
                            <p className="mt-2 text-xs font-medium text-navy-700">{s.offer}</p>
                          ) : null}
                        </div>
                        {s.booth_number ? (
                          <span
                            className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${t.pill}`}
                          >
                            Booth {s.booth_number}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
