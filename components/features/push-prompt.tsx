"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushPrompt({
  vapidPublicKey,
}: {
  vapidPublicKey: string | null;
}) {
  const { toast } = useToast();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [pending, setPending] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  async function enable() {
    if (!vapidPublicKey) {
      toast({ title: "Push not configured", description: "VAPID keys missing." });
      return;
    }
    setPending(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast({ title: "Permission not granted" });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("Server rejected subscription");
      setSubscribed(true);
      toast({ title: "Notifications on", description: "We'll ping you for important updates." });
    } catch (err) {
      toast({
        title: "Couldn't enable notifications",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/push/subscribe", { method: "DELETE" });
      setSubscribed(false);
      toast({ title: "Notifications off" });
    } catch (err) {
      toast({
        title: "Couldn't disable",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  if (!supported) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-navy-100 bg-white p-3 text-sm text-navy-500">
        <BellOff className="h-4 w-4" />
        Push notifications aren&apos;t supported in this browser.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-navy-100 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-navy-700" />
          <div>
            <div className="text-sm font-semibold text-navy-900">Push notifications</div>
            <div className="text-xs text-navy-500">
              {subscribed
                ? "On — bookmarks, meeting requests, replies."
                : "Get pinged for meeting requests and bookmarked sessions."}
            </div>
          </div>
        </div>
        {subscribed ? (
          <Button size="sm" variant="outline" onClick={disable} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Turn off"}
          </Button>
        ) : (
          <Button size="sm" onClick={enable} disabled={pending || permission === "denied"}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enable"}
          </Button>
        )}
      </div>
      {permission === "denied" ? (
        <p className="mt-2 text-[11px] text-red-600">
          Notifications are blocked in your browser settings. Allow them and reload.
        </p>
      ) : null}
    </div>
  );
}
