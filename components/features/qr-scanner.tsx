"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PREFIX = "paniit2026:";

export function QrScanner() {
  const router = useRouter();
  const { toast } = useToast();
  const elId = "qr-scanner-region";
  const [started, setStarted] = useState(false);
  const [pending, setPending] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  async function start() {
    setStarted(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(elId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        async (decoded) => {
          await handleDecoded(decoded);
        },
        () => {
          /* ignore frame errors */
        }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start camera";
      toast({ title: "Camera error", description: msg, variant: "destructive" });
      setStarted(false);
    }
  }

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => {});
      scannerRef.current?.clear();
    };
  }, []);

  async function handleDecoded(text: string) {
    if (pending) return;
    setPending(true);
    const token = text.startsWith(PREFIX) ? text.slice(PREFIX.length) : text;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in first", variant: "destructive" });
        return;
      }
      const { data: target } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("qr_token", token)
        .maybeSingle();
      if (!target) {
        toast({ title: "Code didn't match an attendee", variant: "destructive" });
        return;
      }
      if (target.id === user.id) {
        toast({ title: "That's your own badge" });
        return;
      }
      const a = user.id < target.id ? user.id : target.id;
      const b = user.id < target.id ? target.id : user.id;
      await supabase.from("connections").upsert(
        { user_a: a, user_b: b },
        { onConflict: "user_a,user_b" }
      );
      toast({ title: `Connected with ${target.full_name ?? "attendee"}` });
      await scannerRef.current?.stop().catch(() => {});
      scannerRef.current?.clear();
      router.push(`/attendees/${target.id}`);
    } finally {
      setPending(false);
    }
  }

  if (!started) {
    return (
      <button
        type="button"
        onClick={start}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-800 px-5 text-sm font-medium text-white hover:bg-brand-900"
      >
        <Camera className="h-4 w-4" />
        Open camera scanner
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div id={elId} className="overflow-hidden rounded-lg border border-slate-200 bg-black" />
      {pending ? (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving connection...
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Point the camera at another attendee's QR badge to swap contacts.
        </p>
      )}
    </div>
  );
}
