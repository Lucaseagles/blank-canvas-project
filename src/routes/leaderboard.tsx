import { createFileRoute } from "@tanstack/react-router";
import { ReferralLeaderboard } from "@/referral/ReferralLeaderboard";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <ReferralLeaderboard />
    </main>
  );
}
