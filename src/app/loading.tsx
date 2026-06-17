/** Generic page skeleton (home / upload), built from the panel tokens. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[680px] px-[18px] pb-[60px] pt-[22px]" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="mb-[30px] flex items-center justify-between">
        <div className="sq-skeleton h-7 w-[130px] rounded-field" />
        <div className="sq-skeleton size-[38px] rounded-field" />
      </div>
      <div className="sq-skeleton mb-3 h-[48px] w-[70%] rounded-card" />
      <div className="sq-skeleton mb-8 h-[20px] w-[85%] rounded-field" />
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((g) => (
          <div key={g}>
            <div className="sq-skeleton mb-[11px] h-[14px] w-[80px] rounded" />
            <div className="flex gap-[10px]">
              {[0, 1, 2, 3].map((c) => (
                <div key={c} className="sq-skeleton h-[74px] flex-1 rounded-card" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
