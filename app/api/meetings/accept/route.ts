import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  meeting_id: z.string().uuid(),
  slot: z.object({ start: z.string(), end: z.string() }),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { meeting_id, slot } = parsed.data;

  // Try the Postgres RPC first (race-condition safe). Fall back to in-app logic.
  const { data: rpcData, error: rpcErr } = await supabase.rpc("accept_meeting", {
    p_meeting_id: meeting_id,
    p_slot: slot,
  });

  if (!rpcErr) {
    return NextResponse.json({ ok: true, via: "rpc", result: rpcData });
  }

  // Fallback: load the meeting, verify the caller is the invitee, check conflicts,
  // then atomically write status='accepted' guarded by current status='pending'.
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, requester_id, invitee_id, status, proposed_slots")
    .eq("id", meeting_id)
    .maybeSingle();
  if (!meeting) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (meeting.invitee_id !== user.id)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (meeting.status !== "pending")
    return NextResponse.json({ error: "already_resolved" }, { status: 409 });

  // Conflict check against accepted meetings for either side.
  const { data: clashes } = await supabase
    .from("meetings")
    .select("id, scheduled_start, scheduled_end")
    .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
    .eq("status", "accepted");
  const conflict = (clashes ?? []).some(
    (m: { scheduled_start: string | null; scheduled_end: string | null }) =>
      m.scheduled_start &&
      m.scheduled_end &&
      new Date(slot.start) < new Date(m.scheduled_end) &&
      new Date(m.scheduled_start) < new Date(slot.end)
  );
  if (conflict) return NextResponse.json({ error: "conflict" }, { status: 409 });

  const { data: updated, error: updErr } = await supabase
    .from("meetings")
    .update({
      status: "accepted",
      scheduled_start: slot.start,
      scheduled_end: slot.end,
    })
    .eq("id", meeting_id)
    .eq("status", "pending")
    .select()
    .maybeSingle();
  if (updErr || !updated)
    return NextResponse.json({ error: updErr?.message ?? "race" }, { status: 409 });

  // Insert canonical connection (smaller uuid first).
  const a = meeting.requester_id < meeting.invitee_id ? meeting.requester_id : meeting.invitee_id;
  const b = meeting.requester_id < meeting.invitee_id ? meeting.invitee_id : meeting.requester_id;
  await supabase
    .from("connections")
    .upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b" });

  return NextResponse.json({ ok: true, via: "fallback" });
}
