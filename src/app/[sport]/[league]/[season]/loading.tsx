/** Dataset (chart) skeleton shown while standings load. Mirrors the page chrome. */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col" aria-busy="true">
      <span className="sr-only">Loading chart…</span>
      <header className="flex items-center gap-3 border-b border-line px-4 py-[13px]">
        <div className="sq-skeleton size-[38px] flex-none rounded-field" />
        <div className="sq-skeleton size-9 flex-none rounded-[10px]" />
        <div className="min-w-0 flex-1">
          <div className="sq-skeleton mb-[6px] h-[18px] w-[180px] rounded" />
          <div className="sq-skeleton h-[12px] w-[140px] rounded" />
        </div>
        <div className="sq-skeleton size-[38px] flex-none rounded-field" />
      </header>

      <div className="flex-1 px-3 py-4 sm:px-[18px]">
        <div className="sq-skeleton h-[460px] w-full rounded-panel" />
        <div className="mt-4 flex gap-[7px] overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sq-skeleton h-[34px] w-[88px] flex-none rounded-pill" />
          ))}
        </div>
      </div>
    </div>
  );
}
