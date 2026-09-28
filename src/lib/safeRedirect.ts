/** Only same-site paths are allowed as post-login destinations — never `//evil.com` or `https://…`. */
export function safeRedirectPath(next: string | null | undefined, fallback = "/today"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Other components (the header's account button) listen for this to refresh who's signed in. */
export const AUTH_CHANGED_EVENT = "astronum:auth-changed";
