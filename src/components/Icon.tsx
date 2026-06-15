/** Minimal icon set ported from the design (design/project/Squiggle/screens.jsx).
    Grows as later UI tickets need more icons. */
export type IconName = "squiggle" | "sun" | "moon";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  switch (name) {
    case "squiggle":
      return (
        <svg width={size} height={(size * 24) / 32} viewBox="0 0 32 24" fill="none" aria-hidden>
          <path
            d="M2 18C5 18 5 6 9 6s4 12 8 12 4-14 8-14 3 8 5 8"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        </svg>
      );
    case "sun":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx={12} cy={12} r={4} stroke="currentColor" strokeWidth={2} />
          <path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </svg>
      );
    case "moon":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M20 14.5A8 8 0 019.5 4a7 7 0 102 13.9 8 8 0 008.5-3.4z" fill="currentColor" />
        </svg>
      );
  }
}
