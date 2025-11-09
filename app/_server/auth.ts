import { createClient } from "@/app/_lib/supabase/server";
import { db } from "@/server/db/client";
import { players } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { ApiError } from "./errors";

export async function getServerSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Get player ID for the current user in a specific season
 * Returns null if user is not a player in that season
 */
export async function getPlayerId(seasonId: string): Promise<string | null> {
  const session = await getServerSession();
  if (!session) return null;

  // Query DB for player in this season
  const player = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.userId, session.user.id),
        eq(players.seasonId, seasonId)
      )
    )
    .limit(1);

  return player[0]?.id ?? null;
}

/**
 * Get full player record for the current user in a specific season
 * Throws if user is not authenticated or not a player in that season
 */
export async function getCurrentPlayer(seasonId: string) {
  const session = await requireAuth();

  const player = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.userId, session.user.id),
        eq(players.seasonId, seasonId),
        isNull(players.eliminatedAt) // Only active players
      )
    )
    .limit(1);

  if (!player[0]) {
    throw new Error("Player not found in season");
  }

  return player[0];
}

/**
 * Require that the user is a player in the given season
 * Returns the player ID, throws if not found
 */
export async function requirePlayer(seasonId: string): Promise<string> {
  const playerId = await getPlayerId(seasonId);
  if (!playerId) {
    throw new Error("Player not found in season");
  }
  return playerId;
}

/**
 * Require that the user is a GM in the given season
 * Returns the player record, throws if not GM
 */
export async function requireGM(seasonId: string) {
  const player = await getCurrentPlayer(seasonId);
  if (!player.isGM) {
    throw new ApiError("GM access required", 403);
  }
  return player;
}
