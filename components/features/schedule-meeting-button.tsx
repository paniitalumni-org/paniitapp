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
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <CalendarClock className="h-4 w-4" />
        Schedule meeting
      </Button>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Request a 15-min meeting</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-6 pb-6 pt-2">
          <SlotPicker selected={slots} onChange={setSlots} max={3} />

          <div>
            <Label htmlFor="meeting-message" className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Short message
            </Label>
            <Textarea
              id="meeting-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              placeholder="What do you want to talk about?"
              rows={3}
              className="mt-1.5"
            />
            <div className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
              {message.length} / 280
            </div>
          </div>

          <div>
            <Label htmlFor="meeting-location" className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Location
            </Label>
            <select
              id="meeting-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-100"
            >
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send request"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
