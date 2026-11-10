/** All follow-ups are internal, opt-in, and create no external messages. */
export const RUBI_FOLLOWUP_INTERVALS = [14, 30, 60] as const;
export type RubiFollowupInterval = typeof RUBI_FOLLOWUP_INTERVALS[number];

export function rubiFollowupDueDate(start: Date, days: RubiFollowupInterval): string {
  if (!RUBI_FOLLOWUP_INTERVALS.includes(days)) throw new Error("Prazo de acompanhamento inválido.");
  if (!Number.isFinite(start.getTime())) throw new Error("Data de início inválida.");
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function classifyRubiFollowup(quote: {
  followup_opt_in: boolean;
  followup_due_at: string | null;
  followup_completed_at: string | null;
}, now = new Date()): "disabled" | "completed" | "overdue" | "due" | "upcoming" {
  if (!quote.followup_opt_in || !quote.followup_due_at) return "disabled";
  if (quote.followup_completed_at) return "completed";
  const difference = new Date(quote.followup_due_at).getTime() - now.getTime();
  if (!Number.isFinite(difference)) return "disabled";
  if (difference < -24 * 60 * 60 * 1000) return "overdue";
  if (difference <= 0) return "due";
  return "upcoming";
}
