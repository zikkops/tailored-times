const SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/tailored.times",
    path: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61579839105672",
    path: "M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@tailored.times",
    path: "M17.5 0h-4v16.3a3.5 3.5 0 1 1-3.5-3.5c.3 0 .7 0 1 .1V8.8a7.5 7.5 0 1 0 6.5 7.5V8a9.2 9.2 0 0 0 5.4 1.7v-4A5.4 5.4 0 0 1 17.5 0z",
  },
];

export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <div className={`-ml-2.5 flex items-center gap-1 ${className}`}>
      {SOCIALS.map((s) => (
        <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center text-ink hover:opacity-70">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
            <path d={s.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
