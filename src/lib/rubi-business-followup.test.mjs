import test from "node:test";
import assert from "node:assert/strict";
import { rubiFollowupDueDate, classifyRubiFollowup } from "./rubi-business-followup.ts";

test("RUBI follow-up intervals are bounded and opt-in dates predictable", () => {
  const origin = new Date("2026-11-10T12:00:00Z");
  assert.equal(rubiFollowupDueDate(origin, 14), "2026-11-24T12:00:00.000Z");
  assert.equal(rubiFollowupDueDate(origin, 30), "2026-12-10T12:00:00.000Z");
  assert.throws(() => rubiFollowupDueDate(origin, 7), /inválido/);
});
test("RUBI follow-up prioritization excludes opted-out and completed tasks", () => {
  const now = new Date("2026-12-10T12:00:00Z");
  const item = { followup_opt_in: true, followup_due_at: "2026-12-08T12:00:00Z", followup_completed_at: null };
  assert.equal(classifyRubiFollowup(item, now), "overdue");
  assert.equal(classifyRubiFollowup({ ...item, followup_due_at: "2026-12-10T12:00:00Z" }, now), "due");
  assert.equal(classifyRubiFollowup({ ...item, followup_due_at: "2026-12-20T12:00:00Z" }, now), "upcoming");
  assert.equal(classifyRubiFollowup({ ...item, followup_opt_in: false }, now), "disabled");
  assert.equal(classifyRubiFollowup({ ...item, followup_completed_at: "2026-12-09T12:00:00Z" }, now), "completed");
});
