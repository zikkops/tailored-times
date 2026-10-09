"use client";

import Image from "next/image";
import { useState } from "react";
import { useNumberedPreview } from "./NumberedPreview";

// Page previews with arrows, like the image carousel on the live template pages.
// On step 2 of the order it shows the numbered pages instead, and the order
// form turns them to the page of the field being filled in.
export function PreviewSlider({ images, numbered = [], name }: { images: string[]; numbered?: string[]; name: string }) {
  const [own, setOwn] = useState(0);
  const { page, setPage } = useNumberedPreview();
  const showNumbered = page !== null && numbered.length > 0;
  const list = showNumbered ? numbered : images;
  const i = Math.min(showNumbered ? page : own, list.length - 1);
  const setI = showNumbered ? setPage : setOwn;
  if (!list.length) return null;
  const go = (d: number) => setI((i + d + list.length) % list.length);
  const label = showNumbered ? `${name} template, numbered page` : `${name} template, page`;

  return (
    <div className="relative flex h-[58vh] flex-col px-8 md:h-full">
      {showNumbered && (
        <p className="mb-2 shrink-0 text-center font-roboto text-xs text-muted">
          The numbers match the fields in the form. Page {i + 1} of {list.length}.
        </p>
      )}
      <a href={list[i]} target="_blank" rel="noreferrer" className="relative min-h-0 w-full flex-1">
        <Image
          src={list[i]}
          alt={`${label} ${i + 1} of ${list.length}`}
          fill
          sizes="(min-width: 768px) 400px, 90vw"
          className="object-contain object-top"
          loading="eager"
        />
      </a>
      {list.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous page" className="absolute -left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-3xl text-ink">
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next page" className="absolute -right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-3xl text-ink">
            ›
          </button>
          <p className="mt-2 shrink-0 text-center font-roboto text-xs text-muted">Click a page to open it full size.</p>
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
    </div>
  );
}
