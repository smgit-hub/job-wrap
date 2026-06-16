// ---------------------------------------------------------------------------
// Disposable / throwaway email domain blocklist
//
// Not exhaustive — this is a cheap first line of defense against the laziest
// repeat-signup abuse (creating unlimited free trial accounts to dodge
// payment). It will not stop someone using a real Gmail address with +
// aliasing, or a less common temp-mail provider. Pair with the Supabase
// Auth IP-based signup rate limit (Dashboard → Authentication → Rate Limits)
// for a second layer.
// ---------------------------------------------------------------------------

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "fakeinbox.com",
  "dispostable.com",
  "mailcatch.com",
  "mintemail.com",
  "sharklasers.com",
  "spam4.me",
  "maildrop.cc",
  "moakt.com",
  "tempinbox.com",
  "emailondeck.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}
