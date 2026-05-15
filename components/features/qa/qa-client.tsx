"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronUp, MessageCircle, User as UserIcon, ShieldCheck, Pin, MoreHorizontal, Check, X, Loader2, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import type { QuestionRow } from "./question-list";

type Sort = "top" | "recent" | "mine" | "answered";

interface ReplyRow {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  is_official: boolean | null;
  upvotes: number | null;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

function pseudonymFor(userId: string): string {
  // Deterministic short ID like "Attendee #347" derived from user_id.
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  const n = (Math.abs(hash) % 900) + 100;
  return `Attendee #${n}`;
}

export function QAClient({
  sessionId,
  userId,
  initialQuestions,
  initialUpvotes,
  canModerate,
  onlyForm = false,
}: {
  sessionId: string;
  userId: string | null;
  initialQuestions: QuestionRow[];
  initialUpvotes: string[];
  canModerate: boolean;
  onlyForm?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [upvotes, setUpvotes] = useState<Set<string>>(new Set(initialUpvotes));
  const [sort, setSort] = useState<Sort>("top");
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [pending, setPending] = useState(false);
  const [openReplies, setOpenReplies] = useState<string | null>(null);

  useEffect(() => {
    const ch = supabase
      .channel(`qa:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_questions", filter: `session_id=eq.${sessionId}` },
        () => {
          refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "question_upvotes" },
        () => {
          refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function refresh() {
    const { data } = await supabase
      .from("session_questions")
      .select(
        "id, session_id, user_id, body, upvotes, is_anonymous, is_pinned, status, answered_by, answered_at, created_at, author:profiles!session_questions_user_id_fkey(id, full_name, avatar_url, role)"
      )
      .eq("session_id", sessionId)
      .order("is_pinned", { ascending: false })
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setQuestions((data as unknown) as QuestionRow[]);
    if (userId) {
      const ids = ((data as unknown) as QuestionRow[] | null)?.map((q) => q.id) ?? [];
      if (ids.length > 0) {
        const { data: ups } = await supabase
          .from("question_upvotes")
          .select("question_id")
          .eq("user_id", userId)
          .in("question_id", ids);
        setUpvotes(new Set((ups ?? []).map((r: { question_id: string }) => r.question_id)));
      }
    }
  }

  async function postQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast({ title: "Sign in to ask", variant: "destructive" });
      return;
    }
    if (body.trim().length < 3) {
      toast({ title: "Ask a real question", description: "At least 3 characters." });
      return;
    }
    setPending(true);
    const { error } = await supabase.from("session_questions").insert({
      session_id: sessionId,
      user_id: userId,
      body: body.trim(),
      is_anonymous: anon,
    });
    setPending(false);
    if (error) {
      toast({
        title: "Couldn't post",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setBody("");
    setAnon(false);
    toast({ title: "Posted", description: "Speakers can now see your question." });
  }

  async function toggleUpvote(qid: string) {
    if (!userId) {
      toast({ title: "Sign in to upvote", variant: "destructive" });
      return;
    }
    const have = upvotes.has(qid);
    // optimistic
    setUpvotes((prev) => {
      const next = new Set(prev);
      if (have) next.delete(qid);
      else next.add(qid);
      return next;
    });
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, upvotes: (q.upvotes ?? 0) + (have ? -1 : 1) } : q
      )
    );
    if (have) {
      await supabase.from("question_upvotes").delete().eq("user_id", userId).eq("question_id", qid);
    } else {
      await supabase.from("question_upvotes").upsert({ user_id: userId, question_id: qid });
    }
  }

  async function moderate(qid: string, action: "answer" | "pin" | "dismiss" | "restore") {
    if (!userId) return;
    const patch: Record<string, unknown> =
      action === "answer"
        ? { status: "answered", answered_by: userId, answered_at: new Date().toISOString() }
        : action === "pin"
        ? { is_pinned: true }
        : action === "dismiss"
        ? { status: "dismissed" }
        : { status: "open", is_pinned: false };
    const { error } = await supabase.from("session_questions").update(patch).eq("id", qid);
    if (error) toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
  }

  const sortedFiltered = useMemo(() => {
    let list = [...questions];
    if (sort === "mine" && userId) list = list.filter((q) => q.user_id === userId);
    if (sort === "answered") list = list.filter((q) => q.status === "answered");
    else list = list.filter((q) => q.status !== "dismissed");
    list.sort((a, b) => {
      if ((b.is_pinned ? 1 : 0) !== (a.is_pinned ? 1 : 0))
        return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
      if (sort === "recent")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b.upvotes ?? 0) - (a.upvotes ?? 0);
    });
    return list;
  }, [questions, sort, userId]);

  if (onlyForm) {
    return (
      <AskForm
        body={body}
        setBody={setBody}
        anon={anon}
        setAnon={setAnon}
        pending={pending}
        onSubmit={postQuestion}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* sort tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {(["top", "recent", "mine", "answered"] as Sort[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition",
              sort === s
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
            )}
          >
            {s === "top" ? "Top" : s === "recent" ? "Recent" : s === "mine" ? "My questions" : "Answered"}
          </button>
        ))}
      </div>

      {/* ask form */}
      <AskForm
        body={body}
        setBody={setBody}
        anon={anon}
        setAnon={setAnon}
        pending={pending}
        onSubmit={postQuestion}
      />

      <ul className="space-y-2">
        {sortedFiltered.map((q) => {
          const isMine = q.user_id === userId;
          const isAnon = q.is_anonymous;
          const displayName = isAnon ? pseudonymFor(q.user_id) : q.author?.full_name ?? "Attendee";
          const isOrganizerLike = q.author?.role === "organizer" || q.author?.role === "admin";
          return (
            <li
              key={q.id}
              className={cn(
                "rounded-xl border bg-white p-3.5 transition",
                q.is_pinned ? "border-gold-300" : "border-navy-100"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  {isAnon ? (
                    <AvatarFallback className="bg-navy-100 text-navy-500">··</AvatarFallback>
                  ) : (
                    <>
                      {q.author?.avatar_url ? (
                        <AvatarImage src={q.author.avatar_url} alt={displayName} />
                      ) : null}
                      <AvatarFallback>{initials(displayName)}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-navy-900">{displayName}</span>
                    {isOrganizerLike && !isAnon ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-navy-700" aria-label="Verified" />
                    ) : null}
                    <span className="text-navy-400">
                      · {formatDistanceToNowStrict(new Date(q.created_at))} ago
                    </span>
                    {q.is_pinned ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-50 px-1.5 py-0.5 text-[10px] font-semibold text-gold-700">
                        <Pin className="h-2.5 w-2.5" />
                        Pinned
                      </span>
                    ) : null}
                    {q.status === "answered" ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Check className="h-2.5 w-2.5" />
                        Answered
                      </span>
                    ) : null}
                    {isMine ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-700">
                        <UserIcon className="h-2.5 w-2.5" />
                        Your question
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[15px] font-medium leading-snug text-navy-900">{q.body}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleUpvote(q.id)}
                      aria-pressed={upvotes.has(q.id)}
                      aria-label="Upvote"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition",
                        upvotes.has(q.id)
                          ? "border-navy-800 bg-navy-800 text-white"
                          : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
                      )}
                    >
                      <ChevronUp className={cn("h-3.5 w-3.5", upvotes.has(q.id) && "scale-110")} />
                      <span className="tabular-nums">{q.upvotes ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenReplies((cur) => (cur === q.id ? null : q.id))}
                      className="inline-flex items-center gap-1 rounded-full border border-navy-200 bg-white px-2 py-0.5 text-xs font-medium text-navy-700 transition hover:border-navy-400"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Reply
                    </button>
                    {canModerate ? (
                      <ModMenu
                        onAnswer={() => moderate(q.id, "answer")}
                        onPin={() => moderate(q.id, "pin")}
                        onDismiss={() => moderate(q.id, "dismiss")}
                        onRestore={() => moderate(q.id, "restore")}
                      />
                    ) : null}
                  </div>
                  {openReplies === q.id ? (
                    <ReplyThread questionId={q.id} userId={userId} />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AskForm({
  body,
  setBody,
  anon,
  setAnon,
  pending,
  onSubmit,
}: {
  body: string;
  setBody: (v: string) => void;
  anon: boolean;
  setAnon: (v: boolean) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-navy-100 bg-white p-3">
      <Textarea
        placeholder="Ask the speakers anything…"
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 280))}
        maxLength={280}
        className="min-h-[64px] border-0 p-0 focus-visible:ring-0"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="inline-flex select-none items-center gap-1.5 text-xs text-navy-600">
          <input
            type="checkbox"
            checked={anon}
            onChange={(e) => setAnon(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-navy-300 text-navy-800"
          />
          Post anonymously
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-navy-400">{body.length}/280</span>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ask"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ModMenu({
  onAnswer,
  onPin,
  onDismiss,
  onRestore,
}: {
  onAnswer: () => void;
  onPin: () => void;
  onDismiss: () => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-grid h-7 w-7 place-items-center rounded-full border border-navy-200 bg-white text-navy-700 hover:border-navy-400"
        aria-label="Moderate"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-navy-100 bg-white p-1 shadow-lg">
          {[
            { label: "Mark answered", icon: Check, action: onAnswer },
            { label: "Pin", icon: Pin, action: onPin },
            { label: "Dismiss", icon: X, action: onDismiss },
            { label: "Restore", icon: RotateCcw, action: onRestore },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setOpen(false);
                opt.action();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-navy-800 hover:bg-navy-50"
            >
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReplyThread({
  questionId,
  userId,
}: {
  questionId: string;
  userId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase
        .from("question_replies")
        .select(
          "id, question_id, user_id, body, is_official, upvotes, created_at, author:profiles!question_replies_user_id_fkey(id, full_name, avatar_url, role)"
        )
        .eq("question_id", questionId)
        .order("is_official", { ascending: false })
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: true });
      if (isMounted) setReplies(((data as unknown) as ReplyRow[]) ?? []);
    })();

    const ch = supabase
      .channel(`replies:${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "question_replies",
          filter: `question_id=eq.${questionId}`,
        },
        async () => {
          const { data } = await supabase
            .from("question_replies")
            .select(
              "id, question_id, user_id, body, is_official, upvotes, created_at, author:profiles!question_replies_user_id_fkey(id, full_name, avatar_url, role)"
            )
            .eq("question_id", questionId)
            .order("is_official", { ascending: false })
            .order("upvotes", { ascending: false })
            .order("created_at", { ascending: true });
          setReplies(((data as unknown) as ReplyRow[]) ?? []);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(ch);
    };
  }, [questionId, supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast({ title: "Sign in to reply", variant: "destructive" });
      return;
    }
    if (body.trim().length < 1) return;
    setPending(true);
    const { error } = await supabase.from("question_replies").insert({
      question_id: questionId,
      user_id: userId,
      body: body.trim().slice(0, 500),
    });
    setPending(false);
    if (error) {
      toast({ title: "Couldn't reply", description: error.message, variant: "destructive" });
      return;
    }
    setBody("");
  }

  return (
    <div className="mt-3 border-l border-navy-200 pl-3">
      {replies.length > 0 ? (
        <ul className="space-y-2">
          {replies.map((r) => (
            <li
              key={r.id}
              className={cn(
                "rounded-lg bg-navy-50/50 p-2.5",
                r.is_official && "border-l-2 border-gold-400 bg-gold-50/40"
              )}
            >
              <div className="flex items-center gap-2 text-xs">
                <Avatar className="h-6 w-6">
                  {r.author?.avatar_url ? (
                    <AvatarImage src={r.author.avatar_url} alt={r.author?.full_name ?? ""} />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {initials(r.author?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-navy-900">
                  {r.author?.full_name ?? "Attendee"}
                </span>
                {r.is_official ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-navy-700" aria-label="Verified speaker" />
                ) : null}
                <span className="text-navy-400">
                  · {formatDistanceToNowStrict(new Date(r.created_at))} ago
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-navy-800">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-navy-500">No replies yet.</p>
      )}
      <form onSubmit={submit} className="mt-2 flex items-end gap-2">
        <Textarea
          placeholder="Add a reply…"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          maxLength={500}
          className="min-h-[40px] flex-1"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reply"}
        </Button>
      </form>
    </div>
  );
}
