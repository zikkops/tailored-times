import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that cover ordering a personalised newspaper from Tailored Times: what you send us, proofs, printing, delivery and cancellations.",
};

export default function TermsPage() {
  return <LegalPage slug="terms" eyebrow="Terms" />;
}
