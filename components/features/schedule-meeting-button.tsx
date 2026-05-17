"use client";

import { useCallback, useState, useTransition } from "react";
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
  const [inviteeHasSetAvailability, setInviteeHasSetAvailability] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  const handleAvailabilityKnown = useCallback((hasSet: boolean) => {
    setInviteeHasSetAvailability(hasSet);
  }, []);

  const openProposeMode = inviteeHasSetAvailability === false;
  const agenda = message.trim();
  const agendaRequiredButMissing = openProposeMode && agenda.length < 5;

  function submit() {
    if (slots.length === 0) {
      toast({ title: "Pick at least one time", variant: "destructive" });
      return;
    }
    if (agendaRequiredButMissing) {
      toast({
        title: "Add an agenda",
        description: "Since they haven't set availability, write a short reason.",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/meetings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitee_id: inviteeId,
          message: agenda || null,
          location,
          proposed_slots: slots,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const slotUnavailable =
          data.error === "slot_not_available" || data.error === "slot_occupied";
        const agendaMissing = data.error === "agenda_required";
        toast({
          title: "Could not send",
          description: slotUnavailable
            ? "One of those times is no longer available."
            : agendaMissing
              ? "Add a short agenda and try again."
              : data.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Sent",
        description: "We'll let you know the moment they pick a time.",
      });
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
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Propose a 15-min meeting</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-6 pb-6 pt-2">
          {/* Contract banner — sets expectations before any input */}
          <div className="rounded-md border border-brand-100 bg-brand-50/60 px-3 py-2 text-[12px] leading-snug text-brand-900">
            Propose up to 3 times. They pick one to confirm —{" "}
            <span className="font-semibold">nothing&apos;s booked until they accept.</span>
          </div>

          {/* Agenda first — primes thoughtful slot picking */}
          <div>
            <Label
              htmlFor="meeting-message"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800/75"
            >
              What&apos;s the agenda?{openProposeMode ? " · required" : ""}
            </Label>
            <Textarea
              id="meeting-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              placeholder={
                openProposeMode
                  ? "They haven't set availability — give them a clear reason to say yes."
                  : "A quick intro, what you'd like to talk about, why now…"
              }
              rows={3}
              className="mt-1.5 rounded-md border-brand-100"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-brand-800/55">
              <span className={agendaRequiredButMissing ? "text-amber-700" : undefined}>
                {agendaRequiredButMissing ? "Add at least a sentence" : " "}
              </span>
              <span>{message.length} / 280</span>
            </div>
          </div>

          {/* Times */}
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800/75">
              Pick times
            </Label>
            <div className="mt-1.5">
              <SlotPicker
                inviteeId={inviteeId}
                selected={slots}
                onChange={setSlots}
                max={3}
                onInviteeAvailabilityKnown={handleAvailabilityKnown}
              />
            </div>
          </div>

          {/* Where */}
          <div>
            <Label
              htmlFor="meeting-location"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-800/75"
            >
              Where?
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
            <Button
              onClick={submit}
              disabled={pending || slots.length === 0 || agendaRequiredButMissing}
              className="rounded-md"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send proposal"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
