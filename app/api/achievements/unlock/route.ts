import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const ACHIEVEMENTS = [
  {
    id: "challenge-beast",
    name: "Challenge Beast",
    description: "Win 3 immunity challenges in one season",
    icon: "🏆",
    rarity: "rare",
    condition: { type: "challenge_wins", threshold: 3 },
  },
  {
    id: "social-butterfly",
    name: "Social Butterfly",
    description: "Form 4+ alliances",
    icon: "🦋",
    rarity: "common",
    condition: { type: "alliance_count", threshold: 4 },
  },
  {
    id: "survivor",
    name: "Survivor",
    description: "Reach Final 3",
    icon: "🔥",
    rarity: "legendary",
    condition: { type: "placement", threshold: 3 },
  },
  {
    id: "confession-king",
    name: "Confessional King",
    description: "Post 20+ confessionals",
    icon: "🎥",
    rarity: "common",
    condition: { type: "confessional_count", threshold: 20 },
  },
] as const;

export async function POST(req: NextRequest) {
  await requireAuth();
  const { playerId } = await req.json();

  // Fetch player stats
  const statsResult = await db.execute(sql`
    SELECT
      COALESCE((SELECT COUNT(*) FROM challenge_results WHERE subject_id = ${playerId}), 0)::INT as challenge_wins,
      COALESCE((SELECT COUNT(DISTINCT alliance_id) FROM alliance_members WHERE player_id = ${playerId}), 0)::INT as alliance_count,
      COALESCE((SELECT COUNT(*) FROM confessionals WHERE player_id = ${playerId}), 0)::INT as confessional_count
  `);

  const playerStats = Array.isArray(statsResult) ? statsResult[0] : statsResult;

  const stats = playerStats as {
    challenge_wins: number;
    alliance_count: number;
    confessional_count: number;
  };

  const unlocked = ACHIEVEMENTS.filter((achievement) => {
    switch (achievement.condition.type) {
      case "challenge_wins":
        return stats.challenge_wins >= achievement.condition.threshold;
      case "alliance_count":
        return stats.alliance_count >= achievement.condition.threshold;
      case "confessional_count":
        return stats.confessional_count >= achievement.condition.threshold;
      default:
        return false;
    }
  });

  return NextResponse.json({ ok: true, unlocked });
}
