import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLeague } from "@/config/leagues";
import { getDatasetStandings } from "@/server/datasets";

export const dynamic = "force-dynamic"; // reads the DB at request time

const SPORT_ICON: Record<string, IconName> = { soccer: "soccer", motorsport: "f1" };

function prettySeason(season: string) {
  return season.replace("-", "/");
}

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ sport: string; league: string; season: string }>;
}) {
  const { sport, league, season } = await params;
  const data = await getDatasetStandings({ sport, league, season });
  const leagueName = getLeague(league)?.name ?? league;

  if (!data) {
    return <NotFound leagueName={leagueName} season={season} />;
  }

  const sportIcon = SPORT_ICON[data.sport] ?? "soccer";
  const final = data.standings.rounds.at(-1)?.standings ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] px-4 py-[13px] backdrop-blur-[14px]">
        <Link
          href="/"
          aria-label="Back"
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-field border-[1.5px] border-line bg-panel text-fg2 transition-colors hover:border-line2 hover:text-fg"
        >
          <Icon name="back" size={20} />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-[11px]">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-line bg-panel2 text-accent">
            <Icon name={sportIcon} size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-[9px] font-head text-[18px] font-extrabold leading-[1.05] tracking-[-0.015em]">
              {leagueName}
              <span className="rounded-md bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] px-[7px] py-[2px] font-mono text-[12px] font-semibold text-accent">
                {prettySeason(season)}
              </span>
            </div>
            <div className="mt-[2px] truncate text-[12px] text-fg2">
              Position after each matchweek{data.isComplete ? "" : " · in progress"}
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 px-3 py-4 sm:px-[18px]">
        {/* Chart zone — BumpChart lands here in CLOUD-17. For now, the final table. */}
        <div className="overflow-hidden rounded-panel border border-line bg-panel">
          <table className="w-full text-left text-[13px]">
            <thead className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg3">
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-right font-medium">#</th>
                <th className="px-3 py-2 font-medium">Team</th>
                {["Pld", "W", "D", "L", "GD", "Pts"].map((h) => (
                  <th key={h} className="px-2 py-2 text-right font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono [font-variant-numeric:tabular-nums]">
              {final.map((s) => (
                <tr key={s.entity} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-right text-fg3">{s.position}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-[9px]">
                      <span
                        className="h-[10px] w-[10px] flex-none rounded-full"
                        style={{ background: data.colors[s.entity] ?? "var(--fg3)" }}
                      />
                      <span className="font-head text-[13px] font-bold text-fg">{s.entity}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right text-fg2">{s.stats.played}</td>
                  <td className="px-2 py-2 text-right text-fg2">{s.stats.won}</td>
                  <td className="px-2 py-2 text-right text-fg2">{s.stats.drawn}</td>
                  <td className="px-2 py-2 text-right text-fg2">{s.stats.lost}</td>
                  <td className="px-2 py-2 text-right text-fg2">
                    {s.stats.gd >= 0 ? `+${s.stats.gd}` : s.stats.gd}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-fg">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NotFound({ leagueName, season }: { leagueName: string; season: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center gap-3 px-[18px] text-center">
      <div className="text-accent">
        <Icon name="squiggle" size={40} />
      </div>
      <h1 className="font-head text-[20px] font-extrabold tracking-[-0.01em]">
        No chart for {leagueName} · {prettySeason(season)} yet
      </h1>
      <p className="max-w-[40ch] text-[13.5px] leading-[1.55] text-fg2">
        We don&apos;t have round-by-round standings for this season. Upload your own to squiggle it.
      </p>
      <Link
        href="/"
        className="mt-2 flex items-center gap-2 rounded-field bg-accent px-[22px] py-[13px] font-head text-[15px] font-extrabold text-acc-ink transition-[filter] hover:brightness-[1.06]"
      >
        Back home
        <Icon name="chev" size={16} />
      </Link>
    </main>
  );
}
