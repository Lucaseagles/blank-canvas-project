export type TeamMembershipRecord={team_id:string;commercial_profile_id:string;status:string;joined_at:string};
export type ReferralRecord={id:string;commercial_profile_id:string};
export type VisitRecord={referral_link_id:string;visited_at:string};
export type SaleRecord={referral_link_id:string;confirmed_at:string};
export type TeamPulseRow={teamId:string;activeMembers:number;activeLinks:number;visitEvents:number;confirmedSales:number;excludedAmbiguousMembers:number};

/** Cohort-aware within membership start, excluding profiles assigned to multiple teams.
 * This is a team activity report, NOT payout, ROI, unique people or paid settlement.
 */
export function summarizeRubiCreatorTeamsPerformance(
 teams:{id:string}[], memberships:TeamMembershipRecord[],links:ReferralRecord[],
 visits:VisitRecord[],sales:SaleRecord[]
):TeamPulseRow[]{
 const active=memberships.filter(m=>m.status==="active"&&Number.isFinite(Date.parse(m.joined_at)));
 const membershipsByProfile=new Map<string,TeamMembershipRecord[]>();
 for(const m of active)membershipsByProfile.set(m.commercial_profile_id,[...(membershipsByProfile.get(m.commercial_profile_id)??[]),m]);
 const linkById=new Map(links.map(l=>[l.id,l]));
 const counts=new Map(teams.map(t=>[t.id,{teamId:t.id,activeMembers:0,activeLinks:0,visitEvents:0,confirmedSales:0,excludedAmbiguousMembers:0}]));
 for(const [profileId,assignments] of membershipsByProfile){
  if(assignments.length!==1){
   for(const teamId of new Set(assignments.map(a=>a.team_id))){
    const item=counts.get(teamId);if(item)item.excludedAmbiguousMembers++;
   }
   continue;
  }
  const membership=assignments[0];const entry=counts.get(membership.team_id);
  if(!entry)continue;
  entry.activeMembers++;
  entry.activeLinks+=links.filter(l=>l.commercial_profile_id===profileId).length;
 }
 const add=(referralLinkId:string,occurredAt:string,key:"visitEvents"|"confirmedSales")=>{
  const link=linkById.get(referralLinkId);if(!link)return;
  const assignments=membershipsByProfile.get(link.commercial_profile_id);
  if(!assignments||assignments.length!==1)return;
  const membership=assignments[0];const entry=counts.get(membership.team_id);
  const timestamp=Date.parse(occurredAt),joined=Date.parse(membership.joined_at);
  if(!entry||!Number.isFinite(timestamp)||timestamp<joined)return;
  entry[key]++;
 };
 for(const visit of visits)add(visit.referral_link_id,visit.visited_at,"visitEvents");
 for(const sale of sales)add(sale.referral_link_id,sale.confirmed_at,"confirmedSales");
 return [...counts.values()];
}
