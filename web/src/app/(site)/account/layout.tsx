import Link from "next/link";
import { signOutCustomer } from "./actions";
import { getCustomer } from "@/lib/account";

// Signed-in customers get a small side menu; the sign-in page has none.
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const customer = await getCustomer();
  if (!customer) return <>{children}</>;

  const link = "block py-2 font-bauhaus text-[15px] text-ink hover:opacity-70";

  return (
    <div className="mx-auto grid max-w-[1140px] gap-10 px-4 py-10 md:grid-cols-[220px_1fr]">
      <aside className="md:border-r md:border-ink/10 md:pr-6">
        <p className="font-roboto text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/50">Your account</p>
        <p className="mt-1 break-all font-bauhaus text-sm text-ink/80">{customer.email}</p>
        <nav className="mt-4">
          <Link href="/account" className={link}>
            My orders
          </Link>
          <Link href="/account/details" className={link}>
            My details
          </Link>
          <Link href="/templates" className={link}>
            Order again
          </Link>
        </nav>
        <form action={signOutCustomer} className="mt-4 border-t border-ink/10 pt-4">
          <button className="font-roboto text-xs uppercase tracking-[0.2em] text-ink/60 underline underline-offset-4">
            Sign out
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
