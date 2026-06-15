export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "squiggle-theme";

/** Resolve the theme to use on first load: stored choice wins, else OS preference. */
export function resolveInitialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark ? "dark" : "light";
}

/** Inline script (string) run before paint to set data-theme and avoid a flash. */
export const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
