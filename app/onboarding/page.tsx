import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { OnboardingForm, type OnboardingInitial } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/home";

  const initial: OnboardingInitial = {
    full_name: "",
    designation: "",
    company: "",
    iit_campus: "",
    graduation_year: null,
    branch: "",
    bio: "",
    linkedin_url: "",
    twitter_url: "",
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/?next=${encodeURIComponent(`/onboarding?next=${next}`)}`);

    const { data } = await supabase
      .from("profiles")
      .select(
        "full_name, designation, company, iit_campus, graduation_year, branch, bio, linkedin_url, twitter_url"
      )
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      const d = data as Partial<OnboardingInitial>;
      Object.assign(initial, {
        full_name: d.full_name ?? "",
        designation: d.designation ?? "",
        company: d.company ?? "",
        iit_campus: d.iit_campus ?? "",
        graduation_year: d.graduation_year ?? null,
        branch: d.branch ?? "",
        bio: d.bio ?? "",
        linkedin_url: d.linkedin_url ?? "",
        twitter_url: d.twitter_url ?? "",
      });

      // Already onboarded — bounce them onward.
      const complete =
        !!d.full_name?.trim() &&
        !!d.designation?.trim() &&
        !!d.iit_campus?.trim() &&
        !!d.branch?.trim() &&
        !!d.bio?.trim();
      if (complete) redirect(next);
    }
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <main className="min-h-[100svh] bg-brand-50/30 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <header className="flex items-center gap-3">
          <Image
            src="/logo/paniit.png"
            alt="PAN IIT Alumni India"
            width={512}
            height={220}
            priority
            className="h-8 w-auto"
          />
          <div className="h-6 w-px bg-brand-100" aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-800/75">
            Bangalore Summit · Setup
          </p>
        </header>

        <section className="rounded-lg border border-brand-100 bg-white p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
            Tell us about you
          </h1>
          <p className="mt-1 text-sm leading-6 text-brand-900/75">
            We&apos;ll show this to other attendees so they can find you in
            the Networking tab. All starred fields are required.
          </p>

          <div className="mt-5">
            <OnboardingForm initial={initial} next={next} />
          </div>
        </section>
      </div>
    </main>
  );
}
