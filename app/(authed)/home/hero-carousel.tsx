"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Slide {
  src: string;
  alt: string;
}

const SLIDES: Slide[] = [
  {
    src: "https://afilemanager.s3.dualstack.ap-southeast-1.amazonaws.com/prod/cid_359/pan_image_1_1_50.png",
    alt: "PAN IIT 2026 — promotional banner 1",
  },
  {
    src: "https://afilemanager.s3.dualstack.ap-southeast-1.amazonaws.com/prod/cid_0/pan_image_5.png",
    alt: "PAN IIT 2026 — promotional banner 2",
  },
  {
    src: "https://afilemanager.s3.dualstack.ap-southeast-1.amazonaws.com/prod/cid_359/pan_image_2_50.png",
    alt: "PAN IIT 2026 — promotional banner 3",
  },
  {
    src: "https://afilemanager.s3.dualstack.ap-southeast-1.amazonaws.com/prod/cid_2567/PANIITGuestpanel1.png",
    alt: "PAN IIT 2026 — guest panel 1",
  },
  {
    src: "https://afilemanager.s3.dualstack.ap-southeast-1.amazonaws.com/prod/cid_2567/PANIITpanel2.png",
    alt: "PAN IIT 2026 — guest panel 2",
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((cur) => (cur + 1) % SLIDES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

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
            className="relative aspect-[4/3] snap-center shrink-0 basis-full overflow-hidden rounded-lg border border-brand-100 bg-brand-50"
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </article>
        ))}
      </div>
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
