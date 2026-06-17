import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center gap-3 px-[18px] text-center">
      <div className="text-accent">
        <Icon name="squiggle" size={40} />
      </div>
      <h1 className="font-head text-[22px] font-extrabold tracking-[-0.01em]">Page not found</h1>
      <p className="max-w-[42ch] text-[14px] leading-[1.55] text-fg2">
        That page doesn&apos;t exist. Head back home to pick a competition and chart the climb.
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
