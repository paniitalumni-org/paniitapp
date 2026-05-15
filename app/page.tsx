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
    <main className="min-h-screen bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900">
      <div className="safe-top mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10">
        <div className="w-full rounded-xl bg-white p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-iit-500">
              <span className="text-base font-bold leading-none tracking-tight text-white">
                iit
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                PAN IIT
              </div>
              <div className="text-sm font-semibold tracking-tight text-brand-800">
                Bangalore Summit 2026
              </div>
            </div>
          </div>

          <div className="my-6 h-px w-full bg-slate-200" />

          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
            Sign in to your summit account
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            Enter the email you registered with for the summit.
          </p>

          <div className="mt-6">
            <SignInForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-white/70">
          By signing in you agree to the Summit Terms of Conduct.
        </p>
        <p className="mt-2 text-center text-xs text-white/60">
          © 2026 PAN IIT Alumni India · paniit.org
        </p>
      </div>
    </main>
  );
}
