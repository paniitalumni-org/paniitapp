"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { SlotPicker, type BusyBlock } from "@/components/features/slot-picker";
import type { TimeBlock } from "@/lib/slots";

const LOCATIONS = ["Investor Lounge", "Sponsor Plaza", "Networking Hall", "Lobby Cafe"];

export function ScheduleMeetingButton({
  inviteeId,
  className,
}: {
  inviteeId: string;
  className?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<BusyBlock[]>([]);
  const [slots, setSlots] = useState<TimeBlock[]>([]);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // viewer's accepted meetings + bookmarked session times
      const { data: ms } = await supabase
        .from("meetings")
        .select("scheduled_start, scheduled_end, status")
        .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .eq("status", "accepted");
      // invitee's accepted meetings
      const { data: msi } = await supabase
        .from("meetings")
        .select("scheduled_start, scheduled_end, status")
        .or(`requester_id.eq.${inviteeId},invitee_id.eq.${inviteeId}`)
        .eq("status", "accepted");
      const { data: bms } = await supabase
        .from("session_bookmarks")
        .select("sessions(starts_at, ends_at)")
        .eq("user_id", user.id);

      const meetings: BusyBlock[] = [
        ...((ms ?? []).flatMap((m) =>
          m.scheduled_start && m.scheduled_end
            ? [{ start: m.scheduled_start, end: m.scheduled_end, kind: "meeting" as const }]
            : []
        )),
        ...((msi ?? []).flatMap((m) =>
          m.scheduled_start && m.scheduled_end
            ? [{ start: m.scheduled_start, end: m.scheduled_end, kind: "meeting" as const }]
            : []
        )),
      ];
      const sessions: BusyBlock[] = (
        ((bms ?? []) as unknown) as Array<{ sessions: { starts_at: string; ends_at: string } | null }>
      )
        .filter((b) => b.sessions)
        .map((b) => ({
          start: b.sessions!.starts_at,
          end: b.sessions!.ends_at,
          kind: "session" as const,
        }));
      setBusy([...meetings, ...sessions]);
    })();
  }, [open, supabase, inviteeId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (slots.length === 0) {
      toast({ title: "Pick at least 1 slot", variant: "destructive" });
      return;
    }
    if (message.trim().length < 4) {
      toast({ title: "Add a short message", description: "Tell them why you want to meet." });
      return;
    }
    setPending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(false);
      toast({ title: "Sign in first", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("meetings").insert({
      requester_id: user.id,
      invitee_id: inviteeId,
      message: message.trim().slice(0, 280),
      location,
      proposed_slots: slots,
      status: "pending",
    });
    setPending(false);
    if (error) {
      toast({
        title: "Couldn't send request",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Sent", description: "We'll notify you when they respond." });
    setOpen(false);
    setMessage("");
    setSlots([]);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className}>
        <CalendarPlus className="h-4 w-4" />
        Schedule Meeting
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="px-0">
          <SheetHeader>
            <SheetTitle>Schedule a meeting</SheetTitle>
          </SheetHeader>
          <form onSubmit={submit} className="space-y-4 px-6 pb-6">
            <div>
              <Label className="mb-2 block">Pick up to 3 time slots</Label>
              <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-navy-100 bg-navy-50/40 p-2">
                <SlotPicker value={slots} onChange={setSlots} busy={busy} />
              </div>
            </div>
            <div>
              <Label htmlFor="msg" className="mb-2 block">
                Message
              </Label>
              <Textarea
                id="msg"
                placeholder="A line on why you'd like to meet."
                maxLength={280}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              />
              <p className="mt-1 text-[11px] tabular-nums text-navy-400">{message.length}/280</p>
            </div>
            <div>
              <Label htmlFor="loc" className="mb-2 block">
                Location
              </Label>
              <select
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm"
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send request
                </>
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

