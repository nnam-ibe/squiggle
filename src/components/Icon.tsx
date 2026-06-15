/** Minimal icon set ported from the design (design/project/Squiggle/screens.jsx).
    Grows as later UI tickets need more icons. */
export type IconName = "squiggle" | "sun" | "moon" | "soccer" | "f1" | "back" | "chev";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  switch (name) {
    case "soccer":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.8} />
          <path d="M12 7.5l3.2 2.4-1.2 3.8h-4L8.8 9.9 12 7.5z" fill="currentColor" />
          <path
            d="M12 3.2v4.3M5 9.6l3.6.4M19 9.6l-3.6.4M7.4 19l1.6-3.4M16.6 19L15 15.6"
            stroke="currentColor"
            strokeWidth={1.4}
          />
        </svg>
      );
    case "f1": {
      const cells = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          if ((r + c) % 2 === 0)
            cells.push(
              <rect key={`${r}${c}`} x={4 + c * 5.3} y={4 + r * 5.3} width={5.3} height={5.3} fill="currentColor" />,
            );
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <rect x={3.4} y={3.4} width={17.2} height={17.2} rx={3} fill="none" stroke="currentColor" strokeWidth={1.6} />
          {cells}
        </svg>
      );
    }
    case "back":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chev":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
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
