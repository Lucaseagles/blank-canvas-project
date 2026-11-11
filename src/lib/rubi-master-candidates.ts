/** Future Master candidates are NOT authorization grants. */
export const PRIMARY_MASTER_EMAIL = "eaglesfr49@gmail.com";
export function canProposeMasterCandidate(email:string):boolean {
 const normalized=email.trim().toLowerCase();
 return normalized!==PRIMARY_MASTER_EMAIL &&
  normalized.length<=254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
