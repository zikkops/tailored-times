import Image from "next/image";
import Link from "next/link";
import { SocialIcons } from "./SocialIcons";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-paper">
      <div className="mx-auto grid max-w-[1140px] gap-10 px-4 py-14 sm:grid-cols-3">
        <div>
          <Image src="/brand/logo.png" alt="Tailored Times" width={135} height={128} />
        </div>
        <div>
          <h2 className="font-roboto text-[26px] font-semibold text-ink-2">Links</h2>
          <ul className="mt-4 space-y-3 font-script text-sm text-ink">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/templates" className="hover:underline">Templates</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-roboto text-[26px] font-semibold text-ink-2">Info</h2>
          <ul className="mt-4 space-y-3 font-script text-sm text-ink">
            <li><a href="mailto:contact@tailored-times.com" className="hover:underline">Email: contact@tailored-times.com</a></li>
            <li><a href="tel:+96181587957" className="hover:underline">Num: +961 81 587 957</a></li>
          </ul>
          <SocialIcons className="mt-6 pl-2" />
        </div>
      </div>
    </footer>
  );
}
