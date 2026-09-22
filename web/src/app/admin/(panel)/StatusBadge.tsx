const COLORS: Record<string, string> = {
  ordered: "bg-amber-100 text-amber-900",
  created: "bg-sky-100 text-sky-900",
  printing: "bg-violet-100 text-violet-900",
  delivering: "bg-orange-100 text-orange-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-gray-200 text-gray-700",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize ${COLORS[status] ?? ""}`}>{status}</span>;
}
