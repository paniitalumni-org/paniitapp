import Link from "next/link";
import { Building2, GraduationCap, Linkedin, LogOut, Pencil, QrCode, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OfficeHoursToggle } from "@/components/features/office-hours-toggle";
import { PushPrompt } from "@/components/features/push-prompt";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProfileRow {
  full_name: string | null;
  role: string | null;
  company: string | null;
  designation: string | null;
  bio: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  interests: string[] | null;
  asks: string[] | null;
  offers: string[] | null;
  office_hours_enabled: boolean | null;
}

export default async function MePage() {
  let profile: ProfileRow | null = null;
  let userEmail: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userEmail = user.email ?? null;
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, role, company, designation, bio, iit_campus, graduation_year, branch, linkedin_url, interests, asks, offers, office_hours_enabled"
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = (data as ProfileRow | null) ?? null;
    }
  } catch {
    // env not configured
  }

  return (
    <div className="mx-auto w-full max-w-3xl pt-5 pb-10 lg:max-w-4xl lg:pt-8 space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
            {profile?.full_name ?? "Your profile"}
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {profile?.designation || profile?.company
              ? [profile?.designation, profile?.company].filter(Boolean).join(" · ")
              : "Welcome to the summit."}
          </p>
        </div>
        <Link href="/me/edit">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </header>

      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-brand-50 text-brand-800">
            {initials(profile?.full_name ?? "You")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          {profile?.role ? (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
              {profile.role}
            </span>
          ) : null}
          {userEmail ? (
            <div className="truncate text-xs text-slate-500">{userEmail}</div>
          ) : null}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Education
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Detail icon={GraduationCap} label="IIT campus">
            {profile?.iit_campus ?? "—"}
            {profile?.graduation_year ? ` · ${profile.graduation_year}` : ""}
          </Detail>
          <Detail icon={Building2} label="Branch">
            {profile?.branch ?? "—"}
          </Detail>
        </div>
      </section>

      {profile?.bio ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Bio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{profile.bio}</p>
        </section>
      ) : null}

      {profile?.interests?.length ? (
        <ChipSection title="Interests" items={profile.interests} />
      ) : null}
      {profile?.asks?.length ? (
        <ChipSection title="Looking for" items={profile.asks} />
      ) : null}
      {profile?.offers?.length ? (
        <ChipSection title="Can offer" items={profile.offers} />
      ) : null}

      {profile?.linkedin_url ? (
        <a
          href={profile.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:text-brand-900"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-200">
          <li>
            <Link
              href="/me/qr"
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <span className="flex items-center gap-3 text-sm text-brand-900">
                <QrCode className="h-4 w-4 text-slate-500" />
                My QR badge
              </span>
              <span className="text-xs text-slate-400">Open</span>
            </Link>
          </li>
          <li>
            <Link
              href="/sponsors"
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <span className="flex items-center gap-3 text-sm text-brand-900">
                <Award className="h-4 w-4 text-slate-500" />
                Sponsors &amp; perks
              </span>
              <span className="text-xs text-slate-400">Open</span>
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Notifications
        </h2>
        <PushPrompt vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </section>

      {profile?.role === "vc" || profile?.role === "alumni" ? (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Availability
          </h2>
          <OfficeHoursToggle initial={!!profile?.office_hours_enabled} />
        </section>
      ) : null}

      <div className="pt-2">
        <form action="/api/auth/signout" method="post">
          <Button
            variant="outline"
            type="submit"
            className="w-full border-iit-200 text-iit-500 hover:bg-iit-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-brand-900">{children}</div>
    </div>
  );
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
          >
            {i}
          </span>
        ))}
      </div>
    </section>
  );
}

