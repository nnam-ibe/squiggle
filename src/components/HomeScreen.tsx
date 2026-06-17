"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PickStep } from "@/components/PickStep";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Catalog } from "@/server/catalog";

export function HomeScreen({ catalog }: { catalog: Catalog }) {
  const sports = catalog.sports;
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const sport = sports.find((s) => s.id === sportId) ?? sports[0];

  const [leagueId, setLeagueId] = useState(sport?.leagues[0]?.id ?? "");
  const league = sport?.leagues.find((l) => l.id === leagueId) ?? sport?.leagues[0];

  const [seasonKey, setSeasonKey] = useState<string | null>(null);
  const season = league?.seasons.find((s) => s.season === seasonKey) ?? null;

  function pickSport(id: string) {
    setSportId(id);
    const s = sports.find((x) => x.id === id);
    setLeagueId(s?.leagues[0]?.id ?? "");
    setSeasonKey(null);
  }
  function pickLeague(id: string) {
    setLeagueId(id);
    setSeasonKey(null);
  }

  const hasData = !!season?.hasData;

  return (
    <main className="mx-auto max-w-[680px] px-[18px] pb-[60px] pt-[22px]">
      <div className="mb-[30px] flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <span className="flex text-accent">
            <Icon name="squiggle" size={30} />
          </span>
          <span className="font-head text-[21px] font-extrabold tracking-[-0.02em]">Squiggle</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="mb-[26px]">
        <h1 className="mb-3 text-[clamp(34px,9vw,52px)] leading-[0.98]">Chart the climb.</h1>
        <p className="m-0 max-w-[42ch] text-[15.5px] leading-[1.5] text-fg2">
          Every position, every round. Pick a competition to see the season untangle.
        </p>
      </div>

      <div className="mb-[22px] flex flex-col gap-4">
        <PickStep
          n={1}
          label="Sport"
          value={sportId}
          onPick={pickSport}
          options={sports.map((s) => ({ id: s.id, name: s.name, icon: s.icon as IconName }))}
        />
        <PickStep
          n={2}
          label="League"
          value={leagueId}
          onPick={pickLeague}
          options={(sport?.leagues ?? []).map((l) => ({ id: l.id, name: l.name, meta: l.country }))}
        />
        <PickStep
          n={3}
          label="Season"
          value={seasonKey ?? ""}
          onPick={(id) => setSeasonKey(id)}
          options={(league?.seasons ?? []).map((s) => ({
            id: s.season,
            name: s.season,
            meta: s.hasData ? null : "no data",
            metaND: !s.hasData,
          }))}
        />
      </div>

      {season && !hasData ? (
        <EmptyState league={league?.name ?? ""} season={season.season} />
      ) : hasData ? (
        <Link
          href={season!.href}
          className="flex w-full items-center justify-center gap-2 rounded-card bg-accent p-4 font-head text-[16px] font-extrabold tracking-[-0.01em] text-acc-ink shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent)_70%,transparent)] transition-[filter,transform] hover:brightness-[1.06] active:translate-y-px"
        >
          Open {league?.name} · {season!.season}
          <Icon name="chev" size={18} />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-card border-[1.5px] border-line bg-panel2 p-4 font-head text-[16px] font-extrabold tracking-[-0.01em] text-fg3"
        >
          Pick a season to chart
        </button>
      )}

      <div className="mt-6 flex items-center justify-between gap-[14px] rounded-card border-[1.5px] border-dashed border-line2 bg-[color-mix(in_oklab,var(--panel)_50%,transparent)] px-[18px] py-4">
        <div className="flex flex-col gap-[3px]">
          <span className="font-head text-[14.5px] font-bold">Have your own table?</span>
          <span className="text-[12.5px] text-fg2">CSV or JSON of round-by-round standings.</span>
        </div>
        <Link
          href="/upload"
          className="flex flex-none items-center gap-2 whitespace-nowrap rounded-field border-[1.5px] border-line2 bg-panel2 px-4 py-[11px] font-head text-[14px] font-bold transition-[border-color,transform] hover:border-accent hover:text-accent active:translate-y-px"
        >
          <Icon name="upload" size={16} />
          Upload data
        </Link>
      </div>
    </main>
  );
}

function EmptyState({ league, season }: { league: string; season: string }) {
  const colors = ["#3ee07f", "#6CB7EA", "#FF7A00", "#E8112D"];
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border-[1.5px] border-line bg-panel px-[22px] py-[30px] text-center">
      <div className="mb-[2px] opacity-90">
        <svg viewBox="0 0 120 60" width={120} height={60} fill="none" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M4 ${20 + i * 8} C 30 ${20 + i * 8}, 40 ${50 - i * 12}, 60 ${30 + (i % 2) * 6} S 96 ${14 + i * 9}, 116 ${24 + i * 6}`}
              stroke={colors[i]}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.5}
              strokeDasharray="3 4"
            />
          ))}
        </svg>
      </div>
      <div className="font-head text-[18px] font-extrabold tracking-[-0.01em]">
        No chart for {league} · {season} yet
      </div>
      <div className="max-w-[40ch] text-[13.5px] leading-[1.55] text-fg2">
        We don&apos;t have round-by-round standings for this season. Upload your own to squiggle it.
      </div>
      <Link
        href="/upload"
        className="mt-[6px] flex items-center justify-center gap-2 rounded-card bg-accent px-[22px] py-[13px] font-head text-[16px] font-extrabold tracking-[-0.01em] text-acc-ink shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent)_70%,transparent)] transition-[filter,transform] hover:brightness-[1.06] active:translate-y-px"
      >
        <Icon name="upload" size={17} />
        Upload data
      </Link>
    </div>
  );
}
