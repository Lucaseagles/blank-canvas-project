type SessionStorageLike = Pick<Storage, "getItem" | "setItem">;

const inFlight = new Set<string>();

/** Persist the session dedupe marker only after the analytics writer confirms success. */
export async function recordRubiABExposureOnce(
  storage: SessionStorageLike,
  key: string,
  variantId: string,
  write: () => Promise<boolean>,
): Promise<boolean> {
  if (!key || !variantId) return false;
  try {
    if (storage.getItem(key) === variantId || inFlight.has(key)) return false;
    inFlight.add(key);
    const recorded = await write();
    if (!recorded) return false;
    storage.setItem(key, variantId);
    return true;
  } catch {
    return false;
  } finally {
    inFlight.delete(key);
  }
}
