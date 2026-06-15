"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./Icon";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/** Subscribe to <html data-theme> changes so the toggle reflects the live theme. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** Dark/light toggle. Initial theme is set pre-paint by NO_FLASH_SCRIPT; this reads
    it via the external store and persists the user's choice on toggle. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next); // MutationObserver re-renders
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="flex h-[38px] w-[38px] items-center justify-center rounded-field border-[1.5px] border-line bg-panel text-fg2 transition-colors hover:border-line2 hover:text-fg"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
