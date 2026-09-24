"use client";

import { useEffect, useRef, useState } from "react";
import { Masthead } from "./Masthead";

// "Talk of the Town": each review is a newspaper clipping taped onto the dark
// band (off-white paper, slight tilt, "Letters to the Editor" header, pull
// quote as the headline, the review in a newspaper serif with a drop cap).
// A carousel: two clippings on desktop, one on phones; arrows, dots, keyboard
// arrows and swiping move through them, wrapping at the ends.
//
// PLACEHOLDER CONTENT: only the first review comes from the live site, and it
// is itself a placeholder there. The rest are samples written to fill the
// carousel. Replace all of them with real customer reviews before launch
// (UPGRADE.md I8): publishing invented reviews as real is not OK.
const REVIEWS = [
  {
    headline: "Worth every penny",
    quote:
      "I made a fake tabloid for my best friend's birthday and she cried laughing. Headlines like 'Local Legend Turns 30' and 'Still Single, Still Fabulous' — worth every penny.",
    name: "Jad",
    title: "Serial Gifter",
  },
  {
    // Real review, supplied by the owner (bug list R9).
    headline: "She was OBSESSED",
    quote:
      "I surprised my best friend with a custom newspaper for her birthday and she was OBSESSED! 🥹 It looked so personal and thoughtful, and honestly made the whole gift feel ten times more special. Such a cute idea!",
    name: "Maya",
    title: "Birthday Bestie",
  },
  {
    headline: "The office read it twice",
    quote:
      "For my dad's retirement we filled a broadsheet with thirty years of office stories. His colleagues passed it around the whole afternoon, and now it hangs framed in his study.",
    name: "Sample review",
    title: "Retirement edition",
  },
  {
    headline: "Mum framed it the same day",
    quote:
      "The Mother's Day paper had her old photos on the front page and a crossword with family in-jokes. She framed it before we'd even finished lunch.",
    name: "Sample review",
    title: "Mother's Day edition",
  },
  {
    headline: "Best team gift we've done",
    quote:
      "We printed a special edition for our company anniversary with a story on every department. People still quote the headlines in meetings.",
    name: "Sample review",
    title: "Corporate edition",
  },
];

const TILTS = ["-rotate-1", "rotate-1", "-rotate-[0.6deg]", "rotate-[0.8deg]", "-rotate-[1.3deg]"];

function Clipping({ review, index }: { review: (typeof REVIEWS)[number]; index: number }) {
  const first = review.quote.charAt(0);
  const rest = review.quote.slice(1);
  return (
    <figure
      className={`relative mx-auto flex h-full w-full max-w-[600px] flex-col bg-[#f7f3ea] px-6 pb-7 pt-6 text-ink shadow-[0_12px_30px_rgba(0,0,0,0.45)] sm:px-9 ${TILTS[index % TILTS.length]}`}
    >
      {/* Strip of tape holding the clipping on */}
      <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 rotate-2 bg-paper/70 shadow-sm" />

      <div className="flex items-baseline justify-center whitespace-nowrap font-roboto text-[10px] font-medium uppercase tracking-[0.2em] text-ink/70 sm:justify-between sm:text-[11px] sm:tracking-[0.25em]">
        <span>Letters to the Editor</span>
        <span className="hidden sm:inline">Reader Review</span>
      </div>
      <div className="mt-2 h-[5px] border-y border-ink/70" aria-hidden />

      <h3 className="mt-4 text-center font-news text-2xl font-bold italic leading-tight sm:text-[28px]">
        &ldquo;{review.headline}&rdquo;
      </h3>
      <div className="mx-auto mt-3 h-px w-16 bg-ink/50" aria-hidden />

      <blockquote className="mt-4 flex-1 font-news text-[17px] leading-relaxed [hyphens:auto] sm:text-justify">
        <span aria-hidden className="float-left mr-2 mt-1 font-news text-[52px] font-bold leading-[0.8]">
          {first}
        </span>
        <span className="sr-only">{first}</span>
        {rest}
      </blockquote>

      <figcaption className="mt-5 border-t border-ink/30 pt-3 text-right font-roboto text-xs uppercase tracking-[0.2em] text-ink/80">
        — {review.name}, <span className="font-news normal-case italic tracking-normal">{review.title}</span>
      </figcaption>
    </figure>
  );
}

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous review" : "Next review"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-paper/50 text-2xl leading-none text-paper transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-paper"
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

export function Testimonials() {
  const [perView, setPerView] = useState(1);
  const [index, setIndex] = useState(0);
  const swipeFrom = useRef<number | null>(null);

  // Two clippings side by side from the md breakpoint up, one below.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setPerView(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const pages = Math.max(1, REVIEWS.length - perView + 1); // positions the track can stop at
  const current = Math.min(index, pages - 1);
  const go = (to: number) => setIndex(((to % pages) + pages) % pages); // wraps at both ends

  return (
    <section className="band pb-16" aria-roledescription="carousel" aria-label="Customer reviews">
      <Masthead section="Section D" subtitle="What our readers say" className="!bg-none !bg-transparent">
        Talk of the Town
      </Masthead>

      <div
        className="mx-auto mt-2 flex max-w-[1300px] items-center gap-2 px-2 sm:gap-4 sm:px-6"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(current - 1);
          if (e.key === "ArrowRight") go(current + 1);
        }}
      >
        <Arrow dir="prev" onClick={() => go(current - 1)} />

        <div
          className="flex-1 overflow-hidden"
          // Swipe on touch screens (mouse users have the arrows and dots).
          onTouchStart={(e) => (swipeFrom.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (swipeFrom.current === null) return;
            const dx = e.changedTouches[0].clientX - swipeFrom.current;
            swipeFrom.current = null;
            if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
          }}
          onTouchCancel={() => (swipeFrom.current = null)}
        >
          <ul
            className="flex touch-pan-y transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${(current * 100) / perView}%)` }}
          >
            {REVIEWS.map((r, i) => {
              const onScreen = i >= current && i < current + perView;
              return (
                <li
                  key={r.headline}
                  className="shrink-0 basis-full px-3 pb-8 pt-6 md:basis-1/2 md:px-5"
                  aria-hidden={!onScreen}
                  inert={!onScreen}
                  aria-roledescription="slide"
                  aria-label={`Review ${i + 1} of ${REVIEWS.length}`}
                >
                  <Clipping review={r} index={i} />
                </li>
              );
            })}
          </ul>
        </div>

        <Arrow dir="next" onClick={() => go(current + 1)} />
      </div>

      {/* One dot per position the carousel can stop at */}
      <div className="mt-1 flex justify-center">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show reviews from ${i + 1}`}
            aria-current={i === current}
            className="group flex h-10 min-w-10 items-center justify-center"
          >
            <span
              aria-hidden
              className={`block h-2.5 rounded-full transition-all ${i === current ? "w-7 bg-paper" : "w-2.5 bg-paper/40 group-hover:bg-paper/70"}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
