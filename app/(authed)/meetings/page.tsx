import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/features/empty-state";

export default function MeetingsPage() {
  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Meetings</h1>
        <p className="text-sm text-navy-500">Inbox, sent, calendar.</p>
      </header>
      <EmptyState
        icon={CalendarClock}
        title="Meeting scheduler arrives in Phase 3"
        description="Three-slot proposals, conflict resolution, alternates and accepted-meeting chat — all in one place."
      />
    </div>
  );
}
