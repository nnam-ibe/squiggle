import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BumpChart } from "@/components/BumpChart";
import { buildChartSeries } from "@/components/bump-chart-data";
import { getLeague } from "@/config/leagues";
import { getDatasetStandings, type EntityMode } from "@/server/datasets";

const ENTITY_LABEL: Record<EntityMode, string> = { drivers: "Drivers", constructors: "Constructors" };

export const dynamic = "force-dynamic"; // reads the DB at request time

const SPORT_ICON: Record<string, IconName> = { soccer: "soccer", motorsport: "f1" };

function prettySeason(season: string) {
  return season.replace("-", "/");
}

export default async function DatasetPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; league: string; season: string }>;
  searchParams: Promise<{ entity?: string }>;
}) {
  const { sport, league, season } = await params;
  const { entity } = await searchParams;
  const mode = entity === "constructors" ? "constructors" : "drivers";
  const data = await getDatasetStandings({ sport, league, season, entity: mode });
  const leagueName = getLeague(league)?.name ?? league;

  if (!data) {
    return <NotFound leagueName={leagueName} season={season} />;
  }

  const sportIcon = SPORT_ICON[data.sport] ?? "soccer";
  const variant = data.sport === "soccer" ? "soccer" : "f1";
  const unit = variant === "f1" ? "round" : "matchweek";
  const series = buildChartSeries(data.standings, data.colors, data.shorts);

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
              Position after each {unit}{data.isComplete ? "" : " · in progress"}
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {data.entities && (
        <EntityToggle
          sport={sport}
          league={league}
          season={season}
          entities={data.entities}
          active={data.entity}
        />
      )}

      <div className="flex-1 px-3 py-4 sm:px-[18px]">
        <BumpChart series={series} rounds={data.standings.rounds.length} variant={variant} />
      </div>
    </div>
  );
}

/**
 * Drivers/Constructors segmented control for F1. Rendered as links so each mode is a
 * shareable permalink (`?entity=…`) and the standings are recomputed server-side.
 */
function EntityToggle({
  sport,
  league,
  season,
  entities,
  active,
}: {
  sport: string;
  league: string;
  season: string;
  entities: EntityMode[];
  active: EntityMode | null;
}) {
  const base = `/${sport}/${league}/${encodeURIComponent(season)}`;
  return (
    <div
      role="tablist"
      aria-label="Standings type"
      className="mx-4 mt-[14px] mb-1 flex w-fit gap-1 rounded-[13px] border border-line bg-panel p-1"
    >
      {entities.map((m) => {
        const on = m === active;
        return (
          <Link
            key={m}
            href={`${base}?entity=${m}`}
            role="tab"
            aria-selected={on}
            scroll={false}
            className={`rounded-[9px] px-[18px] py-2 font-head text-[14px] font-bold transition-colors ${
              on ? "bg-accent text-acc-ink" : "text-fg2 hover:text-fg"
            }`}
          >
            {ENTITY_LABEL[m]}
          </Link>
        );
      })}
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
