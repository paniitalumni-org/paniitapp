import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/agenda");
  } catch (err) {
    rethrowIfRedirect(err);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel: brand */}
      <aside className="hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <Image
          src="/logo/paniit.png"
          alt="PAN IIT Alumni India"
          width={512}
          height={220}
          priority
          className="h-12 w-auto brightness-0 invert"
        />
        <div className="max-w-md text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
            Bangalore Summit 2026
          </p>
          <h1 className="mt-3 font-semibold leading-tight tracking-tight text-white text-3xl xl:text-4xl">
            Sovereignty in Technology
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/80">
            One day. India&apos;s deepest network of builders, investors and policy minds.
            The official PAN IIT Bangalore Summit app, in your pocket.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            <Stat label="Date" value="May 16, 2026" />
            <Stat label="Venue" value="Taj Yeshwantpur" />
            <Stat label="Attendees" value="2,000+" />
          </dl>
        </div>
        <p className="text-[11px] text-white/50">
          © 2026 PAN IIT Alumni India · paniit.org
        </p>
      </aside>

      {/* Right panel: form */}
      <section className="safe-top flex min-h-screen flex-col bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 lg:hidden">
          <Image
            src="/logo/paniit.png"
            alt="PAN IIT Alumni India"
            width={512}
            height={220}
            priority
            className="h-8 w-auto"
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Summit 2026
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-sm">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Member sign in
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-brand-900 sm:text-[26px]">
                Welcome to the summit
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Sign in with the email you registered with.
              </p>
            </div>

            <div className="mt-7">
              <SignInForm />
            </div>

            <p className="mt-10 text-xs leading-5 text-slate-400">
              By signing in you agree to the Summit Terms of Conduct. Trouble?{" "}
              <a
                href="mailto:summit@paniit.org"
                className="font-medium text-brand-800 hover:text-brand-900"
              >
                summit@paniit.org
              </a>
            </p>
          </div>
        </div>

        <footer className="border-t border-slate-200 px-5 py-4 text-center text-[11px] text-slate-400 lg:hidden">
          © 2026 PAN IIT Alumni India · paniit.org
        </footer>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
    </div>
  );
}
