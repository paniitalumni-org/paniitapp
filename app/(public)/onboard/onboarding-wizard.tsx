"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { IIT_CAMPUSES, INTERESTS, ROLES } from "@/lib/constants";

type Step = 1 | 2 | 3;
type RoleValue = (typeof ROLES)[number]["value"];

interface Initial {
  full_name?: string | null;
  role?: string | null;
  company?: string | null;
  designation?: string | null;
  iit_campus?: string | null;
  graduation_year?: number | null;
  branch?: string | null;
  linkedin_url?: string | null;
  interests?: string[] | null;
  asks?: string | null;
  offers?: string | null;
}

const YEARS = Array.from({ length: 60 }, (_, i) => 2026 - i);

export function OnboardingWizard({ initial }: { initial: Initial | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [role, setRole] = useState<RoleValue | "">(((initial?.role as RoleValue) ?? "") as RoleValue | "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [designation, setDesignation] = useState(initial?.designation ?? "");

  const [iitCampus, setIitCampus] = useState(initial?.iit_campus ?? "");
  const [gradYear, setGradYear] = useState<string>(initial?.graduation_year?.toString() ?? "");
  const [branch, setBranch] = useState(initial?.branch ?? "");
  const [linkedin, setLinkedin] = useState(initial?.linkedin_url ?? "");

  const [interests, setInterests] = useState<string[]>(initial?.interests ?? []);
  const [asks, setAsks] = useState(initial?.asks ?? "");
  const [offers, setOffers] = useState(initial?.offers ?? "");

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length >= 6
        ? prev
        : [...prev, value]
    );
  }

  function validateStep1(): string | null {
    if (!fullName.trim() || fullName.trim().length < 2) return "Tell us your full name.";
    if (!role) return "Pick the role that fits you best.";
    if (!company.trim()) return "Add your company or organisation.";
    if (!designation.trim()) return "Add your designation.";
    return null;
  }
  function validateStep2(): string | null {
    if (!iitCampus) return "Pick your IIT campus.";
    if (!gradYear) return "Add your graduation year.";
    if (!branch.trim()) return "Add your branch.";
    return null;
  }

  async function handleNext() {
    if (step === 1) {
      const err = validateStep1();
      if (err) return toast({ title: err, variant: "destructive" });
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return toast({ title: err, variant: "destructive" });
      setStep(3);
    }
  }

  async function handleFinish() {
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in again", variant: "destructive" });
        router.replace("/login");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim(),
            role,
            company: company.trim(),
            designation: designation.trim(),
            iit_campus: iitCampus,
            graduation_year: gradYear ? Number(gradYear) : null,
            branch: branch.trim(),
            linkedin_url: linkedin.trim() || null,
            interests,
            asks: asks.trim() || null,
            offers: offers.trim() || null,
            onboarded: true,
          },
          { onConflict: "id" }
        );
      if (error) {
        toast({
          title: "Couldn't save your profile",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Welcome aboard!", description: "Your profile is live." });
      router.replace("/agenda");
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-navy-50/60">
      <div className="safe-top mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
        {/* Progress */}
        <div className="border-b border-navy-100 px-5 pb-3 pt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-navy-500">
            <span>Step {step} of 3</span>
            <span>{step === 1 ? "About you" : step === 2 ? "IIT details" : "Interests"}</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition",
                  i <= step ? "bg-navy-800" : "bg-navy-100"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 px-5 py-6">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <header>
                <h1 className="font-serif text-2xl font-bold text-navy-900">Tell us about you</h1>
                <p className="mt-1 text-sm text-navy-500">
                  This is what other attendees will see when they discover you.
                </p>
              </header>
              <div className="space-y-3">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  placeholder="Aarav Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <Label>I&apos;m here as a…</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left transition",
                        role === r.value
                          ? "border-navy-800 bg-navy-50 text-navy-900"
                          : "border-navy-200 text-navy-700 hover:border-navy-400"
                      )}
                    >
                      <div className="text-sm font-semibold">{r.label}</div>
                      <div className="text-[11px] text-navy-500">{r.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme.ai"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="Co-founder & CTO"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <header>
                <h1 className="font-serif text-2xl font-bold text-navy-900">Your IIT story</h1>
                <p className="mt-1 text-sm text-navy-500">
                  Helps batchmates and campus-mates find you faster.
                </p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="iit">IIT campus</Label>
                <select
                  id="iit"
                  value={iitCampus}
                  onChange={(e) => setIitCampus(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-navy-200 bg-white px-3 text-base text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                >
                  <option value="">Select your campus</option>
                  {IIT_CAMPUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="year">Graduation year</Label>
                  <select
                    id="year"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-navy-200 bg-white px-3 text-base text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                  >
                    <option value="">Year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    placeholder="Computer Science"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <header>
                <h1 className="font-serif text-2xl font-bold text-navy-900">What brings you here?</h1>
                <p className="mt-1 text-sm text-navy-500">
                  Pick up to 6 interests so we can match you with the right rooms and people.
                </p>
              </header>
              <div>
                <Label className="mb-2 block">Interests · {interests.length}/6</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => {
                    const active = interests.includes(i);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleInterest(i)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          active
                            ? "border-navy-800 bg-navy-800 text-white"
                            : "border-navy-200 text-navy-700 hover:border-navy-400"
                        )}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="asks">What are you looking for?</Label>
                <Textarea
                  id="asks"
                  placeholder="Series A intro, design hire, climate-tech distribution partners…"
                  value={asks}
                  onChange={(e) => setAsks(e.target.value)}
                />
                <p className="text-xs text-navy-400">Comma-separated, shown as chips on your profile.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offers">What can you offer?</Label>
                <Textarea
                  id="offers"
                  placeholder="GTM advice for B2B SaaS, deep-tech hiring referrals…"
                  value={offers}
                  onChange={(e) => setOffers(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="safe-bottom border-t border-navy-100 bg-white px-5 py-4">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="flex-1"
                disabled={pending}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1" disabled={pending}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="flex-1" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Finish
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
