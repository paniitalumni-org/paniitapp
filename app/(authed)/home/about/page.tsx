import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const STAKEHOLDERS = [
  {
    name: "Alumni network",
    body: "Working professionals, builders, and operators across 23 IIT campuses.",
  },
  {
    name: "Founders",
    body: "Early- to growth-stage builders in deep tech, AI, climate, and consumer.",
  },
  {
    name: "Investors",
    body: "Angels, VC partners, family offices, and growth funds with India focus.",
  },
  {
    name: "Policy makers",
    body: "Government, regulators, and industry bodies shaping technology policy.",
  },
  {
    name: "Industry partners",
    body: "Operators from large Indian and global enterprises with deep tech roots.",
  },
  {
    name: "Press",
    body: "Journalists and analysts covering Indian technology and policy.",
  },
];

export default function AboutSummitPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-12 pt-4">
      <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-800/75 transition-colors hover:text-brand-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>

      {/* Instagram embed */}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
        <div className="relative aspect-[9/16] w-full bg-brand-50 sm:aspect-[3/4]">
          <iframe
            src="https://www.instagram.com/reel/DXwH6qYPEjp/embed"
            className="absolute inset-0 size-full"
            scrolling="no"
            allowTransparency
            allow="encrypted-media; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
            title="PAN IIT 2026 reel"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
          About the summit
        </h1>
        <p className="mt-3 text-sm leading-7 text-brand-900">
          The PAN IIT Bangalore Summit 2026 brings the technology community
          together for a single day of focused work on India&apos;s sovereignty
          in technology — across AI, deep tech, climate, semiconductors,
          policy, and capital. Alumni, founders, investors and policy makers
          from all 23 IIT campuses converge in Bengaluru on 16 May 2026.
        </p>
        <a
          href="https://paniit.org"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-brand-900"
        >
          paniit.org
          <ExternalLink className="size-3.5" strokeWidth={1.8} />
        </a>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-800/75">
          Who&apos;s participating
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STAKEHOLDERS.map((s) => (
            <li
              key={s.name}
              className="rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-100"
            >
              <p className="text-[13px] font-semibold text-brand-950">{s.name}</p>
              <p className="mt-1 text-[12px] leading-5 text-brand-900/80">
                {s.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
