import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QrScanner } from "@/components/features/qr-scanner";

export const dynamic = "force-dynamic";

export default function ScanPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-12 pt-4">
      <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-800/75 transition-colors hover:text-brand-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
      <section className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
          Scan QR
        </h1>
        <p className="mt-1 text-sm leading-6 text-brand-900/75">
          Point your camera at another attendee&apos;s badge to connect with
          them instantly.
        </p>
        <div className="mt-5">
          <QrScanner />
        </div>
      </section>
    </div>
  );
}
