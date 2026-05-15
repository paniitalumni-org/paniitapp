import Link from "next/link";
import { Building2, GraduationCap, Linkedin, LogOut, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProfileRow {
  full_name: string | null;
  email: string | null;
  role: string | null;
  company: string | null;
  designation: string | null;
  bio: string | null;
  iit_campus: string | null;
  graduation_year: number | null;
  branch: string | null;
  linkedin_url: string | null;
  interests: string[] | null;
  asks: string | null;
  offers: string | null;
}

export default async function MePage() {
  let profile: ProfileRow | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, role, company, designation, bio, iit_campus, graduation_year, branch, linkedin_url, interests, asks, offers"
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = (data as ProfileRow | null) ?? null;
    }
  } catch {
    // env not configured
  }

  return (
    <div className="px-4 pb-10 pt-6 space-y-6">
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
          {profile?.email ? (
            <div className="truncate text-xs text-slate-500">{profile.email}</div>
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
      {profile?.asks ? <PlainSection title="Looking for" body={profile.asks} /> : null}
      {profile?.offers ? <PlainSection title="Can offer" body={profile.offers} /> : null}

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

function PlainSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </section>
  );
}
