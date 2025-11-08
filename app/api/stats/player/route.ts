import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { ApiError } from "@/app/_server/errors";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface AggregatedStatsRow {
  challenge_wins: number;
  tribals_survived: number;
  votes_received: number;
  advantages_found: number;
  alliance_count: number;
  confessional_count: number;
}

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const seasonId = searchParams.get("seasonId");

  if (!playerId || !seasonId) {
    throw new ApiError("playerId and seasonId required", 400);
  }

  // Aggregate stats from existing tables
  const statsResult = await db.execute(sql`
    SELECT
      COALESCE((SELECT COUNT(*) FROM ${sql.identifier("challenge_results")}
        WHERE subject_id = ${playerId} AND subject_type = 'player'), 0)::INT as challenge_wins,
      COALESCE((SELECT COUNT(DISTINCT day) FROM ${sql.identifier("votes")}
        WHERE season_id = ${seasonId}
        AND day <= (SELECT MAX(day) FROM ${sql.identifier("votes")} WHERE voter_player_id = ${playerId})), 0)::INT as tribals_survived,
      COALESCE((SELECT COUNT(*) FROM ${sql.identifier("votes")}
        WHERE target_player_id = ${playerId} AND season_id = ${seasonId}), 0)::INT as votes_received,
      COALESCE((SELECT COUNT(*) FROM ${sql.identifier("items")}
        WHERE owner_player_id = ${playerId} AND season_id = ${seasonId}), 0)::INT as advantages_found,
      COALESCE((SELECT COUNT(DISTINCT alliance_id) FROM ${sql.identifier("alliance_members")}
        WHERE player_id = ${playerId}), 0)::INT as alliance_count,
      COALESCE((SELECT COUNT(*) FROM ${sql.identifier("confessionals")}
        WHERE player_id = ${playerId}), 0)::INT as confessional_count
  `);

  // drizzle(postgres-js) execute returns a RowList (array-like); first row holds aggregated stats
  const firstRow = (statsResult as unknown as AggregatedStatsRow[])[0];
  const empty: AggregatedStatsRow = {
    challenge_wins: 0,
    tribals_survived: 0,
    votes_received: 0,
    advantages_found: 0,
    alliance_count: 0,
    confessional_count: 0,
  };
  return NextResponse.json({ ok: true, stats: firstRow ?? empty });
}
