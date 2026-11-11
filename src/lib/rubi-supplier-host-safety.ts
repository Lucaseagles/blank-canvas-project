import {normalizeRubiCheckoutHost} from "./rubi-checkout-validation.ts";

/** Protect verified checkout destinations from silent supplier-domain changes. */
export function requiresSupplierCheckoutReverification(
 currentHost:string|null|undefined,
 nextHost:string|null|undefined,
):boolean {
 const current=normalizeRubiCheckoutHost(currentHost);
 const next=normalizeRubiCheckoutHost(nextHost);
 return current!==next;
}
export function mayChangeSupplierCheckoutHost(
 currentHost:string|null|undefined,
 nextHost:string|null|undefined,
 associatedActiveOrVerifiedProducts:number,
):boolean {
 return !requiresSupplierCheckoutReverification(currentHost,nextHost)
  || associatedActiveOrVerifiedProducts===0;
}
