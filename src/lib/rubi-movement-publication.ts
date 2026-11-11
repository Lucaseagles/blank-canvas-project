export type RubiPageApproval = {
 variantStatus:string;
 movementStatus:string;
 movementAudience:string;
 variantRevision:number;
 movementRevision:number;
 approvedVariantRevision:number|null;
 approvedMovementRevision:number|null;
 productMatches:boolean;
 checkoutReady:boolean;
};
/** A stale approved version must never be displayed as current campaign copy. */
export function canServeApprovedMovementPage(value:RubiPageApproval):boolean{
 return value.productMatches && value.checkoutReady &&
  value.variantStatus==="review" && value.movementStatus==="review" &&
  value.movementAudience==="consumer" &&
  Number.isInteger(value.approvedVariantRevision) && Number.isInteger(value.approvedMovementRevision) &&
  value.variantRevision===value.approvedVariantRevision &&
  value.movementRevision===value.approvedMovementRevision;
}
