import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/features/empty-state";
import { initials } from "@/lib/utils";

interface Row {
  id: string;
  full_name: string | null;
  designation: string | null;
  company: string | null;
  avatar_url: string | null;
  role: string | null;
  iit_campus: string | null;
}

export const dynamic = "force-dynamic";

export default async function OfficeHoursPage() {
  let rows: Row[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, designation, company, avatar_url, role, iit_campus")
      .eq("office_hours_enabled", true)
      .in("role", ["vc", "alumni"])
      .order("full_name", { ascending: true, nullsFirst: false });
    rows = (data as Row[] | null) ?? [];
  } catch {
    rows = [];
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <div>
        <Link
          href="/attendees"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Network
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-900">
          Office Hours
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          VCs and senior alumni open to a 15-minute meeting today.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nobody open right now"
          description="Check back later — people turn this on and off through the day."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/attendees/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {p.avatar_url ? <AvatarImage src={p.avatar_url} alt="" /> : null}
                  <AvatarFallback className="bg-brand-50 text-brand-800">
                    {initials(p.full_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-brand-900 truncate">
                    {p.full_name ?? "Attendee"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {[p.designation, p.company].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {p.role ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700">
                    {p.role}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
