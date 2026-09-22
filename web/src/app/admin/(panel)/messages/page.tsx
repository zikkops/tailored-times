import { setMessageHandled } from "../../actions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: messages, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("handled")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <h1 className="font-serif text-3xl font-bold">Messages</h1>
      {error && <p className="mt-6 text-sm text-red-800">Couldn&apos;t load messages: {error.message}</p>}
      <ul className="mt-6 space-y-4">
        {messages?.map((m) => (
          <li key={m.id} className={`border p-4 ${m.handled ? "border-line/60 opacity-60" : "border-ink"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{m.subject}</p>
                <p className="text-sm text-muted">
                  {m.name} ·{" "}
                  <a href={`mailto:${m.email}`} className="underline">
                    {m.email}
                  </a>{" "}
                  · {new Date(m.created_at).toLocaleString("en-GB")}
                </p>
              </div>
              <form action={setMessageHandled}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="handled" value={String(!m.handled)} />
                <button className="border border-ink px-3 py-1 text-sm">{m.handled ? "Mark as new" : "Mark handled"}</button>
              </form>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
          </li>
        ))}
      </ul>
      {!error && !messages?.length && <p className="py-10 text-center text-muted">No messages yet.</p>}
    </>
  );
}
