import Image from "next/image";
import Link from "next/link";
import { SocialIcons } from "./SocialIcons";

// Site footer, styled like the back page of the paper: centred logo and
// tagline over a double rule, four readable columns, and a small print line.

const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/contact", label: "Contact us" },
];

const heading = "font-roboto text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/70";
const link = "inline-block py-2 font-bauhaus text-[15px] text-ink transition-opacity hover:opacity-60";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-paper text-ink">
      <div className="mx-auto max-w-[1140px] px-4 pb-8 pt-14">
        {/* Masthead */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Tailored Times home">
            <Image src="/brand/logo.png" alt="Tailored Times" width={110} height={104} className="h-[88px] w-auto" />
          </Link>
          <p className="mt-3 font-script text-2xl text-ink-2 sm:text-[28px]">Because every story deserves a front page.</p>
        </div>
        <div className="mt-6 h-[5px] border-y border-ink/50" aria-hidden />

        {/* Columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 lg:grid-cols-4">
          {/* Phones: About full width, then Sections + Follow side by side, then
              Contact full width (the email address needs the room). */}
          <div className="order-1 col-span-2 lg:order-none lg:col-span-1">
            <h2 className={heading}>About</h2>
            <p className="mt-4 font-bauhaus text-[15px] leading-relaxed text-ink/85">
              Custom-made newspapers for birthdays, weddings, retirements and every occasion that deserves the
              spotlight. Made to look and feel like the real thing, and delivered to your door.
            </p>
          </div>

          <div className="order-2 lg:order-none">
            <h2 className={heading}>Sections</h2>
            <ul className="mt-2">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className={link}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-4 col-span-2 sm:col-span-1 lg:order-none">
            <h2 className={heading}>Contact</h2>
            <ul className="mt-2">
              <li>
                <a href="mailto:contact@tailored-times.com" className={link}>
                  contact@tailored-times.com
                </a>
              </li>
              <li>
                <a href="tel:+96181587957" className={link}>
                  +961 81 587 957
                </a>
              </li>
              <li className="py-2 font-bauhaus text-[15px] text-ink/70">Lebanon · Free delivery</li>
            </ul>
          </div>

          <div className="order-3 lg:order-none">
            <h2 className={heading}>Follow</h2>
            <SocialIcons className="mt-2" />
            <Link href="/templates" className="btn-dark mt-6 font-medium">
              Start your paper
            </Link>
          </div>
        </div>

        {/* Small print */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-ink/20 pt-6 font-roboto text-xs text-ink/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Tailored Times. All rights reserved.</p>
          <p>Cash on delivery · Free delivery</p>
        </div>
      </div>
    </footer>
  );
}
