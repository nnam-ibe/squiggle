import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";

/* Temporary design-system preview (CLOUD-33). The real homepage is CLOUD-27. */
const swatches = [
  ["bg", "--bg"],
  ["panel", "--panel"],
  ["panel2", "--panel2"],
  ["accent", "--accent"],
  ["fg", "--fg"],
  ["fg2", "--fg2"],
  ["fg3", "--fg3"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-[680px] px-[18px] py-[22px]">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <span className="flex text-accent">
            <Icon name="squiggle" size={30} />
          </span>
          <span className="font-head text-[21px] font-extrabold tracking-[-0.02em]">Squiggle</span>
        </div>
        <ThemeToggle />
      </div>

      <h1 className="mb-3 text-[clamp(34px,9vw,52px)] leading-[0.98]">Chart the climb.</h1>
      <p className="mb-8 max-w-[42ch] text-[15.5px] leading-[1.5] text-fg2">
        Design system foundation — tokens, fonts, and dark/light theme. Toggle the theme to see
        the tokens swap.
      </p>

      <div className="mb-6 flex flex-wrap gap-[10px]">
        {swatches.map(([name, varName]) => (
          <div
            key={name}
            className="flex min-w-[96px] flex-1 flex-col gap-[7px] rounded-card border-[1.5px] border-line bg-panel p-[13px]"
          >
            <span
              className="h-8 w-full rounded-field border border-line"
              style={{ background: `var(${varName})` }}
            />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg3">
              {name}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-panel border-[1.5px] border-line bg-panel p-5">
        <p className="font-head text-[24px] font-bold tracking-[-0.01em]">Archivo heading</p>
        <p className="mt-1 text-[14px] text-fg2">Archivo body text in the secondary foreground.</p>
        <p className="mt-2 font-mono text-[13px] text-fg3">Spline Sans Mono · 01 · POS · PTS</p>
      </div>
    </main>
  );
}
