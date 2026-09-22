"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Site header in the same newspaper style as the section banners: a thin
// top strip, the logo, a section-bar menu (small caps between hairlines, an
// underline on hover and on the current page) and a "Start your paper"
// button. Sticks to the top; on phones the menu folds into a button.

const NAV = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/contact", label: "Contact" },
];

const isCurrent = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      {/* Top strip */}
      <div className="bg-ink text-paper/80">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-4 py-1.5 font-roboto text-[10px] uppercase tracking-[0.25em] sm:text-[11px]">
          <span className="truncate">Custom newspapers for every occasion</span>
          <a href="tel:+96181587957" className="hidden shrink-0 hover:text-paper sm:inline">
            +961 81 587 957
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-4 py-2">
        <Link href="/" aria-label="Tailored Times home" className="shrink-0">
          <Image src="/brand/logo.png" alt="Tailored Times" width={85} height={80} priority className="h-[56px] w-auto sm:h-[68px]" />
        </Link>

        {/* Desktop: section bar + button */}
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center divide-x divide-ink/25">
            {NAV.map((n) => {
              const current = isCurrent(path, n.href);
              return (
                <li key={n.href} className="px-6 first:pl-0 last:pr-0">
                  <Link
                    href={n.href}
                    aria-current={current ? "page" : undefined}
                    className={`group relative py-2 font-roboto text-[13px] font-medium uppercase tracking-[0.22em] transition-colors ${
                      current ? "text-ink" : "text-ink/70 hover:text-ink"
                    }`}
                  >
                    {n.label}
                    <span
                      aria-hidden
                      className={`absolute -bottom-0.5 left-0 h-[2px] w-full origin-left bg-ink transition-transform duration-300 ${
                        current ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/templates" className="btn-dark whitespace-nowrap !px-5 !py-2.5 font-medium">
            Start your paper
          </Link>
        </nav>

        {/* Phone: menu button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex items-center gap-2 rounded border border-ink/30 px-3 py-2 font-roboto text-xs font-medium uppercase tracking-[0.2em] text-ink md:hidden"
        >
          <span aria-hidden className="relative block h-3 w-4">
            <span className={`absolute left-0 h-0.5 w-4 bg-ink transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-4 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-4 bg-ink transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
          Menu
        </button>
      </div>

      {/* Phone: drop-down menu */}
      <nav
        id="mobile-menu"
        aria-label="Main"
        className={`overflow-hidden transition-[max-height] duration-300 md:hidden ${open ? "max-h-80" : "max-h-0"}`}
      >
        <ul className="mx-4 border-t border-ink/20 pb-4">
          {NAV.map((n) => (
            <li key={n.href} className="border-b border-ink/10">
              <Link
                href={n.href}
                aria-current={isCurrent(path, n.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3 font-roboto text-sm font-medium uppercase tracking-[0.2em] text-ink aria-[current=page]:font-semibold"
              >
                {n.label}
                {isCurrent(path, n.href) && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink" />}
              </Link>
            </li>
          ))}
          <li className="pt-4">
            <Link href="/templates" onClick={() => setOpen(false)} className="btn-dark block w-full text-center font-medium">
              Start your paper
            </Link>
          </li>
        </ul>
      </nav>

    </header>
  );
}
