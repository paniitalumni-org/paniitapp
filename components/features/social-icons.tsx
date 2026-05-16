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

export function XIcon({ className = "size-[15px]" }: IconProps) {
  return (
    <Image
      src="/icons/x.png"
      alt=""
      width={32}
      height={32}
      className={className}
    />
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
