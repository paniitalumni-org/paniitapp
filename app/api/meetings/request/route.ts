import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SlotSchema = z.object({ start: z.string(), end: z.string() });
const Body = z.object({
  invitee_id: z.string().uuid(),
  message: z.string().max(280).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  proposed_slots: z.array(SlotSchema).min(1).max(3),
});

interface AvailabilityRow {
  slot_start: string;
  slot_end: string;
  status: "available" | "booked" | "blocked";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (parsed.data.invitee_id === user.id) {
    return NextResponse.json({ error: "cannot_invite_self" }, { status: 400 });
  }

  let proposed: { start: string; end: string }[];
  try {
    proposed = parsed.data.proposed_slots.map((slot) => ({
      start: new Date(slot.start).toISOString(),
      end: new Date(slot.end).toISOString(),
    }));
  } catch {
    return NextResponse.json({ error: "invalid_slot" }, { status: 400 });
  }
  if (new Set(proposed.map((slot) => slot.start)).size !== proposed.length) {
    return NextResponse.json({ error: "duplicate_slots" }, { status: 400 });
  }
  if (proposed.some((slot) => new Date(slot.start) >= new Date(slot.end))) {
    return NextResponse.json({ error: "invalid_slot" }, { status: 400 });
  }

  const { data: availability, error: availErr } = await supabase
    .from("availability_slots")
    .select("slot_start, slot_end, status")
    .eq("user_id", parsed.data.invitee_id)
    .eq("status", "available");
  if (availErr) return NextResponse.json({ error: availErr.message }, { status: 500 });

  const available = new Map(
    ((availability as AvailabilityRow[] | null) ?? []).map((row) => [
      new Date(row.slot_start).toISOString(),
      new Date(row.slot_end).toISOString(),
    ])
  );
  const allSlotsAreAvailable = proposed.every(
    (slot) => available.get(slot.start) === slot.end
  );
  if (!allSlotsAreAvailable) {
    return NextResponse.json({ error: "slot_not_available" }, { status: 409 });
  }

  const { error } = await supabase.from("meetings").insert({
    requester_id: user.id,
    invitee_id: parsed.data.invitee_id,
    message: parsed.data.message ?? null,
    location: parsed.data.location ?? null,
    proposed_slots: proposed,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
