// Custom-drawn nav glyphs that stay distinct from a generic Lucide set
// while keeping the same 24×24 stroke geometry. Each path is meant to be
// rendered with currentColor + class="size-…" from the consumer.

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

// Globe with four rays — used for the Networking tab + similar callouts.
export function GlobeRays({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M7.5 12h9" />
      <path d="M12 7.5c1.6 1.3 1.6 7.7 0 9" />
      <path d="M12 7.5c-1.6 1.3-1.6 7.7 0 9" />
      <path d="M12 2.2v1.6M12 20.2v1.6M2.2 12h1.6M20.2 12h1.6" />
      <path d="M5.3 5.3l1.1 1.1M18.7 18.7l-1.1-1.1M5.3 18.7l1.1-1.1M18.7 5.3l-1.1 1.1" />
    </svg>
  );
}

// Three nodes joined into a triangle — used for My Connections.
export function ConnectionsGlyph({
  className,
  strokeWidth = 1.6,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="5.2" r="2.1" />
      <circle cx="5.2" cy="18.2" r="2.1" />
      <circle cx="18.8" cy="18.2" r="2.1" />
      <path d="M10.9 6.9 6.3 16.4" />
      <path d="M13.1 6.9 17.7 16.4" />
      <path d="M7.3 18.2h9.4" />
    </svg>
  );
}

// Shield wrapping a bell — used for Privacy & Notifications.
export function ShieldChime({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M12 2.8 4.6 5.3v5.6c0 4.3 3 7.6 7.4 10 4.4-2.4 7.4-5.7 7.4-10V5.3L12 2.8z" />
      <path d="M9.3 13.8a2.7 2.7 0 0 0 5.4 0" />
      <path d="M8.5 13.2v-2.4a3.5 3.5 0 0 1 7 0v2.4" />
    </svg>
  );
}
