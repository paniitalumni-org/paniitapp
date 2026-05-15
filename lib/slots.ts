import { formatInTimeZone } from "date-fns-tz";
import { SUMMIT_DATE_ISO, SUMMIT_TZ } from "./constants";

export interface Slot {
  start: string; // ISO
  end: string;   // ISO
}

const DAY_START_H = 8;
const DAY_END_H = 21;
const STEP_MIN = 15;
const SLOT_MIN = 15;

// Build May-16 IST slot grid 08:00–21:00 in 15-minute increments.
export function buildDaySlots(): Slot[] {
  const slots: Slot[] = [];
  // Use a Date constructed in UTC for the summit day, then shift by the IST offset.
  // The IST tz offset is fixed (+05:30), so we anchor to 02:30 UTC = 08:00 IST.
  const start = new Date(`${SUMMIT_DATE_ISO}T02:30:00.000Z`); // 08:00 IST
  for (
    let m = 0;
    m < (DAY_END_H - DAY_START_H) * 60;
    m += STEP_MIN
  ) {
    const s = new Date(start.getTime() + m * 60_000);
    const e = new Date(s.getTime() + SLOT_MIN * 60_000);
    slots.push({ start: s.toISOString(), end: e.toISOString() });
  }
  return slots;
}

export function slotLabel(slot: Slot): string {
  return formatInTimeZone(new Date(slot.start), SUMMIT_TZ, "h:mm a");
}

export function overlaps(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}

export type SlotConflict = "free" | "soft" | "hard";

export function classifySlot(
  slot: Slot,
  bookmarkedSessions: { start: string; end: string }[],
  acceptedMeetings: { start: string; end: string }[]
): SlotConflict {
  if (acceptedMeetings.some((m) => overlaps(slot, m))) return "hard";
  if (bookmarkedSessions.some((s) => overlaps(slot, s))) return "soft";
  return "free";
}
