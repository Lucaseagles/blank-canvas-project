/** Browser-level preference for transient public activity notices. No customer data stored. */
export const SOCIAL_PROOF_VISIBILITY_KEY="rubi_social_proof_notices_enabled_v1";
export const SOCIAL_PROOF_VISIBILITY_EVENT="rubi-social-proof-visibility";
export function socialProofNoticesEnabled():boolean {
 if(typeof window==="undefined")return true;
 try{return window.localStorage.getItem(SOCIAL_PROOF_VISIBILITY_KEY)!=="false";}
 catch{return true;}
}
export function setSocialProofNoticesEnabled(enabled:boolean):void {
 if(typeof window==="undefined")return;
 try{window.localStorage.setItem(SOCIAL_PROOF_VISIBILITY_KEY,String(enabled));}catch{/* local storage may be unavailable */}
 window.dispatchEvent(new Event(SOCIAL_PROOF_VISIBILITY_EVENT));
}
