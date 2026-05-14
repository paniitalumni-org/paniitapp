import { Users } from "lucide-react";
import { EmptyState } from "@/components/features/empty-state";

export default function AttendeesPage() {
  return (
    <div className="px-4 pb-10 pt-4">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-navy-900">Network</h1>
        <p className="text-sm text-navy-500">2,000+ attendees — search, filter, connect.</p>
      </header>
      <EmptyState
        icon={Users}
        title="Directory coming in Phase 2"
        description="Search by name, IIT, interests, role and discover the right people for your day."
      />
    </div>
  );
}
