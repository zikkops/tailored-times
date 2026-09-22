import Image from "next/image";
import Link from "next/link";

// Template gallery: each template as a printed front page on a white mat
// (lifts on hover), with its category, name, blurb and a "Customize" link.
// Two columns on phones, three on desktop.

export type GalleryTemplate = {
  slug: string;
  name: string;
  category: string;
  blurb: string;
  cover: string | null;
};

export function TemplateGallery({ templates }: { templates: GalleryTemplate[] }) {
  return (
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-14">
        {templates.map((t) => (
          <li key={t.slug}>
            <Link href={`/templates/${t.slug}`} className="group block">
              {/* The cover, mounted like a printed page */}
              <div className="bg-white p-2 shadow-[0_2px_10px_rgba(13,12,29,0.12)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_14px_30px_rgba(13,12,29,0.22)] sm:p-3">
                <div className="relative aspect-[733/1024] overflow-hidden bg-paper">
                  {t.cover ? (
                    <Image
                      src={t.cover}
                      alt={`${t.name} template front page`}
                      fill
                      sizes="(min-width: 1024px) 340px, 45vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-script text-2xl text-ink/40">{t.name}</span>
                  )}
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="font-roboto text-[10px] font-medium uppercase tracking-[0.25em] text-muted sm:text-[11px]">
                  {t.category}
                </p>
                <h2 className="mt-1 font-news text-lg font-bold leading-tight text-ink sm:text-[22px]">{t.name}</h2>
                <p className="mx-auto mt-2 hidden max-w-[34ch] font-bauhaus text-sm leading-relaxed text-ink/75 sm:line-clamp-2">
                  {t.blurb}
                </p>
                <span className="mt-3 inline-block border-b border-ink pb-0.5 font-roboto text-xs font-medium uppercase tracking-[0.2em] text-ink transition-all group-hover:tracking-[0.28em]">
                  Customize →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
  );
}
