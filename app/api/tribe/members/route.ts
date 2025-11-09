import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { tribeMembers, players } from "@/app/_server/db/schema";
import { eq } from "drizzle-orm";
import { handleApiError } from "@/app/_server/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");
    const tribeId = searchParams.get("tribeId");

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    const player = await getCurrentPlayer(seasonId);

    // Get player's tribe if tribeId not provided
    let targetTribeId = tribeId;
    if (!targetTribeId) {
      const [member] = await db
        .select()
        .from(tribeMembers)
        .where(eq(tribeMembers.playerId, player.id))
        .limit(1);
      targetTribeId = member?.tribeId || null;
    }

    if (!targetTribeId) {
      return NextResponse.json({ members: [] });
    }

    // Get all members of the tribe
    const members = await db
      .select({
        id: players.id,
        displayName: players.displayName,
      })
      .from(tribeMembers)
      .innerJoin(players, eq(tribeMembers.playerId, players.id))
      .where(eq(tribeMembers.tribeId, targetTribeId));

    return NextResponse.json({ ok: true, members });
  } catch (error) {
    return handleApiError(error);
  }
}
