import { Users } from "lucide-react";
import { EmptyState } from "@/components/features/empty-state";

export const dynamic = "force-dynamic";

export default function NetworkPage() {
  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">Network</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Search 2,000+ summit attendees by IIT, role, interests, and company.
        </p>
      </header>
      <EmptyState
        icon={Users}
        title="Coming next"
        description="The attendee directory opens in the next build phase."
      />
    </div>
  );
}
