import { NextResponse } from "next/server";
import webpush, { type PushSubscription } from "web-push";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const Body = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(2000),
  notification: z.object({
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(280),
    url: z.string().optional(),
    tag: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: meRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (meRow?.role !== "admin" && meRow?.role !== "organizer") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid payload" },
      { status: 400 }
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:tech@paniit.org",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const service = await createServiceClient();
  const { data: subs } = await service
    .from("profiles")
    .select("id, push_subscription")
    .in("id", payload.user_ids)
    .not("push_subscription", "is", null);

  let sent = 0;
  let failed = 0;
  await Promise.all(
    (subs ?? []).map(async (s: { id: string; push_subscription: PushSubscription | null }) => {
      if (!s.push_subscription) return;
      try {
        await webpush.sendNotification(
          s.push_subscription,
          JSON.stringify(payload.notification)
        );
        sent++;
      } catch (err) {
        failed++;
        // Clean up expired subscriptions
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await service.from("profiles").update({ push_subscription: null }).eq("id", s.id);
        }
      }
    })
  );

  return NextResponse.json({ sent, failed });
}
