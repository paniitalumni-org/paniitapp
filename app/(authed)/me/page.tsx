import Link from "next/link";
import { ChevronRight, LogOut, Pencil, QrCode } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OfficeHoursToggle } from "@/components/features/office-hours-toggle";
import { PushPrompt } from "@/components/features/push-prompt";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProfileRow {
  full_name: string | null;
  photo_url: string | null;
  role: string | null;
  company: string | null;
  designation: string | null;
  bio: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  interests: string[] | null;
  asks: string[] | null;
  offers: string[] | null;
  office_hours_enabled: boolean | null;
}

function roleLabel(role: string | null | undefined): string | null {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

export default async function MePage() {
  let profile: ProfileRow | null = null;
  let userEmail: string | null = null;
  let connectionCount = 0;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userEmail = user.email ?? null;
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, photo_url, role, company, designation, bio, iit_campus, graduation_year, branch, linkedin_url, twitter_url, interests, asks, offers, office_hours_enabled"
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("connections")
          .select("user_a", { count: "exact", head: true })
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
      ]);
      profile = (data as ProfileRow | null) ?? null;
      connectionCount = count ?? 0;
    }
  } catch (err) {
    rethrowIfRedirect(err);
  }

  const company = profile?.company ?? null;
  const designation = profile?.designation ?? null;
  const eduLine = [
    profile?.iit_campus,
    profile?.graduation_year,
    profile?.branch,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-12 pt-5 lg:pt-8">
      {/* Identity block */}
      <section className="rounded-2xl border border-brand-100 bg-white px-6 pb-6 pt-8 text-center">
        <Avatar className="mx-auto size-24 ring-4 ring-brand-50">
          {profile?.photo_url ? (
            <AvatarImage src={profile.photo_url} alt={profile.full_name ?? ""} />
          ) : null}
          <AvatarFallback className="bg-brand-50 text-xl font-semibold text-brand-800">
            {initials(profile?.full_name ?? "You")}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-[22px] font-semibold leading-tight tracking-tight text-brand-950">
          {profile?.full_name ?? "Your profile"}
        </h1>
        {designation || company ? (
          <p className="mt-1 text-sm font-medium text-brand-900/85">
            {[designation, company].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {profile?.role ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-800/75">
            {roleLabel(profile.role)}
          </p>
        ) : null}
        {userEmail ? (
          <p className="mt-3 text-[12px] font-medium text-brand-900/70">
            {userEmail}
          </p>
        ) : null}
      </section>

      {/* Bio */}
      {profile?.bio ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
            About
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-brand-900">
            {profile.bio}
          </p>
        </section>
      ) : null}

      {/* Areas of interest */}
      {profile?.interests?.length ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
            Areas of interest
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800"
              >
                {i}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Asks / Offers */}
      {(profile?.asks?.length ?? 0) + (profile?.offers?.length ?? 0) > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5">
          {profile?.asks?.length ? (
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
                Looking for
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.asks.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {profile?.offers?.length ? (
            <div className={profile?.asks?.length ? "mt-4" : ""}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
                Can offer
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.offers.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Education */}
      {eduLine ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
            Education
          </h2>
          <p className="mt-2 text-sm font-medium text-brand-900">{eduLine}</p>
        </section>
      ) : null}

      {/* Edit Profile — full width primary */}
      <Link href="/me/edit" className="block">
        <Button className="h-12 w-full gap-1.5 rounded-xl text-sm font-semibold">
          <Pencil className="h-4 w-4" />
          Edit profile
        </Button>
      </Link>

      {/* My Connections — outlined */}
      <Link
        href="/attendees?tab=connections"
        className="flex items-center justify-between rounded-xl border border-brand-100 bg-white px-5 py-3.5 text-sm font-semibold text-brand-900 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
      >
        <span>
          My connections
          {connectionCount > 0 ? (
            <span className="ml-1.5 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
              {connectionCount}
            </span>
          ) : null}
        </span>
        <ChevronRight className="size-4 text-brand-800/70" />
      </Link>

      {/* Secondary links */}
      <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <ul className="divide-y divide-brand-100">
          <li>
            <Link
              href="/me/qr"
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-brand-50/40"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-brand-900">
                <QrCode className="h-4 w-4 text-brand-800" />
                My QR badge
              </span>
              <ChevronRight className="size-4 text-brand-800/70" />
            </Link>
          </li>
        </ul>
      </section>

      {/* Notifications */}
      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
          Notifications
        </h2>
        <PushPrompt vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </section>

      {/* Availability for office-hours roles */}
      {profile?.role === "vc" || profile?.role === "alumni" ? (
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
            Availability
          </h2>
          <OfficeHoursToggle initial={!!profile?.office_hours_enabled} />
        </section>
      ) : null}

      <form action="/api/auth/signout" method="post" className="pt-2">
        <Button
          variant="outline"
          type="submit"
          className="h-11 w-full rounded-xl border-iit-200 text-iit-500 hover:bg-iit-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
