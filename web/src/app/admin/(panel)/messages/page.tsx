import { setMessageHandled } from "../../actions";
import { listMessages } from "@/lib/admin-data";
import { ADMIN_DEMO } from "@/lib/env";

// Contact form messages, unhandled first.

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminMessagesPage() {
  const { messages, error } = await listMessages();
  const open = messages.filter((m) => !m.handled).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-news text-3xl font-bold">Messages</h1>
        <p className="text-sm text-ink/60">
          {open} waiting · {messages.length} in total
        </p>
      </div>

      {error && <p className="mt-6 text-sm text-red-800">Couldn&apos;t load messages: {error}</p>}

      <ul className="mt-6 space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-md border bg-white p-5 ${m.handled ? "border-ink/10 opacity-70" : "border-ink/25 shadow-[0_1px_6px_rgba(13,12,29,0.06)]"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {!m.handled && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />}
                  {m.subject}
                </p>
                <p className="mt-0.5 text-sm text-ink/60">
                  {m.name} ·{" "}
                  <a href={`mailto:${m.email}`} className="underline underline-offset-4">
                    {m.email}
                  </a>{" "}
                  · {when(m.created_at)}
                </p>
              </div>
              <form action={setMessageHandled}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="handled" value={String(!m.handled)} />
                <button className="rounded-sm border border-ink/25 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink hover:text-paper">
                  {m.handled ? "Mark as new" : "Mark handled"}
                </button>
              </form>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-ink/80">{m.message}</p>
            <a
              href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
              className="mt-3 inline-block text-xs font-medium uppercase tracking-[0.15em] underline underline-offset-4"
            >
              Reply by email →
            </a>
          </li>
        ))}
      </ul>

      {!error && !messages.length && <p className="py-12 text-center text-sm text-ink/50">No messages yet.</p>}
      {ADMIN_DEMO && <p className="mt-4 text-center text-xs text-ink/50">Demo mode: marking a message does nothing.</p>}
    </>
  );
}
