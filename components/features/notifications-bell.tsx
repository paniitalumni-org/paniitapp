"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  priority: "low" | "normal" | "high" | "urgent" | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsBell() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("paniit-seen-announcements") : null;
    if (stored) setSeenIds(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled) setItems((data as Announcement[] | null) ?? []);
    })();

    const ch = supabase
      .channel("announcements")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "announcements" },
        (payload) => {
          const row = payload.new as Announcement;
          setItems((prev) => [row, ...prev].slice(0, 20));
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    const ids = items.map((i) => i.id);
    const next = new Set([...Array.from(seenIds), ...ids]);
    setSeenIds(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("paniit-seen-announcements", JSON.stringify(Array.from(next)));
    }
  }, [open, items, seenIds]);

  const unseen = items.filter((i) => !seenIds.has(i.id));
  const urgent = items.find((i) => i.priority === "urgent");
  const urgentUnseen = urgent && !seenIds.has(urgent.id);

  return (
    <>
      {urgentUnseen ? (
        <div className="border-b border-iit-700 bg-iit-500 px-4 py-2 text-xs font-medium text-white">
          {urgent.title}
        </div>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Notifications"
          className="relative inline-grid h-9 w-9 place-items-center rounded-md text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unseen.length > 0 ? (
            <span className="absolute right-1.5 top-1.5 inline-block h-2 w-2 rounded-full bg-iit-500" />
          ) : null}
        </button>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Announcements</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-6 pb-6 pt-2">
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No announcements yet.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "rounded-md border p-3",
                      a.priority === "urgent"
                        ? "border-iit-300 bg-iit-50"
                        : a.priority === "high"
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-brand-900">{a.title}</div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {timeAgo(a.created_at)}
                      </span>
                    </div>
                    {a.body ? (
                      <p className="mt-1 text-xs leading-5 text-slate-600 whitespace-pre-line">
                        {a.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
