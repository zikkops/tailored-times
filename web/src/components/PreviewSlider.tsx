"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNumberedPreview } from "./NumberedPreview";

// Page previews with arrows, like the image carousel on the live template pages.
// On step 2 of the order it shows the numbered pages instead, and the order
// form turns them to the page of the field being filled in.
export function PreviewSlider({ images, numbered = [], name }: { images: string[]; numbered?: string[]; name: string }) {
  const [own, setOwn] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const { page, setPage } = useNumberedPreview();

  const showNumbered = page !== null && numbered.length > 0;
  const list = showNumbered ? numbered : images;
  const i = Math.min(showNumbered ? page : own, Math.max(list.length - 1, 0));
  const setI = showNumbered ? setPage : setOwn;
  const go = (d: number) => setI((i + d + list.length) % list.length);

  // While a page is open full size: arrow keys turn, Escape closes, and the
  // page behind does not scroll away under it.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
      if (e.key === "ArrowLeft") setI((i - 1 + list.length) % list.length);
      if (e.key === "ArrowRight") setI((i + 1) % list.length);
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [zoomed, i, list.length, setI]);

  if (!list.length) return null;
  const label = showNumbered ? `${name} template, numbered page` : `${name} template, page`;

  const arrow = "flex h-11 w-11 items-center justify-center text-3xl text-ink";

  return (
    <div className="relative flex h-[58vh] flex-col px-8 md:h-full">
      {showNumbered && (
        <p className="mb-2 shrink-0 text-center font-roboto text-xs text-muted">
          The numbers match the fields in the form. Page {i + 1} of {list.length}.
        </p>
      )}
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`Open ${label} ${i + 1} full size`}
        className="relative min-h-0 w-full flex-1 cursor-zoom-in"
      >
        <Image
          src={list[i]}
          alt={`${label} ${i + 1} of ${list.length}`}
          fill
          sizes="(min-width: 768px) 400px, 90vw"
          className="object-contain object-top"
          loading="eager"
        />
      </button>
      {list.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous page" className={`absolute -left-2 top-1/2 -translate-y-1/2 ${arrow}`}>
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next page" className={`absolute -right-2 top-1/2 -translate-y-1/2 ${arrow}`}>
            ›
          </button>
          <p className="mt-2 shrink-0 text-center font-roboto text-xs text-muted">Click a page to see it bigger.</p>
          <div className="flex shrink-0 justify-center">
            {list.map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => setI(n)}
                aria-label={`Page ${n + 1}`}
                className="flex h-8 w-8 items-center justify-center"
              >
                <span aria-hidden className={`block h-2 w-2 rounded-full ${n === i ? "bg-ink" : "bg-line"}`} />
              </button>
            ))}
          </div>
        </>
      )}

      {zoomed && <Lightbox list={list} i={i} setI={setI} label={label} onClose={() => setZoomed(false)} />}
    </div>
  );
}

// The page, as large as the window allows, over everything else.
function Lightbox({
  list,
  i,
  setI,
  label,
  onClose,
}: {
  list: string[];
  i: number;
  setI: (n: number) => void;
  label: string;
  onClose: () => void;
}) {
  // Only ever rendered after a click, so the browser is always there.
  const go = (d: number) => setI((i + d + list.length) % list.length);
  const side =
    "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-3xl text-ink hover:bg-paper";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} ${i + 1} of ${list.length}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/90 p-4 sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper/90 text-2xl text-ink hover:bg-paper"
      >
        ×
      </button>

      {/* Clicking the picture itself must not close it. */}
      <div onClick={(e) => e.stopPropagation()} className="relative h-full w-full max-w-[1100px] cursor-default">
        <Image
          src={list[i]}
          alt={`${label} ${i + 1} of ${list.length}`}
          fill
          sizes="100vw"
          className="object-contain"
          loading="eager"
        />
        {list.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous page" className={`${side} left-1 sm:-left-14`}>
              ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next page" className={`${side} right-1 sm:-right-14`}>
              ›
            </button>
          </>
        )}
      </div>

      <p className="mt-3 shrink-0 font-roboto text-xs uppercase tracking-[0.18em] text-paper/80">
        Page {i + 1} of {list.length}
      </p>
    </div>,
    document.body,
  );
}
