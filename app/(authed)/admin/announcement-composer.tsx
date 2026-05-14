"use client";

import { useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "role:founder", label: "Founders" },
  { value: "role:vc", label: "VCs" },
  { value: "role:speaker", label: "Speakers" },
];

export function AnnouncementComposer() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [audience, setAudience] = useState("all");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || body.trim().length < 3) {
      toast({ title: "Title and body are required", variant: "destructive" });
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      priority,
      audience,
    });
    if (error) {
      setPending(false);
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }

    // Broadcast push for high/urgent
    if (priority === "high" || priority === "urgent") {
      // Resolve user ids for the audience
      let userIds: string[] = [];
      if (audience === "all") {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("onboarded", true)
          .not("push_subscription", "is", null);
        userIds = (data ?? []).map((r: { id: string }) => r.id);
      } else if (audience.startsWith("role:")) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", audience.slice(5))
          .not("push_subscription", "is", null);
        userIds = (data ?? []).map((r: { id: string }) => r.id);
      }
      if (userIds.length > 0) {
        await fetch("/api/push/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            user_ids: userIds,
            notification: {
              title: title.trim(),
              body: body.trim(),
              url: "/agenda",
              tag: "announcement",
            },
          }),
        }).catch(() => undefined);
      }
    }

    setPending(false);
    toast({ title: "Announcement sent" });
    setTitle("");
    setBody("");
    setPriority("normal");
    setAudience("all");
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-navy-100 bg-white p-4">
      <div className="space-y-1.5">
        <Label htmlFor="ann-title">Title</Label>
        <Input
          id="ann-title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="Keynote starting in Mysore Hall"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ann-body">Message</Label>
        <Textarea
          id="ann-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 280))}
          maxLength={280}
          placeholder="Doors open in 5. Hurry."
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="ann-priority">Priority</Label>
          <select
            id="ann-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
            className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ann-audience">Audience</Label>
          <select
            id="ann-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm"
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Megaphone className="h-4 w-4" />
            Send announcement
          </>
        )}
      </Button>
      <p className="text-[11px] text-navy-400">
        High &amp; urgent priorities also send a push notification to the audience.
      </p>
    </form>
  );
}
