import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Tailored Times collects when you order a personalised newspaper, how your photos and messages are used, and how long we keep them.",
};

export default function PrivacyPage() {
  return <LegalPage slug="privacy" eyebrow="Privacy" />;
}
