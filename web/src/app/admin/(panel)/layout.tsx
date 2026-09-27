import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_DEMO } from "@/lib/env";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Templates & prices" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#f6f5f3] font-roboto text-ink">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-baseline gap-6">
            <Link href="/admin" className="font-script text-xl">
              Tailored Times
            </Link>
            <nav className="flex flex-wrap gap-5 text-[13px] uppercase tracking-[0.15em]">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-paper/75 transition-colors hover:text-paper">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-paper/70 hover:text-paper">
              View site ↗
            </Link>
            <span className="hidden text-paper/50 sm:inline">{admin.email}</span>
            <form action={signOut}>
              <button className="rounded-sm border border-paper/40 px-3 py-1.5 text-paper/90 transition-colors hover:bg-paper hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {ADMIN_DEMO && (
        <p className="bg-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-950">
          Demo mode: sample orders and messages. Nothing is saved, and no login is required.
        </p>
      )}

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
