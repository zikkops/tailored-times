import type { OrderStatus } from "@/lib/orders";

// One look per order status, used in the list and on the order page.
const STYLES: Record<OrderStatus, string> = {
  ordered: "bg-amber-100 text-amber-900 ring-amber-300",
  created: "bg-sky-100 text-sky-900 ring-sky-300",
  printing: "bg-violet-100 text-violet-900 ring-violet-300",
  delivering: "bg-orange-100 text-orange-900 ring-orange-300",
  delivered: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  cancelled: "bg-gray-200 text-gray-600 ring-gray-300",
};

export function StatusBadge({ status, big = false }: { status: string; big?: boolean }) {
  const style = STYLES[status as OrderStatus] ?? "bg-gray-100 text-gray-700 ring-gray-300";
  return (
    <span
      className={`inline-block rounded-full font-medium uppercase tracking-[0.12em] ring-1 ring-inset ${style} ${
        big ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      {status}
    </span>
  );
}
