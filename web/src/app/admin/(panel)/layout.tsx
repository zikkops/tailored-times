import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "../actions";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Templates & prices" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="font-serif text-lg font-bold">Tailored Times admin</Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:underline">{n.label}</Link>)}
            <Link href="/" className="text-paper-2 hover:underline">View site</Link>
          </nav>
          <form action={signOut} className="flex items-center gap-3 text-sm">
            <span className="text-paper-2">{admin.email}</span>
            <button className="underline">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
