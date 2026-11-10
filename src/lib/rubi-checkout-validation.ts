/** Checkout URL validation shared by owner writes and public checkout readiness.
 * The supplier hostname must be separately entered and verified by an owner.
 * Syntax + hostname validation never proves a provider issued the URL.
 */
const HOST = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeRubiCheckoutHost(value: string | null | undefined): string | null {
  const host = value?.trim().toLowerCase() ?? "";
  return host && HOST.test(host) ? host : null;
}

export function verifyRubiCheckoutUrl(
  value: string | null | undefined,
  checkoutHost: string | null | undefined,
): string | null {
  const expected = normalizeRubiCheckoutHost(checkoutHost);
  if (!expected || !value || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password ||
        url.port || url.hash || url.hostname.toLowerCase() !== expected) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export type RubiCheckoutRecord = {
  checkout_url: string | null;
  checkout_verified: boolean;
  hub_suppliers: { active: boolean; checkout_host: string | null } | null;
};

export function approvedRubiCheckout(record: RubiCheckoutRecord): string | null {
  if (!record.checkout_verified || !record.hub_suppliers?.active) return null;
  return verifyRubiCheckoutUrl(record.checkout_url, record.hub_suppliers.checkout_host);
}
