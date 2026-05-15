"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/agenda";
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const supabase = createClient();

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      toast({
        title: "Enter a valid email",
        description: "Use the address you registered with for the summit.",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (error) {
        toast({
          title: "Could not send code",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Verification code sent",
        description: `Check ${trimmed} for a 6-digit code.`,
      });
      setStep("code");
    });
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: "Enter all 6 digits", variant: "destructive" });
      return;
    }
    const trimmed = email.trim().toLowerCase();
    startTransition(async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmed,
        token: code,
        type: "email",
      });
      if (error || !data.user) {
        toast({
          title: "Code did not match",
          description: error?.message || "Request a new code and try again.",
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/login" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-sm bg-navy-900 text-white">
              <span className="font-serif text-xs font-semibold tracking-wide">PI</span>
            </div>
            <div className="leading-tight">
              <div className="font-serif text-[15px] font-semibold text-navy-900">
                PAN IIT Alumni India
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-navy-500">
                Bangalore Summit 2026
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="https://paniit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900"
            >
              About
            </a>
            <a
              href="https://paniit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900"
            >
              Summit
            </a>
            <a
              href="https://paniit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900"
            >
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 border-b border-navy-200 pb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-navy-600">
              Member Sign In
            </div>
            <h1 className="mt-6 font-serif text-3xl font-semibold leading-tight text-navy-900 md:text-4xl">
              Welcome back
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-navy-600">
              Sign in with your registered email to access the official PAN IIT Bangalore Summit 2026 app.
            </p>
          </div>

          <div className="border border-navy-100 bg-white p-8 shadow-sm">
            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-navy-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-none border-navy-200 text-base"
                    aria-label="Email address"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-none bg-navy-900 text-sm font-semibold uppercase tracking-wider text-white hover:bg-navy-800"
                  disabled={pending}
                >
                  {pending ? "Sending..." : "Continue"}
                </Button>
                <p className="text-center text-xs leading-relaxed text-navy-500">
                  We will email a one-time verification code. No password required.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <Label htmlFor="code" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-navy-700">
                    Verification code
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="------"
                    value={code}
                    maxLength={6}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-14 rounded-none border-navy-200 text-center text-2xl font-semibold tabular-nums tracking-[0.5em]"
                    aria-label="Verification code"
                    autoFocus
                  />
                  <p className="mt-3 text-xs text-navy-500">
                    Sent to <span className="font-medium text-navy-800">{email}</span>
                  </p>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-none bg-navy-900 text-sm font-semibold uppercase tracking-wider text-white hover:bg-navy-800"
                  disabled={pending}
                >
                  {pending ? "Verifying..." : "Verify and continue"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  className="block w-full text-center text-xs font-medium uppercase tracking-wider text-navy-600 transition-colors hover:text-navy-900"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-navy-500">
            By signing in you agree to receive event-related communications from PAN IIT Alumni India.
          </p>
        </div>
      </main>

      <footer className="border-t border-navy-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-navy-500 md:flex-row">
          <div>© 2026 PAN IIT Alumni India. All rights reserved.</div>
          <a
            href="https://paniit.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-navy-700 transition-colors hover:text-navy-900"
          >
            paniit.org
          </a>
        </div>
      </footer>
    </div>
  );
}
