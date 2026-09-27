"use client";

import Image from "next/image";
import { useState } from "react";

// Page previews with arrows, like the image carousel on the live template pages.
export function PreviewSlider({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);

  return (
    <div className="relative flex h-[58vh] flex-col px-8 md:h-full">
      <a href={images[i]} target="_blank" rel="noreferrer" className="relative min-h-0 w-full flex-1">
        <Image
          src={images[i]}
          alt={`${name} template, page ${i + 1} of ${images.length}`}
          fill
          sizes="(min-width: 768px) 400px, 90vw"
          className="object-contain object-top"
          loading="eager"
        />
      </a>
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous page" className="absolute -left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-3xl text-ink">
            ‹
          </button>
          <button onClick={() => go(1)} aria-label="Next page" className="absolute -right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-3xl text-ink">
            ›
          </button>
          <p className="mt-2 shrink-0 text-center font-roboto text-xs text-muted">Click a page to open it full size.</p>
          <div className="flex shrink-0 justify-center">
            {images.map((_, n) => (
              <button
                key={n}
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
