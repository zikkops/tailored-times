"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// Tilted wall of newspaper covers behind the hero card. It drifts with the
// cursor: alternate columns move by different amounts, which gives depth.
// Covers keep their real page ratio (733×1024) so every page shows in full.
// Scrolling slides the whole wall down, at most 20% of the hero height.
// Motion is off for people who ask for reduced motion; the cursor drift is
// also off on touch screens.

const COLUMNS = 7;
const ROWS = 4;
const DEPTHS = [10, 17, 12, 20, 11, 18, 14]; // px of drift per column at the edge of the hero

const SCROLL_SHIFT = 0.2; // the wall slides down at most 20% of the hero's height
const EASE = 0.08; // share of the remaining distance covered per frame (lower = smoother, slower)

export function HeroCollage({ covers }: { covers: string[] }) {
  const layer = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLDivElement>(null);

  // Scroll: as the hero scrolls out of view, slide the wall down (0 → 20%).
  useEffect(() => {
    const el = layer.current;
    const section = el?.parentElement;
    if (!el || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Instead of jumping to the scroll position, ease towards it each frame
    // (a small step of the remaining distance), so the wall glides and settles.
    let frame = 0;
    let current = 0;
    let target = 0;
    const readTarget = () => {
      const r = section.getBoundingClientRect();
      target = Math.min(1, Math.max(0, -r.top / r.height)) * SCROLL_SHIFT * 100;
    };
    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.01) current = target;
      el.style.transform = `translate3d(0, ${current.toFixed(3)}%, 0)`;
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      readTarget();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    readTarget();
    current = target; // start in place, no glide on page load
    el.style.transform = `translate3d(0, ${current.toFixed(3)}%, 0)`;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Cursor: columns drift away from the pointer by different amounts.
  useEffect(() => {
    const el = wall.current;
    const section = layer.current?.parentElement;
    if (!el || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      // -1 … 1 from the centre of the hero
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={layer} aria-hidden className="absolute inset-0 will-change-transform">
    <div
      ref={wall}
      // Oversized and centred so the 13° tilt never shows empty corners, even
      // after the scroll shift has moved the wall down.
      className="absolute left-1/2 top-1/2 flex w-[max(150%,1300px)] -translate-x-1/2 -translate-y-1/2 rotate-[13deg] justify-center gap-5 [--mx:0] [--my:0]"
    >
      {Array.from({ length: COLUMNS }, (_, c) => (
        <div
          key={c}
          className="flex flex-1 flex-col gap-5 transition-transform duration-500 ease-out will-change-transform"
          style={{
            // Odd columns start lower, like the staggered wall on the live site.
            marginTop: c % 2 ? "12%" : 0,
            transform: `translate3d(calc(var(--mx) * ${-DEPTHS[c]}px), calc(var(--my) * ${-DEPTHS[c] * 1.4}px), 0)`,
          }}
        >
          {Array.from({ length: ROWS }, (_, r) => {
            // Row-major order: no cover sits next to or under a copy of itself.
            const src = covers[(r * COLUMNS + c) % covers.length];
            return (
              <div key={r} className="relative aspect-[733/1024] w-full bg-white shadow-[0_4px_14px_rgba(13,12,29,0.18)]">
                <Image src={src} alt="" fill sizes="(min-width: 1024px) 200px, 30vw" className="object-cover" />
              </div>
            );
          })}
        </div>
      ))}
    </div>
    </div>
  );
}
