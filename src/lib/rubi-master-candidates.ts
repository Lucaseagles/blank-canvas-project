/** Future Master candidates are NOT authorization grants. */
export function canProposeMasterCandidate(email:string):boolean {
 const normalized=email.trim().toLowerCase();
 return normalized.length<=254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
