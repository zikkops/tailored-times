import type { Metadata } from "next";
import { Old_Standard_TT, Roboto } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// The live site's fonts (21 Sep 2026): Blenda Script for headings, Bauhaus for
// menu and body copy, Roboto for buttons and small UI text. Blenda and Bauhaus
// are commercial fonts copied from the WordPress uploads; the web licence must
// cover this site before launch (UPGRADE.md).
const blenda = localFont({ src: "../fonts/Blenda-Script.ttf", variable: "--font-blenda", display: "swap" });
const bauhaus = localFont({ src: "../fonts/BauhausRegular.ttf", variable: "--font-bauhaus-face", display: "swap" });
// Newspaper serif for clipping-style pieces (testimonials).
const news = Old_Standard_TT({ variable: "--font-news-face", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "Tailored Times — Make Headlines That Matter", template: "%s · Tailored Times" },
  description:
    "Custom-made newspapers for birthdays, weddings, retirements and every occasion that deserves a front page.",
  icons: { icon: "/brand/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${blenda.variable} ${bauhaus.variable} ${roboto.variable} ${news.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-roboto">{children}</body>
    </html>
  );
}
