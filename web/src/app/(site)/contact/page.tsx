import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { SocialIcons } from "@/components/SocialIcons";

export const metadata: Metadata = { title: "Contact us" };

// Contact page in the site's newspaper style: the same page header as the
// template gallery, the form as a "Letters to the Editor" card, and the other
// ways to reach us as boxed classified-ad panels beside it.

function Classified({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink/70 p-5">
      <h2 className="border-b border-ink/30 pb-2 font-roboto text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/80">
        {title}
      </h2>
      <div className="mt-3 font-bauhaus text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1140px] px-4 pb-20 pt-10 sm:pt-14">
      <header className="mx-auto max-w-[760px] text-center">
        <p className="font-roboto text-[11px] font-medium uppercase tracking-[0.3em] text-muted sm:text-xs">
          The Tailored Times · Contact
        </p>
        <h1 className="mt-2 font-script text-[40px] leading-tight text-ink-2 sm:text-[60px]">Get in touch</h1>
        <div className="mt-3 h-[6px] border-y border-ink/70" aria-hidden />
        <p className="mt-4 font-bauhaus text-base text-ink/80 sm:text-lg">
          Questions, custom designs or big orders: write to us and we&apos;ll get back to you.
        </p>
      </header>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* The form, as a letters-page card */}
        <div className="bg-[#f7f3ea] px-5 pb-7 pt-5 shadow-[0_4px_24px_rgba(13,12,29,0.12)] sm:px-8">
          <div className="flex items-baseline justify-between font-roboto text-[10px] font-medium uppercase tracking-[0.25em] text-ink/70 sm:text-[11px]">
            <span>Letters to the Editor</span>
            <span>Write to us</span>
          </div>
          <div className="mb-6 mt-2 h-[5px] border-y border-ink/60" aria-hidden />
          <ContactForm />
        </div>

        {/* Other ways to reach us */}
        <aside className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Classified title="By phone">
            <a href="tel:+96181587957" className="inline-block py-1 font-news text-2xl font-bold hover:underline">
              +961 81 587 957
            </a>
          </Classified>
          <Classified title="By email">
            <a href="mailto:contact@tailored-times.com" className="inline-block break-all py-2 hover:underline">
              contact@tailored-times.com
            </a>
          </Classified>
          <Classified title="Follow us">
            <p className="mb-3 text-ink/80">Find us on Instagram, Facebook and TikTok.</p>
            <SocialIcons />
          </Classified>
          <Classified title="Custom designs">
            <p className="text-ink/80">
              Want a template built from scratch? We&apos;ll arrange a meeting with our designer, who guides you through
              it step by step. Available for an additional fee.
            </p>
            <Link
              href="/templates"
              className="mt-2 inline-block py-2 font-roboto text-xs font-medium uppercase tracking-[0.2em] text-ink underline decoration-ink underline-offset-4"
            >
              Or pick a ready-made template →
            </Link>
          </Classified>
        </aside>
      </div>
    </div>
  );
}
