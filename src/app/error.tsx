"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";

/** Segment error boundary — keeps server/render failures from dead-ending the app. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      role="alert"
      className="mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center gap-3 px-[18px] text-center"
    >
      <div className="text-accent">
        <Icon name="squiggle" size={40} />
      </div>
      <h1 className="font-head text-[22px] font-extrabold tracking-[-0.01em]">Something went wrong</h1>
      <p className="max-w-[42ch] text-[14px] leading-[1.55] text-fg2">
        An unexpected error stopped this page from loading. You can try again or head back home.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-field bg-accent px-[22px] py-[13px] font-head text-[15px] font-extrabold text-acc-ink transition-[filter] hover:brightness-[1.06]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-field border-[1.5px] border-line bg-panel px-[22px] py-[13px] font-head text-[15px] font-bold text-fg2 transition-colors hover:border-line2 hover:text-fg"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
