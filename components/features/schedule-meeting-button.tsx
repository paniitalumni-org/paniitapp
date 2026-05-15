"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SlotPicker } from "./slot-picker";
import type { Slot } from "@/lib/slots";

const LOCATIONS = [
  "Investor Lounge",
  "Sponsor Plaza",
  "Mysore Hall foyer",
  "Lobby café",
  "Open — to be confirmed",
];

export function ScheduleMeetingButton({ inviteeId }: { inviteeId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (slots.length === 0) {
      toast({ title: "Pick at least one slot", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/meetings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitee_id: inviteeId,
          message: message.trim() || null,
          location,
          proposed_slots: slots,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast({
          title: "Could not send",
          description: data.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Meeting request sent" });
      setOpen(false);
      setSlots([]);
      setMessage("");
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-800 text-[13px] font-semibold tracking-tight text-white transition-colors hover:bg-brand-900"
      >
        <CalendarClock className="h-4 w-4" strokeWidth={1.7} />
        Schedule meeting
      </button>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Request a 15-min meeting</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-6 pb-6 pt-2">
          <SlotPicker selected={slots} onChange={setSlots} max={3} />

          <div>
            <Label
              htmlFor="meeting-message"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800/75"
            >
              Short message
            </Label>
            <Textarea
              id="meeting-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              placeholder="What do you want to talk about?"
              rows={3}
              className="mt-1.5 rounded-md border-brand-100"
            />
            <div className="mt-1 text-right text-[11px] tabular-nums text-brand-800/55">
              {message.length} / 280
            </div>
          </div>

          <div>
            <Label
              htmlFor="meeting-location"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800/75"
            >
              Location
            </Label>
            <select
              id="meeting-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-brand-100 bg-white px-3 text-sm text-brand-950 outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-100"
            >
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-md">
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending} className="rounded-md">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send request"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
