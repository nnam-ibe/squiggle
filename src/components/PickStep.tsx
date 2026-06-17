import { Icon, type IconName } from "@/components/Icon";

/** "No data" meta color (design `#e0894a`). */
export const ND = "#e0894a";

export interface PickOption {
  id: string;
  name: string;
  icon?: IconName;
  meta?: string | null;
  metaND?: boolean;
}

/**
 * One numbered "cascading cards" picker group (Sport / League / Season). Shared by
 * the homepage selectors and the upload wizard's step 1.
 */
export function PickStep({
  n,
  label,
  options,
  value,
  onPick,
}: {
  n: number;
  label: string;
  options: PickOption[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-[11px] flex items-center gap-[9px]">
        <span className="flex size-[21px] items-center justify-center rounded-[7px] border border-line bg-panel2 font-mono text-[11px] font-bold text-fg2">
          {n}
        </span>
        <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.14em] text-fg3">
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-[10px]">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              aria-pressed={on}
              className={`flex min-w-[96px] flex-1 flex-col items-start gap-[7px] rounded-card border-[1.5px] p-[13px_14px] text-left transition-[border-color,transform,background] hover:-translate-y-px ${
                on
                  ? "border-accent bg-[color-mix(in_oklab,var(--accent)_9%,var(--panel))]"
                  : "border-line bg-panel hover:border-line2"
              }`}
            >
              {o.icon && (
                <span className={on ? "text-accent" : "text-fg2"}>
                  <Icon name={o.icon} size={20} />
                </span>
              )}
              <span className="font-head text-[15px] font-bold tracking-[-0.01em]">{o.name}</span>
              {o.meta && (
                <span
                  className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg3"
                  style={o.metaND ? { color: ND } : undefined}
                >
                  {o.meta}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
