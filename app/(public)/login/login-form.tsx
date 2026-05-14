"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneE164, isValidIndianPhone } from "@/lib/utils";

type Step = "phone" | "code";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/agenda";
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const supabase = createClient();

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidIndianPhone(phone)) {
      toast({
        title: "Check your phone number",
        description: "Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9.",
        variant: "destructive",
      });
      return;
    }
    const e164 = formatPhoneE164(phone);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
      if (error) {
        toast({
          title: "Could not send code",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Code sent",
        description: `We just texted a 6-digit code to ${e164}.`,
      });
      setStep("code");
    });
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Enter all 6 digits",
        variant: "destructive",
      });
      return;
    }
    const e164 = formatPhoneE164(phone);
    startTransition(async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164,
        token: code,
        type: "sms",
      });
      if (error || !data.user) {
        toast({
          title: "Code didn't match",
          description: error?.message || "Try again or re-send the code.",
          variant: "destructive",
        });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.user.id)
        .maybeSingle();
      router.replace(profile?.onboarded ? redirectTo : "/onboard");
      router.refresh();
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-paniit-gradient">
      <div className="absolute inset-0 bg-dot-grid opacity-10" aria-hidden />

      <div className="safe-top relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mt-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <span className="font-serif text-base font-bold text-white">PI</span>
          </div>
          <h1 className="mt-5 font-serif text-2xl font-bold text-white">Welcome to PAN IIT 2026</h1>
          <p className="mt-1.5 text-sm text-white/70">Sign in with your phone to continue.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-navy-100 bg-white p-6 shadow-xl shadow-black/10">
          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <Label htmlFor="phone" className="mb-2 block">
                  Mobile number
                </Label>
                <div className="flex items-stretch gap-2">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-navy-50 px-3 text-sm font-medium text-navy-700">
                    <Phone className="h-3.5 w-3.5" />
                    +91
                  </div>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="tabular-nums tracking-wider"
                    aria-label="Mobile number"
                  />
                </div>
                <p className="mt-2 text-xs text-navy-400">
                  We&apos;ll text you a one-time code. Standard SMS rates apply.
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-navy-400">
                <ShieldCheck className="h-3.5 w-3.5 text-navy-500" />
                Your number is never shared with other attendees.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="code" className="mb-2 block">
                  6-digit code
                </Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="------"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 text-center text-2xl font-semibold tabular-nums tracking-[0.4em]"
                  aria-label="Verification code"
                  autoFocus
                />
                <p className="mt-2 text-xs text-navy-400">
                  Sent to +91 {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}.
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Verify &amp; continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                }}
                className="block w-full text-center text-sm text-navy-600 hover:text-navy-900"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          By signing in you agree to receive event-related notifications.
        </p>
      </div>
    </main>
  );
}
