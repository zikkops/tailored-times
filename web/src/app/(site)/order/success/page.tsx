import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Order received" };

export default async function OrderSuccessPage(props: PageProps<"/order/success">) {
  const { ref } = await props.searchParams;
  const reference = typeof ref === "string" ? ref.replace(/[^A-Z0-9-]/g, "") : "";
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl font-bold">Stop the presses — we got your order!</h1>
      {reference && (
        <p className="mt-6 text-lg">
          Your order number is <span className="font-mono font-bold">{reference}</span>.
        </p>
      )}
      <p className="mt-4 text-muted">
        Our team will contact you to go over the details. You pay cash on delivery, and delivery is free.
      </p>
      <Link href="/" className="mt-8 inline-block bg-ink px-6 py-3 font-semibold text-paper hover:bg-ink-2">
        Back to home
      </Link>
    </div>
  );
}
