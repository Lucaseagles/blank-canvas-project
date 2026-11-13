/** Observational completion among authenticated video starters in the same reporting period. */
export function rubiVideoCompletionPercent(starts:number,completes:number):number|null{
 if(!Number.isInteger(starts)||!Number.isInteger(completes)||starts<=0||completes<0||completes>starts)return null;
 return Math.round(completes/starts*1000)/10;
}
