"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/actions";

// Contact form, styled like the order form: small-caps labels, plain white
// fields, a full-width dark button. Sends through the sendContactMessage
// server action (honeypot + validation there).

const input =
  "w-full rounded-sm border border-ink/25 bg-white px-3 py-2.5 font-roboto text-sm text-ink placeholder:text-ink/40 focus:border-ink-2 focus:outline-none focus:ring-2 focus:ring-ink-2/15";
const label = "mb-2 block font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/80";

export function ContactForm() {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await sendContactMessage(formData);
      setStatus(result.ok ? { ok: true, text: "" } : { ok: false, text: result.error });
    });
  }

  if (status?.ok) {
    return (
      <div className="py-10 text-center" role="status">
        <p className="font-news text-3xl font-bold italic text-ink">&ldquo;Message received&rdquo;</p>
        <div className="mx-auto mt-3 h-px w-16 bg-ink/50" aria-hidden />
        <p className="mt-4 font-bauhaus text-base text-ink/80">Thank you for writing to us. We&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="first_name">First name *</label>
          <input id="first_name" name="first_name" required autoComplete="given-name" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="last_name">Last name *</label>
          <input id="last_name" name="last_name" required autoComplete="family-name" className={input} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="email">Email *</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="subject">Subject *</label>
        <input id="subject" name="subject" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="message">Message *</label>
        <textarea id="message" name="message" required rows={6} className={input} />
      </div>

      {status && !status.ok && (
        <p role="alert" className="rounded-sm border border-red-700 bg-red-50 p-3 font-roboto text-sm text-red-800">
          {status.text}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-dark w-full !py-3 font-medium">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
