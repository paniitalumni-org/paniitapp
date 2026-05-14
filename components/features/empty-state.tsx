import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="mx-auto max-w-sm rounded-xl border border-dashed border-navy-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy-50 text-navy-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{description}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="mt-4 inline-block">
          <Button size="sm" variant="outline">
            {ctaLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
