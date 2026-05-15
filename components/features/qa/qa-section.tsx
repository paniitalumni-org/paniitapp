import { createClient } from "@/lib/supabase/server";
import { QaClient, type QuestionRow, type ReplyRow } from "./qa-client";

export async function QaSection({ sessionId }: { sessionId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // session_questions has: question, upvotes, is_answered (boolean). The
  // status/is_anonymous/is_pinned/answered_by/answered_at columns come from
  // 0003_qa_replies.sql; if it hasn't run yet, we degrade gracefully.
  const { data: questions } = await supabase
    .from("session_questions")
    .select("*, profiles:user_id(id, full_name, photo_url, role)")
    .eq("session_id", sessionId)
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false });

  const questionIds = ((questions as QuestionRow[] | null) ?? []).map((q) => q.id);

  const { data: replies } = questionIds.length
    ? await supabase
        .from("question_replies")
        .select(
          "id, question_id, user_id, body, is_official, upvotes, created_at, profiles:user_id(id, full_name, photo_url, role)"
        )
        .in("question_id", questionIds)
        .order("is_official", { ascending: false })
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: true })
    : { data: [] as unknown as ReplyRow[] };

  const { data: myQUpvotes } = user && questionIds.length
    ? await supabase
        .from("question_upvotes")
        .select("question_id")
        .eq("user_id", user.id)
        .in("question_id", questionIds)
    : { data: [] as { question_id: string }[] };

  const replyIds = ((replies as ReplyRow[] | null) ?? []).map((r) => r.id);
  const { data: myRUpvotes } = user && replyIds.length
    ? await supabase
        .from("reply_upvotes")
        .select("reply_id")
        .eq("user_id", user.id)
        .in("reply_id", replyIds)
    : { data: [] as { reply_id: string }[] };

  // Is the current user a speaker for this session?
  let isSpeaker = false;
  if (user) {
    const { data: spk } = await supabase
      .from("session_speakers")
      .select("speaker_id")
      .eq("session_id", sessionId)
      .eq("speaker_id", user.id)
      .maybeSingle();
    isSpeaker = !!spk;
  }

  // Is the current user organizer/admin?
  let isMod = false;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isMod = prof?.role === "organizer" || prof?.role === "admin";
  }

  return (
    <QaClient
      sessionId={sessionId}
      userId={user?.id ?? null}
      isSpeakerHere={isSpeaker}
      isModerator={isMod}
      initialQuestions={(questions as QuestionRow[] | null) ?? []}
      initialReplies={(replies as ReplyRow[] | null) ?? []}
      initialMyQuestionUpvotes={
        ((myQUpvotes as { question_id: string }[] | null) ?? []).map((r) => r.question_id)
      }
      initialMyReplyUpvotes={
        ((myRUpvotes as { reply_id: string }[] | null) ?? []).map((r) => r.reply_id)
      }
    />
  );
}
