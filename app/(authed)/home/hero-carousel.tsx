"use client";

import { useEffect, useRef, useState } from "react";

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "16 May 2026 · Bengaluru",
    title: "Sovereignty in Technology",
    body: "One day. 2,000+ alumni, founders, investors, and policy minds across 23 IITs.",
    gradient:
      "bg-[radial-gradient(circle_at_top_left,#3b329e_0%,#1B1464_55%,#0d0930_100%)]",
  },
  {
    eyebrow: "Networking",
    title: "Find the next conversation",
    body: "Search by IIT, role, or focus area. Schedule a 30-minute one-on-one.",
    gradient:
      "bg-[radial-gradient(circle_at_top_right,#4338ca_0%,#1B1464_55%,#0d0930_100%)]",
  },
  {
    eyebrow: "Agenda",
    title: "Eight tracks · one stage",
    body: "AI, Deep tech, Climate, Policy, Founders, Investors, Fintech, Workshops.",
    gradient:
      "bg-[radial-gradient(circle_at_bottom_left,#2563eb_0%,#1B1464_60%,#0d0930_100%)]",
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);

  // Auto-advance every 4.5s
  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((cur) => (cur + 1) % SLIDES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  // Scroll to active slide whenever it changes
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[active] as HTMLElement | undefined;
    if (!child) return;
    lockRef.current = true;
    el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    const t = window.setTimeout(() => {
      lockRef.current = false;
    }, 400);
    return () => window.clearTimeout(t);
  }, [active]);

  // Pick up manual scroll → update active
  function onScroll() {
    if (lockRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const e = c as HTMLElement;
      const mid = e.offsetLeft + e.offsetWidth / 2;
      const d = Math.abs(center - mid);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    setActive(bestIdx);
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth"
      >
        {SLIDES.map((s, i) => (
          <article
            key={i}
            className={`snap-center shrink-0 basis-full rounded-2xl p-5 text-white shadow-[0_10px_40px_-15px_rgba(13,9,48,0.5)] ${s.gradient}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">
              {s.eyebrow}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">
              {s.title}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-white/85">{s.body}</p>
          </article>
        ))}
      </div>
      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-brand-800" : "w-1.5 bg-brand-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
