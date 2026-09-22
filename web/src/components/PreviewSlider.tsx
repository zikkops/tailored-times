"use client";

import Image from "next/image";
import { useState } from "react";

// Page previews with arrows, like the image carousel on the live template pages.
export function PreviewSlider({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return null;
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);

  return (
    <div className="relative px-8">
      <a href={images[i]} target="_blank" rel="noreferrer" className="relative block aspect-[733/1024] bg-paper">
        <Image
          src={images[i]}
          alt={`${name} template, page ${i + 1} of ${images.length}`}
          fill
          sizes="(min-width: 768px) 400px, 90vw"
          className="object-contain"
          loading="eager"
        />
      </a>
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Previous page" className="absolute left-0 top-1/2 -translate-y-1/2 px-1 text-3xl text-ink">
            ‹
          </button>
          <button onClick={() => go(1)} aria-label="Next page" className="absolute right-0 top-1/2 -translate-y-1/2 px-1 text-3xl text-ink">
            ›
          </button>
          <div className="mt-3 flex justify-center gap-2">
            {images.map((_, n) => (
              <button
                key={n}
                onClick={() => setI(n)}
                aria-label={`Page ${n + 1}`}
                className={`h-2 w-2 rounded-full ${n === i ? "bg-ink" : "bg-line"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
