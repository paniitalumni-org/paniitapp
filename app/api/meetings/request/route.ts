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

  const { error } = await supabase.from("meetings").insert({
    requester_id: user.id,
    invitee_id: parsed.data.invitee_id,
    message: parsed.data.message ?? null,
    location: parsed.data.location ?? null,
    proposed_slots: parsed.data.proposed_slots,
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
