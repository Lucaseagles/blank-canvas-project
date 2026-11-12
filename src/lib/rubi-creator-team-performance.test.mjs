import test from "node:test";
import assert from "node:assert/strict";
import {summarizeRubiCreatorTeamsPerformance} from "./rubi-creator-team-performance.ts";
const joined="2026-11-01T00:00:00Z";
const teams=[{id:"t1"},{id:"t2"}];
test("Counts only events at or after member joined, without fabricating earnings",()=>{
 const data=summarizeRubiCreatorTeamsPerformance(teams,[{team_id:"t1",commercial_profile_id:"p1",status:"active",joined_at:joined}],
  [{id:"l1",commercial_profile_id:"p1"}],
  [{referral_link_id:"l1",visited_at:"2026-10-31T23:59:00Z"},{referral_link_id:"l1",visited_at:"2026-11-02T00:00:00Z"}],
  [{referral_link_id:"l1",confirmed_at:"2026-10-31T22:00:00Z"},{referral_link_id:"l1",confirmed_at:"2026-11-04T00:00:00Z"}]);
 assert.deepEqual(data[0],{teamId:"t1",activeMembers:1,activeLinks:1,visitEvents:1,confirmedSales:1,excludedAmbiguousMembers:0});
 assert.equal(data[1]?.confirmedSales,0);
});
test("Pausing a membership excludes it; multi-team member is ambiguous and not counted twice",()=>{
 const memberships=[
  {team_id:"t1",commercial_profile_id:"p1",status:"active",joined_at:joined},
  {team_id:"t2",commercial_profile_id:"p1",status:"active",joined_at:joined},
  {team_id:"t2",commercial_profile_id:"p2",status:"paused",joined_at:joined}
 ];
 const rows=summarizeRubiCreatorTeamsPerformance(teams,memberships,
  [{id:"l1",commercial_profile_id:"p1"},{id:"l2",commercial_profile_id:"p2"}],
  [{referral_link_id:"l1",visited_at:"2026-11-03T00:00:00Z"}],
  [{referral_link_id:"l1",confirmed_at:"2026-11-03T00:00:00Z"}]);
 assert.equal(rows[0]?.excludedAmbiguousMembers,1);
 assert.equal(rows[1]?.excludedAmbiguousMembers,1);
 assert.equal(rows[0]?.confirmedSales,0);
 assert.equal(rows[1]?.activeMembers,0);
});
