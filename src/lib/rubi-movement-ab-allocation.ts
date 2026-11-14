/** Assignment remains stable across page refreshes for the same anonymous visitor and experiment revision.
 * No account attribute, purchase history or sensitive profiling influences the arm.
 */
export function assignRubiABArm(experimentId:string,revision:number,visitorId:string):"control"|"challenger" {
 if(!/^[0-9a-f-]{36}$/i.test(experimentId)||!Number.isSafeInteger(revision)||revision<1||
  !/^[0-9a-f-]{36}$/i.test(visitorId))throw new Error("Identificação de experimento inválida.");
 const key=experimentId+"|"+revision+"|"+visitorId;
 let hash=2166136261;
 for(let i=0;i<key.length;i++){hash=Math.imul(hash^key.charCodeAt(i),16777619)>>>0;}
 return hash%2===0?"control":"challenger";
}
