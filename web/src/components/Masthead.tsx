// Section banner styled like the top of a newspaper front page: a small-caps
// section line, a double rule, the script title, a hairline and a subtitle,
// on the dark pattern band.

type Props = {
  section?: string; // e.g. "Section B" → "THE TAILORED TIMES · SECTION B"
  subtitle?: string;
  children: React.ReactNode; // the title
  className?: string;
};

export function Masthead({ section, subtitle, children, className = "" }: Props) {
  return (
    <div className={`band px-4 py-10 text-center sm:py-12 ${className}`}>
      <div className="mx-auto max-w-[760px]">
        <p className="font-roboto text-[11px] font-medium uppercase tracking-[0.3em] text-paper/70 sm:text-xs">
          The Tailored Times{section && <> · {section}</>}
        </p>
        {/* Double rule, like under a newspaper masthead */}
        <div className="mt-3 h-[6px] border-y border-paper/60" aria-hidden />
        <h2 className="py-3 font-script text-[34px] leading-tight text-paper sm:py-4 sm:text-[52px]">{children}</h2>
        <div className="h-px bg-paper/40" aria-hidden />
        {subtitle && <p className="mt-3 font-bauhaus text-sm text-paper/80 sm:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
