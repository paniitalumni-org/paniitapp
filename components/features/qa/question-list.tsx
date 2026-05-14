import { MessagesSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QAClient } from "./qa-client";

export interface QuestionRow {
  id: string;
  session_id: string;
  user_id: string;
  body: string;
  upvotes: number | null;
  is_anonymous: boolean | null;
  is_pinned: boolean | null;
  status: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

export async function QuestionList({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string | null;
}) {
  let questions: QuestionRow[] = [];
  let upvotedIds: string[] = [];
  let canModerate = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("session_questions")
      .select(
        "id, session_id, user_id, body, upvotes, is_anonymous, is_pinned, status, answered_by, answered_at, created_at, author:profiles!session_questions_user_id_fkey(id, full_name, avatar_url, role)"
      )
      .eq("session_id", sessionId)
      .order("is_pinned", { ascending: false })
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });
    questions = ((data as unknown) as QuestionRow[]) ?? [];

    if (userId) {
      const { data: ups } = await supabase
        .from("question_upvotes")
        .select("question_id")
        .eq("user_id", userId)
        .in(
          "question_id",
          questions.map((q) => q.id)
        );
      upvotedIds = (ups ?? []).map((r: { question_id: string }) => r.question_id);

      const { data: meRoleRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      const meRole = meRoleRow?.role;
      const { data: isSpeakerRow } = await supabase
        .from("session_speakers")
        .select("speaker_id")
        .eq("session_id", sessionId)
        .eq("speaker_id", userId)
        .maybeSingle();
      canModerate =
        meRole === "organizer" || meRole === "admin" || !!isSpeakerRow;
    }
  } catch {
    // env not configured
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy-200 bg-white p-6 text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-gold-50 text-gold-600">
          <MessagesSquare className="h-4 w-4" />
        </div>
        <p className="mt-3 text-sm font-semibold text-navy-900">
          Be the first to ask
        </p>
        <p className="mt-1 text-xs text-navy-500">Speakers are watching this thread.</p>
        <div className="mt-4">
          <QAClient
            sessionId={sessionId}
            userId={userId}
            initialQuestions={[]}
            initialUpvotes={[]}
            canModerate={canModerate}
            onlyForm
          />
        </div>
      </div>
    );
  }

  return (
    <QAClient
      sessionId={sessionId}
      userId={userId}
      initialQuestions={questions}
      initialUpvotes={upvotedIds}
      canModerate={canModerate}
    />
  );
}
