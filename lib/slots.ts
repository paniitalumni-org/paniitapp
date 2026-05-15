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

// 15-minute grid for the My Availability flow on /meetings.
// 08:00 IST → 22:00 IST in 15-minute blocks (56 slots total).
const AVAIL_START_H = 8;
const AVAIL_END_H = 22;
const AVAIL_STEP_MIN = 15;
const AVAIL_SLOT_MIN = 15;

export function buildAvailabilitySlots(): Slot[] {
  const slots: Slot[] = [];
  const start = new Date(`${SUMMIT_DATE_ISO}T02:30:00.000Z`); // 08:00 IST
  const totalMin = (AVAIL_END_H - AVAIL_START_H) * 60;
  for (let m = 0; m < totalMin; m += AVAIL_STEP_MIN) {
    const s = new Date(start.getTime() + m * 60_000);
    const e = new Date(s.getTime() + AVAIL_SLOT_MIN * 60_000);
    slots.push({ start: s.toISOString(), end: e.toISOString() });
  }
  return slots;
}

export function slotHourIST(iso: string): number {
  // Return hour as a number in IST (0–23). Anchor: 2026-05-16T02:30Z = 08:00 IST.
  const ms = new Date(iso).getTime();
  const anchor = new Date(`${SUMMIT_DATE_ISO}T00:00:00.000Z`).getTime();
  const istMin = Math.round((ms - anchor) / 60_000) + 5 * 60 + 30; // shift to IST
  return Math.floor(((istMin % (24 * 60)) + 24 * 60) % (24 * 60) / 60);
}

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
