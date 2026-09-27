import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

// 404, set as a front page that never made it to print: masthead rules, a
// headline, a short story with a drop cap, and the way back.
export default function NotFound() {
  const story =
    "Our newsroom searched every drawer, every archive box and the bottom of the editor's desk, and came back empty-handed. The page you asked for is not here: it may have been renamed, moved to another section, or never printed at all.";

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[900px] px-4 py-14 sm:py-20">
          <article className="relative bg-[#f7f3ea] px-6 py-10 shadow-[0_12px_30px_rgba(13,12,29,0.15)] sm:px-12 sm:py-14">
            {/* Tape, as on the review clippings */}
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-2 bg-paper/80 shadow-sm" />

            <div className="flex items-baseline justify-between font-roboto text-[10px] font-medium uppercase tracking-[0.25em] text-ink/70 sm:text-[11px]">
              <span>The Tailored Times</span>
              <span>Issue 404</span>
            </div>
            <div className="mt-2 h-[5px] border-y border-ink/70" aria-hidden />

            <p className="mt-8 text-center font-script text-[64px] leading-none text-ink-2 sm:text-[96px]">404</p>
            <h1 className="mt-2 text-center font-news text-2xl font-bold leading-tight text-ink sm:text-[34px]">
              This story never made it to print
            </h1>
            <div className="mx-auto mt-4 h-px w-24 bg-ink/40" aria-hidden />

            <p className="mx-auto mt-6 max-w-[54ch] font-news text-[17px] leading-relaxed text-ink sm:text-justify">
              <span aria-hidden className="float-left mr-2 mt-1 font-news text-[52px] font-bold leading-[0.8]">
                {story.charAt(0)}
              </span>
              <span className="sr-only">{story.charAt(0)}</span>
              {story.slice(1)}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/templates" className="btn-dark w-full text-center font-medium sm:w-auto">
                Pick a template
              </Link>
              <Link href="/" className="btn-light w-full text-center sm:w-auto">
                Back to the front page
              </Link>
            </div>

            <p className="mt-8 border-t border-ink/20 pt-4 text-center font-roboto text-xs text-ink/60">
              Looking for something specific?{" "}
              <Link href="/contact" className="underline underline-offset-4">
                Write to the editor
              </Link>{" "}
              or call{" "}
              <a href="tel:+96181587957" className="underline underline-offset-4">
                +961 81 587 957
              </a>
              .
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
