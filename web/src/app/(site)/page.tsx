import Image from "next/image";
import Link from "next/link";
import { HeroCollage } from "@/components/HeroCollage";
import { Masthead } from "@/components/Masthead";
import { StepsFlow } from "@/components/StepsFlow";
import { Testimonials } from "@/components/Testimonials";

// Home page: same layout, copy and images as the live site (21 Sep 2026).
// Audit fixes kept: no "Art exhibition" (no such template), page limit matches
// the calculator (1–24), step 5/6 copy matches the new order flow.

const COLLAGE = [
  "1.jpeg", "2.png", "3.jpg", "4.jpg", "5.jpg", "11.jpg",
  "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "12.jpg",
].map((f) => `/home/collage/${f}`);

const CATEGORIES = [
  ["Anniversary", "Baby showers", "Birthdays", "Wedding", "Corporate"],
  ["Events", "Fashion", "Menu", "Mother's day", "Father's day"],
  ["Promotions", "Retirements", "Sports tribute", "Summer camp souvenir"],
];

// A section laid out like a newspaper story: small-caps kicker, full-width
// script headline over a double rule, then the text with a drop cap. Longer
// text flows into two ruled columns; short text stays in one narrower column
// (two columns of two lines each look empty). One column on phones.
const TWO_COLUMNS_FROM = 250; // characters

function Article({ kicker, title, children }: { kicker: string; title: string; children: string }) {
  // The drop cap is a real element, not ::first-letter: Chromium can push a
  // floated ::first-letter into the second column when the text is short.
  const [first, rest] = [children.trim().charAt(0), children.trim().slice(1)];
  const twoColumns = children.length >= TWO_COLUMNS_FROM;
  return (
    <article className="mx-auto max-w-[1000px] px-4 py-16 sm:py-20">
      <p className="text-center font-roboto text-[11px] font-medium uppercase tracking-[0.3em] text-muted sm:text-xs">
        {kicker}
      </p>
      <h2 className="mt-2 text-center font-script text-[34px] leading-tight text-ink-2 sm:text-[52px]">{title}</h2>
      <div className="mt-4 h-[6px] border-y border-ink/70" aria-hidden />
      <p
        className={`mt-8 font-bauhaus text-base leading-relaxed text-ink sm:text-lg ${
          twoColumns ? "md:columns-2 md:gap-14 md:[column-rule:1px_solid_var(--line)]" : "mx-auto max-w-[640px]"
        }`}
      >
        <span aria-hidden className="float-left mr-3 mt-1 font-script text-[72px] leading-[0.8] text-ink-2">
          {first}
        </span>
        <span className="sr-only">{first}</span>
        {rest}
      </p>
    </article>
  );
}

// One step of "How to do it": two halves with an open channel in the middle
// for the flowing line (StepsFlow). On phones it stacks, right of the line.
function Step({ children }: { children: React.ReactNode }) {
  return (
    <section
      data-step
      className="grid items-center gap-6 pl-14 pr-4 md:grid-cols-[1fr_160px_1fr] md:gap-0 md:px-4 md:[&>*:first-child]:col-start-1 md:[&>*:last-child]:col-start-3"
    >
      {children}
    </section>
  );
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <>
      <h3 className="font-script text-4xl leading-none text-ink-2 sm:text-[44px]">Step {n}</h3>
      <p className="font-script text-[22px] text-ink-2">{title}</p>
    </>
  );
}

function Option({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-script text-xl text-ink-2">{title}</p>
      <div className="mt-2 font-bauhaus text-base leading-relaxed sm:text-lg">{children}</div>
    </div>
  );
}

function StepImage({ src, alt, from, className = "" }: { src: string; alt: string; from: "left" | "right"; className?: string }) {
  return (
    <div data-step-media data-from={from} className={`relative aspect-[448/305] w-full overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 768px) 450px, 100vw" className="object-cover" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero: tilted wall of newspaper covers (drifts with the cursor) behind a dark card */}
      <section className="relative h-[620px] overflow-hidden bg-paper sm:h-[800px]">
        <HeroCollage covers={COLLAGE} />
        <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-4 sm:px-12">
          <div className="max-w-[600px] rounded-2xl bg-ink px-6 py-9 sm:px-11 sm:py-11">
            <h1 className="font-script text-4xl leading-tight text-paper sm:text-[44px]">Make Headlines That Matter</h1>
            <p className="mt-4 font-bauhaus text-base leading-relaxed text-paper sm:text-lg">
              Celebrate birthdays, weddings, retirements, or just great gossip — your newspaper, your rules. Custom-made
              stories, headlines, and layouts for any occasion that deserves the spotlight.
            </p>
            <Link href="/templates" className="btn-light mt-8 block w-full text-center">
              Let&apos;s get started
            </Link>
          </div>
        </div>
      </section>

      <Masthead section="Front Page">Because every story deserves a front page.</Masthead>

      <Article kicker="The Feature" title="What's in the Paper? You.">
        We turn your moments into newsworthy keepsakes. Whether it&apos;s a birthday roast, a wedding highlight, a
        retirement tribute, or a surprise announcement we help you create a fully personalized newspaper that looks and
        feels like the real deal. You pick the stories, upload photos, choose layouts, and we handle the print magic.
        Delivered straight to your door. Frame it, gift it, laugh over it for years.
      </Article>

      <Masthead section="Section A" subtitle="A keepsake, not just a print">Why us?</Masthead>

      <Article kicker="Quality" title="Crafted to Feel Real">
        We use the finest quality paper and advanced digital machines to create newspapers that look, feel, and age just
        like the real thing. It&apos;s not just a print, it&apos;s a keepsake.
      </Article>

      <Masthead section="Section B" subtitle="Six steps from idea to front page">How to do it</Masthead>

      {/* A line flows down the middle while scrolling; each step appears when it arrives (GSAP, see StepsFlow) */}
      <StepsFlow steps={6}>
        <div className="mx-auto max-w-[1180px] space-y-24 py-20 md:space-y-32 md:py-28">
          {/* Step 1: photo left, text right */}
          <Step>
            <StepImage from="left" src="/home/step1-template.png" alt="Someone holding a Tailored Times fashion newspaper" />
            <div data-step-text>
              <StepHeading n={1} title="Choose your template" />
              <div className="mt-3 grid grid-cols-2 gap-x-5 font-bauhaus text-base lg:grid-cols-3">
                {CATEGORIES.map((col, i) => (
                  <ul key={i}>
                    {col.map((c) => (
                      <li key={c}>– {c}</li>
                    ))}
                  </ul>
                ))}
              </div>
              <Link href="/templates" className="btn-light mt-6">
                Check the templates
              </Link>
            </div>
          </Step>

          {/* Step 2: text left, photo right */}
          <Step>
            <div data-step-text>
              <StepHeading n={2} title="Choose Format" />
              <div className="mt-3 grid gap-5 sm:grid-cols-3">
                <Option title="Digital Copy">A digital copy is a document that exists electronically</Option>
                <Option title="Cover page only">The cover page is the first, printed page that visually represents your content.</Option>
                <Option title="Hard Copy">A hard copy refers to a physical, printed version of the template into a newspaper</Option>
              </div>
            </div>
            <StepImage from="right" src="/home/step2-format.jpg" alt="A folded newspaper on a wooden table" />
          </Step>

          {/* Step 3: photos left, text right */}
          <Step>
            <div className="grid grid-cols-2 gap-4">
              <figure data-step-media data-from="left">
                <figcaption className="mb-2 font-script text-[22px] text-ink-2">Tabloid</figcaption>
                <div className="relative aspect-[278/243] w-full overflow-hidden">
                  <Image src="/home/step3-tabloid.jpg" alt="A stack of tabloid-size newspapers" fill sizes="(min-width: 768px) 250px, 45vw" className="object-cover" />
                </div>
              </figure>
              <figure data-step-media data-from="left">
                <figcaption className="mb-2 font-script text-[22px] text-ink-2">Broadsheet</figcaption>
                <div className="relative aspect-[278/243] w-full overflow-hidden">
                  <Image src="/home/step3-broadsheet.jpg" alt="A stack of broadsheet-size newspapers" fill sizes="(min-width: 768px) 250px, 45vw" className="object-cover" />
                </div>
              </figure>
            </div>
            <div data-step-text>
              <StepHeading n={3} title="Choose your size" />
              <div className="mt-3 grid grid-cols-2 gap-5">
                <Option title="Tabloid">
                  – Size: 33 cm x 24 cm<br />– Paper: 70 gsm<br />– Colors: CMYK<br />– Pages: 1 to 24<br />– Copies: 1 to 500
                </Option>
                <Option title="Broadsheet">
                  – Size: 50 cm x 35.7 cm<br />– Paper: 70 gsm<br />– Colors: CMYK<br />– Pages: 1 to 24<br />– Copies: 1 to 500
                </Option>
              </div>
            </div>
          </Step>

          {/* Step 4: text left, photo right */}
          <Step>
            <div data-step-text>
              <StepHeading n={4} title="Choose frame" />
              <div className="mt-3 grid grid-cols-2 gap-5">
                <Option title="Frame">A thin black frame that allows you to hang your designs</Option>
                <Option title="No frame">Keep your design as an authentic newspaper</Option>
              </div>
            </div>
            <StepImage from="right" src="/home/step4-frame.jpg" alt="Framed newspapers on a wall" />
          </Step>

          {/* Step 5: photo left, text right */}
          <Step>
            <StepImage from="left" src="/home/step5-customize.jpg" alt="Customizing a newspaper layout" />
            <div data-step-text>
              <StepHeading n={5} title="Start customizing" />
              <p className="mt-3 font-bauhaus text-base leading-relaxed sm:text-lg">
                Once you&apos;ve completed the above steps, you&apos;ll fill in your names, stories and headlines and upload
                your photos. Our team takes it from there.
              </p>
            </div>
          </Step>

          {/* Step 6: text left, photo right */}
          <Step>
            <div data-step-text>
              <StepHeading n={6} title="Free delivery" />
              <p className="mt-3 font-bauhaus text-base leading-relaxed sm:text-lg">
                Share your name, number, email and location. You pay cash on delivery.
              </p>
              <Link href="/templates" className="btn-light mt-6">
                Get started
              </Link>
            </div>
            <StepImage from="right" src="/home/step6-delivery.jpg" alt="A newspaper delivered to the door" />
          </Step>
        </div>
      </StepsFlow>

      <Masthead section="Section C" subtitle="Custom designs, made from scratch">What if?</Masthead>

      <Article kicker="Custom Work" title="If you're looking for a customised job, we are here for you">
        In addition to our existing templates, we also offer fully customized templates built from scratch. We&apos;ll
        arrange a meeting with our designer, who will guide you through the creation process step by step. This service
        is available for an additional fee.
      </Article>

      <Testimonials />
    </>
  );
}
