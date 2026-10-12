import Link from "next/link";
import { LEGAL_DOCS, type LegalSlug } from "@/data/legal";

// The owner's Terms and Privacy documents, set as a page of the paper: the
// same masthead header as the other pages, then one readable column of
// numbered sections. The words are theirs, straight from the Word files in
// data/ (see scripts/generate-legal.ts); nothing here rewrites them.

export function LegalPage({ slug, eyebrow }: { slug: LegalSlug; eyebrow: string }) {
  const doc = LEGAL_DOCS[slug];

  return (
    <div className="mx-auto max-w-[1140px] px-4 pb-20 pt-10 sm:pt-14">
      <header className="mx-auto max-w-[760px] text-center">
        <p className="font-roboto text-[11px] font-medium uppercase tracking-[0.3em] text-muted sm:text-xs">
          The Tailored Times · {eyebrow}
        </p>
        <h1 className="mt-2 font-script text-[40px] leading-tight text-ink-2 sm:text-[56px]">{doc.title}</h1>
        <div className="mt-3 h-[6px] border-y border-ink/70" aria-hidden />
        {doc.updated && (
          <p className="mt-4 font-roboto text-xs uppercase tracking-[0.18em] text-muted">{doc.updated}</p>
        )}
      </header>

      <article className="mx-auto mt-10 max-w-[760px] font-bauhaus text-[15px] leading-relaxed text-ink/85 sm:text-base">
        {doc.blocks.map((block, i) => {
          if (block.type === "h2") {
            return (
              <h2
                key={i}
                className="mt-10 border-b border-ink/20 pb-2 font-news text-xl font-bold text-ink sm:text-2xl"
              >
                {block.text}
              </h2>
            );
          }
          if (block.type === "h3") {
            return (
              <h3 key={i} className="mt-6 font-roboto text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">
                {block.text}
              </h3>
            );
          }
          if (block.type === "ul") {
            return (
              <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 marker:text-ink/40">
                {block.items.map((item, n) => (
                  <li key={n}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="mt-4">
              {block.text}
            </p>
          );
        })}
      </article>

      <p className="mx-auto mt-12 max-w-[760px] border-t border-ink/15 pt-6 text-center font-roboto text-sm text-muted">
        Anything unclear?{" "}
        <Link href="/contact" className="underline underline-offset-4">
          Send us a message
        </Link>{" "}
        or call{" "}
        <a href="tel:+96181587957" className="underline underline-offset-4">
          +961 81 587 957
        </a>
        .
      </p>
    </div>
  );
}
