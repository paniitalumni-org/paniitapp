import Link from "next/link";
import {
  ChevronRight,
  LogOut,
  Pencil,
  QrCode,
  Shield,
  UsersRound,
  Camera,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rethrowIfRedirect } from "@/lib/redirect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OfficeHoursToggle } from "@/components/features/office-hours-toggle";
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
  interests: string[] | null;
  asks: string[] | null;
  offers: string[] | null;
  office_hours_enabled: boolean | null;
}

function roleLabel(role: string | null | undefined): string | null {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

function maskEmail(email: string | null): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const [host, ...tld] = domain.split(".");
  const m = (s: string, keep = 1) =>
    s.length <= keep ? s : s.slice(0, keep) + "*".repeat(Math.max(3, s.length - keep));
  return `${m(local, 1)}@${m(host, 1)}.${tld.join(".")}`;
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
            "full_name, photo_url, role, company, designation, bio, iit_campus, graduation_year, branch, interests, asks, offers, office_hours_enabled"
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

  const eduLine = [profile?.iit_campus, profile?.graduation_year, profile?.branch]
    .filter(Boolean)
    .join(" · ");
  const showOfficeHours =
    profile?.role === "vc" || profile?.role === "alumni";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 pb-12 pt-5 lg:pt-8">
      {/* Photo + name + card */}
      <section className="rounded-3xl bg-white px-5 pb-6 pt-7 shadow-[0_1px_0_0_rgba(13,9,48,0.04)] ring-1 ring-brand-100">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="size-24 ring-4 ring-brand-50">
              {profile?.photo_url ? (
                <AvatarImage src={profile.photo_url} alt={profile.full_name ?? ""} />
              ) : null}
              <AvatarFallback className="bg-brand-50 text-xl font-semibold text-brand-800">
                {initials(profile?.full_name ?? "You")}
              </AvatarFallback>
            </Avatar>
            <Link
              href="/me/edit"
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 inline-grid size-8 place-items-center rounded-full bg-brand-800 text-white shadow-sm ring-4 ring-white transition-colors hover:bg-brand-900"
            >
              <Camera className="size-4" strokeWidth={1.8} />
            </Link>
          </div>
          <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-brand-950">
            {profile?.full_name ?? "Your profile"}
          </h1>
          {profile?.role ? (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-800/75">
              {roleLabel(profile.role)}
            </p>
          ) : null}
        </div>

        {/* Label / value rows */}
        <div className="mt-6 space-y-4">
          <Field label="Designation" value={profile?.designation ?? "—"} />
          <Field label="Organization" value={profile?.company ?? "—"} />
          <Field label="Email Address" value={maskEmail(userEmail)} />
          <Field
            label="Bio"
            value={profile?.bio ?? "—"}
            valueClass="whitespace-pre-line leading-6"
          />
          {eduLine ? <Field label="Education" value={eduLine} /> : null}

          {profile?.interests?.length ? (
            <div>
              <p className="text-[13px] font-medium text-brand-900/55">
                Area of interest
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests.map((i) => (
                  <span
                    key={i}
                    className="rounded-md bg-brand-50 px-2.5 py-1.5 text-[12px] font-medium text-brand-900"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile?.asks?.length ? (
            <ChipBlock label="Looking for" items={profile.asks} />
          ) : null}
          {profile?.offers?.length ? (
            <ChipBlock label="Can offer" items={profile.offers} />
          ) : null}
        </div>

        {/* Edit Profile — full width inside card */}
        <Link
          href="/me/edit"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-800 text-sm font-semibold tracking-tight text-white transition-colors hover:bg-brand-900"
        >
          <Pencil className="size-4" strokeWidth={1.8} />
          Edit Profile
        </Link>
      </section>

      {/* Secondary rows */}
      <Row
        href="/attendees?tab=connections"
        icon={<UsersRound className="size-[18px]" strokeWidth={1.7} />}
        label="My Connections"
        meta={connectionCount > 0 ? String(connectionCount) : undefined}
      />
      <Row
        href="/me/qr"
        icon={<QrCode className="size-[18px]" strokeWidth={1.7} />}
        label="My QR Badge"
      />
      <Row
        href="/me/edit#notifications"
        icon={<Shield className="size-[18px]" strokeWidth={1.7} />}
        label="Privacy & Notifications"
      />

      {showOfficeHours ? (
        <section className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
          <h2 className="text-[13px] font-medium text-brand-900/55">
            Availability
          </h2>
          <div className="mt-2">
            <OfficeHoursToggle initial={!!profile?.office_hours_enabled} />
          </div>
        </section>
      ) : null}

      {/* Logout */}
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 ring-1 ring-brand-100 transition-colors hover:bg-iit-50/40"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-brand-950">
            <span className="inline-grid size-9 place-items-center rounded-full bg-iit-50 text-iit-500">
              <LogOut className="size-[18px]" strokeWidth={1.7} />
            </span>
            Logout
          </span>
          <ChevronRight className="size-4 text-brand-800/70" />
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-brand-900/55">{label}</p>
      <p
        className={`mt-1 text-[14px] font-semibold text-brand-950 ${valueClass ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function ChipBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-brand-900/55">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-md bg-brand-50 px-2.5 py-1.5 text-[12px] font-medium text-brand-900"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  meta,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 ring-1 ring-brand-100 transition-colors hover:bg-brand-50/30"
    >
      <span className="flex items-center gap-3 text-sm font-semibold text-brand-950">
        <span className="inline-grid size-9 place-items-center rounded-full bg-brand-50 text-brand-800">
          {icon}
        </span>
        {label}
      </span>
      <span className="flex items-center gap-2">
        {meta ? (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
            {meta}
          </span>
        ) : null}
        <ChevronRight className="size-4 text-brand-800/70" />
      </span>
    </Link>
  );
}
