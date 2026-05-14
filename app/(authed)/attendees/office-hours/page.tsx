import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/features/empty-state";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  full_name: string | null;
  designation: string | null;
  company: string | null;
  avatar_url: string | null;
  role: string | null;
}

export default async function OfficeHoursPage() {
  let rows: Row[] = [];
  let envOk = true;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, designation, company, avatar_url, role")
      .eq("office_hours_enabled", true)
      .eq("onboarded", true)
      .order("full_name", { ascending: true });
    rows = (data as Row[] | null) ?? [];
  } catch {
    envOk = false;
  }

  return (
    <div className="px-4 pb-10 pt-4">
      <Link
        href="/attendees"
        className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Network
      </Link>
      <header className="mt-2 mb-3">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Office hours</h1>
        <p className="text-sm text-navy-500">
          VCs &amp; advisors with 15-min slots open. Book and send a 140-char pitch.
        </p>
      </header>

      {!envOk || rows.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No office hours yet"
          description="When VCs and advisors enable office hours on their profile, they appear here."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/attendees/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50/40 p-3 transition hover:border-gold-400"
              >
                <Avatar>
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={p.full_name ?? ""} /> : null}
                  <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-navy-900">
                    {p.full_name ?? "Attendee"}
                  </div>
                  <div className="truncate text-xs text-navy-500">
                    {[p.designation, p.company].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-navy-900">
                  <Clock className="h-2.5 w-2.5" />
                  Open
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
