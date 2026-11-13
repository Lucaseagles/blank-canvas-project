/**
 * Conservative media watch coverage for the discovery feed.
 * Seeking or looping through a tiny portion cannot create 90% completion.
 * This measures observed player progress, not human attention.
 */
export type RubiVideoWatchCoverage={
 duration:number;
 previousTime:number|null;
 watchedBuckets:Set<number>;
};
export const newRubiVideoWatchCoverage=(duration:number):RubiVideoWatchCoverage=>({
 duration,previousTime:null,watchedBuckets:new Set<number>()
});
export function markRubiVideoSeek(state:RubiVideoWatchCoverage){
 state.previousTime=null;
}
export function observeRubiVideoWatch(
 state:RubiVideoWatchCoverage,currentTime:number,duration:number
):{started:boolean;completed:boolean;coveragePercent:number}{
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(currentTime)||currentTime<0||currentTime>duration){
  state.previousTime=null;
  return {started:false,completed:false,coveragePercent:0};
 }
 if(Math.abs(state.duration-duration)>0.1){
  state.duration=duration;state.previousTime=null;state.watchedBuckets.clear();
 }
 const previous=state.previousTime;
 state.previousTime=currentTime;
 let started=false;
 if(previous!==null){
  const delta=currentTime-previous;
  // A large jump or rewind is not watch time; buffer delays may undercount safely.
  if(delta>0&&delta<=2.5){
   started=true;
   const begin=Math.max(0,Math.min(99,Math.floor(previous/duration*100)));
   const end=Math.max(0,Math.min(99,Math.floor(currentTime/duration*100)));
   for(let i=begin;i<=end;i++)state.watchedBuckets.add(i);
  }
 }
 const coveragePercent=state.watchedBuckets.size;
 return {started,completed:coveragePercent>=90,coveragePercent};
}
