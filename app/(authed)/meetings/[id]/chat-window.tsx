"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Loader2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Msg {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export function ChatWindow({
  conversationId,
  userId,
  initialMessages,
}: {
  conversationId: string;
  userId: string;
  initialMessages: Msg[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const ch = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const { data } = await supabase
            .from("messages")
            .select("id, sender_id, body, created_at, read_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });
          setMessages(data ?? []);
        }
      )
      .subscribe();

    // Mark unread messages as read when the chat opens
    (async () => {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .is("read_at", null)
        .neq("sender_id", userId);
    })();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, supabase, userId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: text,
    });
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
      return;
    }
    setBody("");
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-navy-50/40 px-4 py-4">
        {messages.length === 0 ? (
          <div className="mt-12 text-center text-xs text-navy-500">
            Say hi — your meeting is locked in.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-snug",
                    mine
                      ? "rounded-br-md bg-navy-800 text-white"
                      : "rounded-bl-md bg-white text-navy-900 ring-1 ring-navy-100"
                  )}
                >
                  <p>{m.body}</p>
                  <div
                    className={cn(
                      "mt-0.5 flex items-center gap-0.5 text-[10px] tabular-nums",
                      mine ? "text-white/70" : "text-navy-400"
                    )}
                  >
                    {format(new Date(m.created_at), "HH:mm")}
                    {mine ? (
                      m.read_at ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form
        onSubmit={send}
        className="safe-bottom border-t border-navy-100 bg-white px-3 py-2.5"
      >
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 2000))}
            placeholder="Type a message…"
            className="min-h-[40px] max-h-32 resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e as unknown as React.FormEvent);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={sending || body.trim().length === 0}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </>
  );
}
