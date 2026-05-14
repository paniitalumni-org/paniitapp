import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  meeting_id: z.string().uuid(),
  slot: z.object({
    start: z.string().min(1),
    end: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid payload" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Try the RPC if it exists.
  const { data, error } = await supabase.rpc("accept_meeting", {
    p_meeting_id: payload.meeting_id,
    p_slot: payload.slot,
  });

  if (error) {
    // Conflict path: fetch suggestions and return them
    if (/conflict|overlap|busy/i.test(error.message)) {
      const { data: alt } = await supabase.rpc("suggest_alternative_slots", {
        p_meeting_id: payload.meeting_id,
      });
      return NextResponse.json(
        { conflict: true, error: error.message, suggestions: alt ?? [] },
        { status: 409 }
      );
    }

    // Fallback: do the work in app code if RPC doesn't exist yet
    const { data: meeting } = await supabase
      .from("meetings")
      .select("requester_id, invitee_id, status, scheduled_start, scheduled_end")
      .eq("id", payload.meeting_id)
      .maybeSingle();
    if (!meeting || meeting.invitee_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    const { error: upErr } = await supabase
      .from("meetings")
      .update({
        status: "accepted",
        scheduled_start: payload.slot.start,
        scheduled_end: payload.slot.end,
      })
      .eq("id", payload.meeting_id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // canonical (user_a < user_b)
    const [a, b] = [meeting.requester_id, meeting.invitee_id].sort();
    await supabase.from("connections").upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b" });
    // ensure conversation
    await supabase
      .from("conversations")
      .upsert({ meeting_id: payload.meeting_id }, { onConflict: "meeting_id" });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, data });
}
