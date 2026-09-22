import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact us" };

// Same layout as the live contact page: a grey rounded card with the form on the left half.
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1140px] px-4 py-6">
      <div className="rounded-3xl bg-paper px-6 py-8 sm:px-8">
        <h1 className="font-roboto text-[28px] font-semibold text-ink">Contact us</h1>
        <div className="mt-4 max-w-[515px]">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
