"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/actions";

const input = "w-full rounded-md border border-line bg-white px-3 py-2 font-roboto text-sm focus:outline-2 focus:outline-ink-2";
const label = "mb-1 block font-roboto text-sm text-ink/80";
const req = <span className="text-red-600"> *</span>;

export function ContactForm() {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await sendContactMessage(formData);
      setStatus(result.ok ? { ok: true, text: "Thank you! We'll get back to you soon." } : { ok: false, text: result.error });
    });
  }

  if (status?.ok) return <p className="font-roboto text-lg">{status.text}</p>;

  return (
    <form action={submit} className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <fieldset>
        <legend className={label}>Name{req}</legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input id="first_name" name="first_name" required autoComplete="given-name" aria-label="First name" className={input} />
            <label htmlFor="first_name" className="mt-0.5 block font-roboto text-[11px] text-muted">First</label>
          </div>
          <div>
            <input id="last_name" name="last_name" required autoComplete="family-name" aria-label="Last name" className={input} />
            <label htmlFor="last_name" className="mt-0.5 block font-roboto text-[11px] text-muted">Last</label>
          </div>
        </div>
      </fieldset>
      <div>
        <label className={label} htmlFor="email">Email{req}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="subject">Subject{req}</label>
        <input id="subject" name="subject" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="message">Message{req}</label>
        <textarea id="message" name="message" required rows={5} className={input} />
      </div>
      {status && !status.ok && <p role="alert" className="font-roboto text-sm text-red-800">{status.text}</p>}
      <button type="submit" disabled={pending} className="btn-dark rounded-md">
        {pending ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
