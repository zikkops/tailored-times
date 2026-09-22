"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrder } from "@/app/actions";
import type { FormField } from "@/lib/data";
import { calculatePrice, FORMATS, SIZES, type Format, type PricingConfig, type Size } from "@/lib/pricing";

// Three-step order form in the site's newspaper style: an off-white "order
// form" card, a progress line, tappable option buttons instead of drop-downs,
// and a receipt-style total. The browser price is for display only; the
// server recalculates it (createOrder).

type Props = {
  template: { slug: string; name: string; formSchema: FormField[] };
  pricing: PricingConfig;
};

// Help texts from the live calculator's "?" tooltips.
const HELP = {
  format:
    "A hard copy is a physical, printed newspaper. A digital copy is a document that exists electronically. A cover page is a single printed front page, ideal for framing.",
  size: "Tabloid is 33 cm × 24 cm. Broadsheet is 50 cm × 35.7 cm.",
  pages:
    "Four pages are the standard pages we created for each template. One page is a cover page, best for framing. Eight and above are new pages; our designer will contact you about them.",
  copies: "How many copies of the same newspaper you want (1 to 500).",
  frames: "A black wooden frame that surrounds the newspaper so you can hang it.",
  designer:
    "Ask for a designer to create a new template from scratch or add pages beyond the 4 standard ones. Changing the text and photos in our templates does not need a designer.",
};

const FORMAT_LABELS: Record<Format, string> = { "Hard copy": "Hard copy", "Digital copy": "Digital", "Cover page": "Cover page" };
const STEPS = ["Your paper", "Your story", "Delivery"] as const;

const input =
  "w-full rounded-sm border border-ink/25 bg-white px-3 py-2.5 font-roboto text-sm text-ink placeholder:text-ink/40 focus:border-ink-2 focus:outline-none focus:ring-2 focus:ring-ink-2/15";

function Label({ htmlFor, children, help }: { htmlFor?: string; children: React.ReactNode; help?: string }) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <div className="mb-2 flex items-center gap-2">
      <Tag htmlFor={htmlFor} className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80">
        {children}
      </Tag>
      {help && (
        <span className="group relative">
          <span
            tabIndex={0}
            aria-label={help}
            className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-ink/40 font-roboto text-[10px] font-semibold text-ink/70 hover:border-ink hover:text-ink"
          >
            ?
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden w-64 -translate-x-1/2 rounded bg-ink-2 p-3 font-roboto text-xs normal-case leading-relaxed tracking-normal text-white shadow-lg group-hover:block group-focus-within:block"
          >
            {help}
          </span>
        </span>
      )}
    </div>
  );
}

// A row of option buttons (a radio group) that replaces a drop-down.
function Options<T extends string | number>({
  label,
  value,
  options,
  onChange,
  display = String,
  disabled = false,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} aria-disabled={disabled} className={`flex flex-wrap gap-2 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o)}
            className={`min-w-12 rounded-sm border px-3.5 py-2 font-roboto text-sm transition-colors ${
              on ? "border-ink-2 bg-ink-2 text-white" : "border-ink/25 bg-white text-ink hover:border-ink"
            }`}
          >
            {display(o)}
          </button>
        );
      })}
    </div>
  );
}

export function OrderForm({ template, pricing }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [format, setFormat] = useState<Format>("Hard copy");
  const [size, setSize] = useState<Size>("Tabloid");
  const [pages, setPages] = useState(4);
  const [copies, setCopies] = useState(1);
  const [frames, setFrames] = useState<"No" | "Yes">("No");
  const [designer, setDesigner] = useState<"No" | "Yes">("No");

  const isDigital = format === "Digital copy";
  const isCover = format === "Cover page";
  const setCopiesSafe = (n: number) => setCopies(Math.max(1, Math.min(500, Math.floor(n) || 1)));

  // What is actually ordered, after the format rules (also what the server gets).
  const order = {
    format,
    size,
    pages: isCover ? 1 : pages,
    copies: isDigital ? 1 : copies,
    frames: !isDigital && frames === "Yes",
    designer: designer === "Yes",
  };
  const price = calculatePrice(order, pricing);

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createOrder(formData);
      if (result.ok) router.push(`/order/success?ref=${encodeURIComponent(result.reference ?? "")}`);
      else setError(result.error);
    });
  }

  function next(e: React.MouseEvent<HTMLButtonElement>) {
    // Validate only the fields on the visible step before moving on.
    const section = e.currentTarget.closest("fieldset");
    const fields = section?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input:not([type=hidden]), textarea") ?? [];
    for (const f of fields) if (!f.reportValidity()) return;
    setStep((s) => s + 1);
  }

  return (
    <form action={submit} className="mt-8 bg-[#f7f3ea] px-5 pb-7 pt-5 shadow-[0_4px_24px_rgba(13,12,29,0.12)] sm:px-8">
      <input type="hidden" name="template" value={template.slug} />
      {/* The paper choices, sent from state (option buttons aren't form fields) */}
      <input type="hidden" name="format" value={order.format} />
      <input type="hidden" name="size" value={order.size} />
      <input type="hidden" name="pages" value={order.pages} />
      <input type="hidden" name="copies" value={order.copies} />
      <input type="hidden" name="frames" value={order.frames ? "yes" : "no"} />
      <input type="hidden" name="designer" value={order.designer ? "yes" : "no"} />
      {/* Honeypot: people never see or fill this. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* Card header, like a clipped order form */}
      <div className="flex items-baseline justify-between font-roboto text-[10px] font-medium uppercase tracking-[0.25em] text-ink/70 sm:text-[11px]">
        <span>Order form</span>
        <span>Price calculator</span>
      </div>
      <div className="mt-2 h-[5px] border-y border-ink/60" aria-hidden />

      {/* Progress: numbered steps on a line that fills as you go */}
      <ol className="relative mt-6 mb-8 grid grid-cols-3">
        <span aria-hidden className="absolute left-[16.66%] right-[16.66%] top-3.5 h-px bg-ink/20" />
        <span
          aria-hidden
          className="absolute left-[16.66%] top-3.5 h-px bg-ink-2 transition-all duration-500"
          style={{ width: `${(step / (STEPS.length - 1)) * 66.66}%` }}
        />
        {STEPS.map((s, i) => (
          <li key={s} className="relative flex flex-col items-center gap-1.5" aria-current={i === step ? "step" : undefined}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border font-roboto text-xs font-semibold transition-colors ${
                i <= step ? "border-ink-2 bg-ink-2 text-white" : "border-ink/30 bg-[#f7f3ea] text-ink/60"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={`font-roboto text-[11px] uppercase tracking-[0.15em] ${i === step ? "font-semibold text-ink" : "text-ink/55"}`}>{s}</span>
          </li>
        ))}
      </ol>

      {/* Step 1: price calculator */}
      <fieldset className={step === 0 ? "space-y-6" : "hidden"}>
        <legend className="sr-only">Your paper</legend>

        <div>
          <Label help={HELP.format}>Format</Label>
          <Options label="Format" value={format} options={FORMATS} onChange={setFormat} display={(f) => FORMAT_LABELS[f]} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label help={HELP.size}>Size</Label>
            <Options label="Size" value={size} options={SIZES} onChange={setSize} disabled={isDigital} />
          </div>
          <div>
            <Label htmlFor="copies" help={HELP.copies}>Copies</Label>
            <div className={`flex w-fit items-stretch ${isDigital ? "pointer-events-none opacity-40" : ""}`}>
              <button type="button" aria-label="One copy fewer" onClick={() => setCopiesSafe(copies - 1)} className="w-10 rounded-l-sm border border-ink/25 bg-white text-lg text-ink hover:border-ink">
                −
              </button>
              <input
                id="copies"
                type="number"
                min={1}
                max={500}
                value={order.copies}
                disabled={isDigital}
                onChange={(e) => setCopiesSafe(Number(e.target.value))}
                className="w-16 border-y border-ink/25 bg-white py-2 text-center font-roboto text-sm text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button type="button" aria-label="One copy more" onClick={() => setCopiesSafe(copies + 1)} className="w-10 rounded-r-sm border border-ink/25 bg-white text-lg text-ink hover:border-ink">
                +
              </button>
            </div>
          </div>
        </div>

        <div>
          <Label help={HELP.pages}>Pages</Label>
          <Options label="Pages" value={order.pages} options={pricing.pageOptions} onChange={setPages} disabled={isCover || isDigital} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label help={HELP.frames}>Frame</Label>
            <Options label="Frame" value={isDigital ? "No" : frames} options={["No", "Yes"] as const} onChange={setFrames} disabled={isDigital} />
          </div>
          <div>
            <Label help={HELP.designer}>Designer needed</Label>
            <Options label="Designer needed" value={designer} options={["No", "Yes"] as const} onChange={setDesigner} />
          </div>
        </div>

        {/* Receipt-style total */}
        <div className="border-t border-dashed border-ink/40 pt-5">
          <div className="flex items-baseline gap-3">
            <span className="font-roboto text-xs font-semibold uppercase tracking-[0.2em] text-ink/80">Total</span>
            <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-ink/40" />
            <span className="font-news text-3xl font-bold text-ink" aria-live="polite">
              {price.toFixed(1)} <span className="font-roboto text-sm font-medium">USD</span>
            </span>
          </div>
          <p className="mt-1 text-right font-roboto text-xs text-muted">Cash on delivery · Free delivery</p>
        </div>

        <button type="button" onClick={next} className="btn-dark w-full !py-3 font-medium">
          Next: your story →
        </button>
      </fieldset>

      {/* Step 2: the customer's content */}
      <fieldset className={step === 1 ? "space-y-5" : "hidden"}>
        <legend className="mb-2 font-news text-2xl font-bold text-ink">Tell us your story</legend>
        {template.formSchema.map((f) => (
          <div key={f.key}>
            <Label htmlFor={`f_${f.key}`}>
              {f.label}
              {f.required && " *"}
            </Label>
            {f.help && <p className="-mt-1 mb-2 font-roboto text-xs text-muted">{f.help}</p>}
            {f.type === "textarea" ? (
              <textarea id={`f_${f.key}`} name={`answer_${f.key}`} required={f.required} rows={6} className={input} />
            ) : f.type === "file" ? (
              <input
                id={`f_${f.key}`}
                name="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="block w-full font-roboto text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-ink-2 file:px-4 file:py-2 file:text-sm file:text-white"
              />
            ) : (
              <input id={`f_${f.key}`} name={`answer_${f.key}`} type={f.type} required={f.required} className={input} />
            )}
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setStep(0)} className="btn-light">
            ← Back
          </button>
          <button type="button" onClick={next} className="btn-dark flex-1 font-medium">
            Next: delivery →
          </button>
        </div>
      </fieldset>

      {/* Step 3: delivery and review */}
      <fieldset className={step === 2 ? "space-y-5" : "hidden"}>
        <legend className="mb-2 font-news text-2xl font-bold text-ink">Delivery details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="customer_name">Full name *</Label>
            <input id="customer_name" name="customer_name" required autoComplete="name" className={input} />
          </div>
          <div>
            <Label htmlFor="customer_phone">Phone number *</Label>
            <input id="customer_phone" name="customer_phone" type="tel" required autoComplete="tel" className={input} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="customer_email">Email</Label>
            <input id="customer_email" name="customer_email" type="email" autoComplete="email" className={input} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="delivery_address">Delivery address *</Label>
            <textarea id="delivery_address" name="delivery_address" required rows={3} autoComplete="street-address" className={input} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Anything else we should know?</Label>
            <textarea id="notes" name="notes" rows={3} className={input} />
          </div>
        </div>

        {/* Order summary, receipt style */}
        <div className="border border-dashed border-ink/40 bg-white/60 p-4 font-roboto text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80">Your order</p>
          <p className="mt-2 text-ink">
            {template.name} · {FORMAT_LABELS[format]}
            {!isDigital && ` · ${size}`}
            {!isCover && !isDigital && ` · ${pages} pages`}
            {!isDigital && ` · ${copies} ${copies === 1 ? "copy" : "copies"}`}
            {order.frames && " · framed"}
            {order.designer && " · designer"}
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/80">Total</span>
            <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-ink/40" />
            <span className="font-news text-2xl font-bold text-ink">{price.toFixed(1)} USD</span>
          </div>
          <p className="mt-1 text-right text-xs text-muted">Cash on delivery · Free delivery</p>
        </div>

        {error && (
          <p role="alert" className="rounded-sm border border-red-700 bg-red-50 p-3 font-roboto text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setStep(1)} className="btn-light">
            ← Back
          </button>
          <button type="submit" disabled={pending} className="btn-dark flex-1 font-medium">
            {pending ? "Sending…" : "Place order"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
