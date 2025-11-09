import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { allianceNotes, players } from "@/app/_server/db/schema";
import { eq, and, sql, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");
    const authorId = searchParams.get("authorId");

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    // Trust level distribution
    const trustDistribution = await db
      .select({
        trustLevel: allianceNotes.trustLevel,
        count: count(),
      })
      .from(allianceNotes)
      .where(
        authorId
          ? and(eq(allianceNotes.seasonId, seasonId), eq(allianceNotes.authorId, authorId))
          : eq(allianceNotes.seasonId, seasonId)
      )
      .groupBy(allianceNotes.trustLevel);

    // Get all relationships (author -> subject with trust level)
    const relationships = await db
      .select({
        authorId: allianceNotes.authorId,
        authorName: sql<string>`author.display_name`,
        subjectId: allianceNotes.subjectPlayerId,
        subjectName: sql<string>`subject.display_name`,
        trustLevel: allianceNotes.trustLevel,
        noteCount: count(),
      })
      .from(allianceNotes)
      .innerJoin(players.as("author"), eq(allianceNotes.authorId, sql`author.id`))
      .innerJoin(players.as("subject"), eq(allianceNotes.subjectPlayerId, sql`subject.id`))
      .where(
        authorId
          ? and(eq(allianceNotes.seasonId, seasonId), eq(allianceNotes.authorId, authorId))
          : eq(allianceNotes.seasonId, seasonId)
      )
      .groupBy(
        allianceNotes.authorId,
        sql`author.display_name`,
        allianceNotes.subjectPlayerId,
        sql`subject.display_name`,
        allianceNotes.trustLevel
      );

    // Calculate trust level counts per player
    const playerTrustCounts = await db
      .select({
        playerId: allianceNotes.authorId,
        playerName: sql<string>`author.display_name`,
        distrust: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'distrust' THEN 1 END)`,
        neutral: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'neutral' THEN 1 END)`,
        ally: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'ally' THEN 1 END)`,
        core: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'core' THEN 1 END)`,
      })
      .from(allianceNotes)
      .innerJoin(players.as("author"), eq(allianceNotes.authorId, sql`author.id`))
      .where(
        authorId
          ? and(eq(allianceNotes.seasonId, seasonId), eq(allianceNotes.authorId, authorId))
          : eq(allianceNotes.seasonId, seasonId)
      )
      .groupBy(allianceNotes.authorId, sql`author.display_name`);

    return NextResponse.json({
      ok: true,
      stats: {
        trustDistribution,
        relationships,
        playerTrustCounts,
      },
    });
  } catch (error) {
    console.error("Failed to fetch alliance stats:", error);
    return NextResponse.json({ error: "Failed to fetch alliance stats" }, { status: 500 });
  }
}

