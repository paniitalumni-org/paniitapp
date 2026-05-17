import Image from "next/image";

// Branded social marks served from /public/icons. Single source of truth so
// every "candidate details" surface (networking, attendee detail, exhibitor
// team, speaker card) renders the same icon set.

interface IconProps {
  /** Tailwind size token. Defaults to `size-[16px]` for inline use. */
  className?: string;
}

export function LinkedInIcon({ className = "size-[16px]" }: IconProps) {
  return (
    <Image
      src="/icons/linkedin.png"
      alt=""
      width={32}
      height={32}
      className={className}
    />
  );
}

export function XIcon({ className = "size-[16px]" }: IconProps) {
  // The source PNG has ~18% transparent padding around the rounded-square mark,
  // so at parity sizes it reads smaller than LinkedIn. Zoom the inner image
  // inside a fixed-size box so the mark itself matches LinkedIn's weight.
  return (
    <span className={`relative inline-flex items-center justify-center overflow-hidden ${className}`}>
      <Image
        src="/icons/x.png"
        alt=""
        width={32}
        height={32}
        className="h-full w-full scale-[1.55]"
      />
    </span>
  );
}

export function GmailIcon({ className = "h-[18px] w-auto" }: IconProps) {
  return (
    <Image
      src="/icons/gmail.png"
      alt=""
      width={48}
      height={36}
      className={className}
    />
  );
}
