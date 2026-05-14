import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionList } from "./question-list";

export function QASection({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string | null;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
      <QuestionList sessionId={sessionId} userId={userId} />
    </Suspense>
  );
}
