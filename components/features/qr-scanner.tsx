"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export function QrScanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let stopped = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      scanner = new Html5Qrcode(containerRef.current!.id);
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          async (decoded) => {
            if (stopped) return;
            stopped = true;
            await handleScan(decoded);
            await scanner?.stop().catch(() => undefined);
            setActive(false);
          },
          () => undefined
        );
      } catch (err) {
        toast({
          title: "Camera blocked",
          description: err instanceof Error ? err.message : "Allow camera access to scan.",
          variant: "destructive",
        });
        setActive(false);
      }
    })();
    return () => {
      stopped = true;
      scanner?.stop().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function handleScan(decoded: string) {
    setPending(true);
    const token = decoded.startsWith("paniit2026:") ? decoded.slice("paniit2026:".length) : decoded;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in first", variant: "destructive" });
      setPending(false);
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("qr_token", token)
      .maybeSingle();
    if (!prof) {
      toast({ title: "Unknown badge", variant: "destructive" });
      setPending(false);
      return;
    }
    if (prof.id === user.id) {
      toast({ title: "That's you 🙂" });
      setPending(false);
      return;
    }
    const [a, b] = [prof.id, user.id].sort();
    await supabase
      .from("connections")
      .upsert({ user_a: a, user_b: b }, { onConflict: "user_a,user_b" });
    toast({
      title: "Connected",
      description: `${prof.full_name ?? "Saved"} added to your contacts.`,
    });
    setPending(false);
    router.push(`/attendees/${prof.id}`);
  }

  return (
    <div>
      {!active ? (
        <Button onClick={() => setActive(true)} size="lg" className="w-full">
          <ScanLine className="h-4 w-4" />
          Scan a badge
        </Button>
      ) : (
        <div className="space-y-2">
          <div
            id="qr-scanner-container"
            ref={containerRef}
            className="overflow-hidden rounded-xl border border-navy-100"
          />
          <Button variant="outline" onClick={() => setActive(false)} className="w-full">
            Stop scanning
          </Button>
        </div>
      )}
      {pending ? (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-navy-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Connecting…
        </div>
      ) : null}
    </div>
  );
}
