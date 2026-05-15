import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildDaySlots, classifySlot } from "@/lib/slots";

const Body = z.object({ meeting_id: z.string().uuid() });

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  // Try the Postgres RPC first.
  const { data, error } = await supabase.rpc("suggest_alternative_slots", {
    p_user_id: user.id,
    p_count: 3,
  });
  if (!error && Array.isArray(data) && data.length > 0) {
    return NextResponse.json({ slots: data });
  }

  // Fallback: scan the day grid for 3 conflict-free 15-min slots.
  const [bms, mts] = await Promise.all([
    supabase
      .from("session_bookmarks")
      .select("sessions(starts_at, ends_at)")
      .eq("user_id", user.id),
    supabase
      .from("meetings")
      .select("scheduled_start, scheduled_end")
      .or(`requester_id.eq.${user.id},invitee_id.eq.${user.id}`)
      .eq("status", "accepted"),
  ]);
  const bookmarks =
    ((bms.data as { sessions: { starts_at: string; ends_at: string } | null }[] | null) ?? [])
      .map((r) => r.sessions)
      .filter((s): s is { starts_at: string; ends_at: string } => !!s)
      .map((s) => ({ start: s.starts_at, end: s.ends_at }));
  const accepted =
    ((mts.data as { scheduled_start: string | null; scheduled_end: string | null }[] | null) ?? [])
      .filter((m): m is { scheduled_start: string; scheduled_end: string } => !!m.scheduled_start && !!m.scheduled_end)
      .map((m) => ({ start: m.scheduled_start, end: m.scheduled_end }));

  const free = buildDaySlots().filter((s) => classifySlot(s, bookmarks, accepted) === "free");
  return NextResponse.json({ slots: free.slice(0, 3) });
}
