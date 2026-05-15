import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/features/empty-state";

export const dynamic = "force-dynamic";

export default function MeetingsPage() {
  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Meetings</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Request, accept, and manage 1:1 conversations during the summit.
        </p>
      </header>
      <EmptyState
        icon={CalendarClock}
        title="Coming next"
        description="The meeting scheduler opens in the next build phase."
      />
    </div>
  );
}
