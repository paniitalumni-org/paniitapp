import { Users } from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/features/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendeesClient } from "./attendees-client";

export const dynamic = "force-dynamic";

export default function AttendeesPage() {
  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-3">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Network</h1>
        <p className="text-sm text-navy-500">Find founders, VCs, builders &amp; alumni.</p>
      </header>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Loader />
      </Suspense>
    </div>
  );
}

async function Loader() {
  type Row = {
    id: string;
    full_name: string | null;
    role: string | null;
    company: string | null;
    designation: string | null;
    iit_campus: string | null;
    graduation_year: number | null;
    interests: string[] | null;
    avatar_url: string | null;
    office_hours_enabled: boolean | null;
  };
  let attendees: Row[] = [];
  let envOk = true;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, company, designation, iit_campus, graduation_year, interests, avatar_url, office_hours_enabled"
      )
      .eq("onboarded", true)
      .order("full_name", { ascending: true })
      .limit(500);
    attendees = (data as Row[] | null) ?? [];
  } catch {
    envOk = false;
  }
  if (!envOk || attendees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Network coming soon"
        description="As people onboard for the summit, this directory fills up automatically."
      />
    );
  }
  return <AttendeesClient initial={attendees} />;
}
