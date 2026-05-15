"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, QrCode, ScanLine, BookOpen } from "lucide-react";
import { MyQrDialog } from "@/components/features/my-qr-dialog";

export function QuickActions() {
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="flex items-center gap-3 rounded-lg border border-brand-100 bg-white px-3.5 py-3 lg:px-4 lg:py-4 text-left transition-colors hover:bg-brand-50/30"
        >
          <QrCode className="size-[18px] text-brand-800" strokeWidth={1.5} />
          <span className="text-[13px] font-semibold leading-tight text-brand-950">
            My QR
          </span>
        </button>
        <ActionLink
          href="/scan"
          icon={<ScanLine className="size-[18px]" strokeWidth={1.5} />}
          label="Scan QR"
        />
        <ActionLink
          href="mailto:summit@paniit.org"
          icon={<Mail className="size-[18px]" strokeWidth={1.5} />}
          label="Contact us"
        />
        <ActionLink
          href="/sponsors"
          icon={<BookOpen className="size-[18px]" strokeWidth={1.5} />}
          label="Resources"
        />
      </div>
      <MyQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </>
  );
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-brand-100 bg-white px-3.5 py-3 lg:px-4 lg:py-4 transition-colors hover:bg-brand-50/30"
    >
      <span className="text-brand-800">{icon}</span>
      <span className="text-[13px] font-semibold leading-tight text-brand-950">
        {label}
      </span>
    </Link>
  );
}
