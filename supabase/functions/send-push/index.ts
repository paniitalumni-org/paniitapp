// Supabase Edge Function (Deno) — send-push
// Trigger this from database webhooks or pg_cron jobs to deliver Web Push.
//
// Deploy: supabase functions deploy send-push
// Env:    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Body (JSON):
//   {
//     "user_ids": ["uuid", "uuid"],          // direct recipients (optional)
//     "audience": "all" | "role:vc" | null,  // alternate to user_ids
//     "notification": { "title": "...", "body": "...", "url": "/...", "tag": "..." }
//   }

// @ts-ignore -- Deno-only imports resolved at deploy time
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore
import webpush from "https://esm.sh/web-push@3.6.7";

// @ts-ignore
const Deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined }; serve: (h: (req: Request) => Promise<Response> | Response) => void } }).Deno!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:tech@paniit.org";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body: {
    user_ids?: string[];
    audience?: string;
    notification: { title: string; body: string; url?: string; tag?: string };
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), { status: 400 });
  }

  if (!body?.notification?.title) {
    return new Response(JSON.stringify({ error: "missing notification" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let query = supabase.from("profiles").select("id, push_subscription").not("push_subscription", "is", null);
  if (body.user_ids && body.user_ids.length > 0) {
    query = query.in("id", body.user_ids);
  } else if (body.audience?.startsWith("role:")) {
    query = query.eq("role", body.audience.slice("role:".length));
  } else if (body.audience !== "all") {
    return new Response(JSON.stringify({ error: "no audience" }), { status: 400 });
  }

  const { data: subs, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;
  let failed = 0;
  await Promise.all(
    (subs ?? []).map(async (row: { id: string; push_subscription: unknown }) => {
      if (!row.push_subscription) return;
      try {
        // deno-lint-ignore no-explicit-any
        await webpush.sendNotification(row.push_subscription as any, JSON.stringify(body.notification));
        sent++;
      } catch (err) {
        failed++;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("profiles").update({ push_subscription: null }).eq("id", row.id);
        }
      }
    })
  );

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { "content-type": "application/json" },
  });
});
