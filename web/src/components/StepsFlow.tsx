"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Scroll-driven "How to do it" timeline. One S-curved line runs down the gap
// in the middle (the left edge on phones). Its tip is always drawn to exactly
// the point TIP of the way down the screen: on each scroll frame we find where
// that point falls inside the section and draw the line down to that height.
// As the tip passes a step's dot, that step comes in with the scroll (dot
// pops, photo slides in, text rises); scrolling back rewinds it. The tip trails
// the scroll slightly so everything glides.
//
// Children mark up the steps with:
//   [data-step]            one step row; its dot sits DOT_OFFSET below its top
//   [data-step-media]      a photo, slides in from data-from="left" | "right"
//   [data-step-text] > *   text lines, rise in one after another
// People who ask for reduced motion see the full line and all steps at once.

const TIP = 0.7; // the line's tip sits this far down the screen (70%)
const DOT_OFFSET = 56; // px below a step's top where its dot sits
const SAMPLES = 600; // points sampled along the line to map screen height → line length
const REVEAL = 320; // px of scrolling past a step's dot over which its photo and text come in
const FOLLOW = 0.12; // share of the gap to the scroll position closed per frame (lower = floatier)

export function StepsFlow({ steps, children }: { steps: number; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const box = root.current!;
      const line = path.current!;
      const stepEls = gsap.utils.toArray<HTMLElement>("[data-step]", box);
      const dots = gsap.utils.toArray<SVGCircleElement>("[data-flow-dot]", box);

      // ---- Geometry: rebuilt whenever the section's size changes ----------
      let total = 0;
      let dotYs: number[] = [];
      let sampleY: number[] = []; // y of each sample point (increasing)
      let sampleLen: number[] = []; // line length at each sample point

      const layout = () => {
        const w = box.offsetWidth;
        const h = box.offsetHeight;
        const wide = window.matchMedia("(min-width: 768px)").matches;
        const cx = wide ? w / 2 : 24;
        const amp = wide ? 46 : 7;
        const top = box.getBoundingClientRect().top;
        dotYs = stepEls.map((s) => s.getBoundingClientRect().top - top + DOT_OFFSET);

        // Nodes at each step's dot, swinging left/right halfway between them.
        const pts: [number, number][] = [[cx, 0]];
        let prev = 0;
        dotYs.forEach((y, i) => {
          pts.push([cx + (i % 2 ? -amp : amp), (prev + y) / 2]);
          pts.push([cx, y]);
          prev = y;
        });
        pts.push([cx, h]);
        let d = `M${pts[0][0]},${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1];
          const [x1, y1] = pts[i];
          const k = (y1 - y0) / 2; // vertical tangents: smooth S-curves
          d += ` C${x0},${y0 + k} ${x1},${y1 - k} ${x1},${y1}`;
        }
        svg.current!.setAttribute("viewBox", `0 0 ${w} ${h}`);
        line.setAttribute("d", d);

        total = line.getTotalLength();
        line.style.strokeDasharray = `${total}`;
        sampleY = [];
        sampleLen = [];
        for (let i = 0; i <= SAMPLES; i++) {
          const len = (total * i) / SAMPLES;
          sampleLen.push(len);
          sampleY.push(line.getPointAtLength(len).y);
        }

        dots.forEach((dot, i) => {
          dot.setAttribute("cx", String(cx));
          dot.setAttribute("cy", String(dotYs[i] ?? -100));
          dot.setAttribute("visibility", "visible");
        });
      };

      // Line length at which the line reaches height y (binary search, then
      // interpolate between the two nearest samples).
      const lengthAtY = (y: number) => {
        if (y <= 0) return 0;
        if (y >= sampleY[SAMPLES]) return total;
        let lo = 0;
        let hi = SAMPLES;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (sampleY[mid] < y) lo = mid;
          else hi = mid;
        }
        const t = (y - sampleY[lo]) / (sampleY[hi] - sampleY[lo] || 1);
        return sampleLen[lo] + t * (sampleLen[hi] - sampleLen[lo]);
      };

      // Photos slide in from 70px on desktop, a shorter 32px on phones.
      const slide = window.matchMedia("(min-width: 768px)").matches ? 70 : 32;

      // ---- Reveal for each step, scrubbed by the scroll -------------------
      // Each step's timeline runs 0 → 1 while the line's tip travels REVEAL px
      // past the step's dot, so the photo and text move with the scroll wheel
      // (and rewind when scrolling back), like the first flowing version.
      const reveals = stepEls.map((step, i) =>
        gsap
          .timeline({ paused: true, defaults: { ease: "power2.out" } })
          .fromTo(dots[i], { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.2, ease: "back.out(3)" })
          .fromTo(
            step.querySelectorAll<HTMLElement>("[data-step-media]"),
            { x: (_, el: HTMLElement) => (el.dataset.from === "right" ? 1 : -1) * slide, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
            0.1,
          )
          .fromTo(
            step.querySelectorAll<HTMLElement>("[data-step-text] > *"),
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, stagger: 0.07 },
            0.3,
          ),
      );

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The drawn tip trails the real scroll position a little (like GSAP's
        // scrub), so the line and the steps glide rather than jump.
        let tip = -Infinity;
        const target = () => window.innerHeight * TIP - box.getBoundingClientRect().top;

        const render = () => {
          line.style.strokeDashoffset = `${total - lengthAtY(tip)}`;
          dotYs.forEach((dy, i) => {
            reveals[i].progress(gsap.utils.clamp(0, 1, (tip - dy) / REVEAL));
          });
        };

        const tick = () => {
          const t = target();
          if (Math.abs(t - tip) < 0.5) {
            if (tip === t) return;
            tip = t;
          } else {
            tip += (t - tip) * FOLLOW;
          }
          render();
        };

        layout();
        tip = target(); // start in place: no glide on page load
        render();
        gsap.ticker.add(tick);
        ScrollTrigger.create({
          trigger: box,
          onRefresh: () => {
            layout();
            render();
          },
        });
        return () => gsap.ticker.remove(tick);
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        layout();
        line.style.strokeDashoffset = "0";
        reveals.forEach((r) => r.progress(1));
        ScrollTrigger.create({ trigger: box, onRefresh: layout });
      });

      // Re-measure when the section changes size (window width, fonts
      // loading). Watching the section, not the window, ignores the phone
      // address bar sliding in and out while scrolling.
      let alive = true;
      let size = `${box.offsetWidth}x${box.offsetHeight}`;
      const observer = new ResizeObserver(() => {
        const next = `${box.offsetWidth}x${box.offsetHeight}`;
        if (next === size) return;
        size = next;
        ScrollTrigger.refresh();
      });
      observer.observe(box);
      document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());

      return () => {
        alive = false;
        observer.disconnect();
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    // overflow-x-clip: photos waiting off to the side (before they slide in)
    // must not widen the page on phones; clip, unlike hidden, keeps sticky working.
    <div ref={root} className="relative overflow-x-clip">
      <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {/* Drawn by shrinking its dash offset from the full length (hidden) to 0 (drawn) */}
        <path ref={path} fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        {Array.from({ length: steps }, (_, i) => (
          // Hidden until layout() has placed it, so it never flashes at 0,0.
          <circle key={i} data-flow-dot r="9" fill="var(--paper)" stroke="var(--ink)" strokeWidth="4" visibility="hidden" />
        ))}
      </svg>
      {children}
    </div>
  );
}
