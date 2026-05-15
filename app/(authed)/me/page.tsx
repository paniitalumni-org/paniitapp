import Link from "next/link";
import {
  ChevronRight,
  Building2,
  GraduationCap,
  Linkedin,
  LogOut,
  QrCode,
  Award,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PushPrompt } from "@/components/features/push-prompt";
import { OfficeHoursToggle } from "@/components/features/office-hours-toggle";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MePage() {
  let profile: {
    full_name?: string | null;
    role?: string | null;
    company?: string | null;
    designation?: string | null;
    iit_campus?: string | null;
    graduation_year?: number | null;
    branch?: string | null;
    linkedin_url?: string | null;
    interests?: string[] | null;
    office_hours_enabled?: boolean | null;
  } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, role, company, designation, iit_campus, graduation_year, branch, linkedin_url, interests, office_hours_enabled"
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
  } catch {
    // env not configured
  }

  return (
    <div className="pb-10">
      <div className="bg-paniit-gradient px-5 pb-6 pt-6 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 bg-white/15 ring-2 ring-white/30">
            <AvatarFallback className="bg-white/15 text-white">
              {initials(profile?.full_name ?? "You")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-base font-semibold">{profile?.full_name ?? "Your profile"}</div>
            <div className="text-xs text-white/70">
              {profile?.designation ? `${profile.designation} · ` : ""}
              {profile?.company ?? "Add your company"}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-3 mx-4 rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Detail icon={GraduationCap} label="IIT">
            {profile?.iit_campus ?? "—"}
            {profile?.graduation_year ? ` · ${profile.graduation_year}` : ""}
          </Detail>
          <Detail icon={Building2} label="Branch">
            {profile?.branch ?? "—"}
          </Detail>
        </div>
        {profile?.interests?.length ? (
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] uppercase tracking-[0.18em] text-navy-500">
              Interests
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => (
                <span
                  key={i}
                  className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] text-navy-700"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {profile?.linkedin_url ? (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-navy-700 hover:text-navy-900"
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        ) : null}
      </div>

      <div className="mt-6 px-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
          Quick actions
        </h2>
        <ul className="divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
          <MeRow icon={QrCode} label="My QR badge" href="/me/qr" />
          <MeRow icon={Award} label="Sponsors & perks" href="/sponsors" />
          <MeRow icon={FileText} label="My summit recap" href="/recap" />
        </ul>
      </div>

      <div className="mt-4 px-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
          Notifications
        </h2>
        <PushPrompt vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </div>

      {profile?.role === "vc" || profile?.role === "alumni" ? (
        <div className="mt-4 px-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500">
            Availability
          </h2>
          <OfficeHoursToggle initial={!!profile.office_hours_enabled} />
        </div>
      ) : null}

      <Separator className="my-6" />

      <div className="px-4">
        <form action="/api/auth/signout" method="post">
          <Button
            variant="outline"
            type="submit"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
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
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-navy-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-medium text-navy-900">{children}</div>
    </div>
  );
}

function MeRow({
  icon: Icon,
  label,
  href,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  disabled?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between px-4 py-3 transition hover:bg-navy-50"
      >
        <span className="flex items-center gap-3 text-sm text-navy-900">
          <Icon className="h-4 w-4 text-navy-600" />
          {label}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-navy-400">
          {disabled ? disabled : null}
          <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </li>
  );
}
