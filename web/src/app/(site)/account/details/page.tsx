import type { Metadata } from "next";
import { DetailsForm } from "./DetailsForm";
import { requireCustomer } from "@/lib/account";

export const metadata: Metadata = { title: "My details" };

export default async function MyDetailsPage() {
  const customer = await requireCustomer();

  return (
    <>
      <h1 className="font-script text-[34px] leading-tight text-ink-2">My details</h1>
      <div className="mt-2 h-[5px] border-y border-ink/60" aria-hidden />
      <p className="mt-4 font-bauhaus text-base text-ink/80">
        We use these to fill in your next order, and to reach you about one in progress.
      </p>

      <DetailsForm profile={customer.profile} email={customer.email} />
    </>
  );
}
