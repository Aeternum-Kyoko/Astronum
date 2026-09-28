/**
 * The theme's storage key and its pre-paint script. Kept out of the
 * ThemeToggle client component: a server component importing a value from a
 * "use client" file gets a client reference, not the string.
 */
export const THEME_STORAGE_KEY = "astronum-theme";

// Runs in <head> before first paint so the page never flashes the wrong theme.
// The saved choice wins; otherwise follow the OS preference.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})();`;
