/** Canonical values reviewed by the Master. Any commercial change invalidates prior QA. */
export type RubiQaCommercialProduct={
 id:string;active:boolean;retail_price:number|string|null;
 checkout_url:string|null;checkout_verified:boolean;supplier_id:string;
 hub_suppliers:{active:boolean;checkout_host:string|null}|null;
};
export function rubiQaCommercialSnapshot(p:RubiQaCommercialProduct):string{
 return JSON.stringify([
  p.id,p.supplier_id,Boolean(p.active),Number(p.retail_price),
  p.checkout_url?.trim()??null,Boolean(p.checkout_verified),
  Boolean(p.hub_suppliers?.active),
  p.hub_suppliers?.checkout_host?.trim().toLowerCase()??null,
 ]);
}
export function rubiQaSnapshotCurrent(stored:string|null|undefined,p:RubiQaCommercialProduct):boolean{
 return typeof stored==="string" && stored===rubiQaCommercialSnapshot(p);
}
