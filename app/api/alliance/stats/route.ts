import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { allianceNotes, players } from "@/app/_server/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

    // Create aliases for players table
    const author = alias(players, "author");
    const subject = alias(players, "subject");

    // Get all relationships (author -> subject with trust level)
    const relationships = await db
      .select({
        authorId: allianceNotes.authorId,
        authorName: author.displayName,
        subjectId: allianceNotes.subjectPlayerId,
        subjectName: subject.displayName,
        trustLevel: allianceNotes.trustLevel,
        noteCount: count(),
      })
      .from(allianceNotes)
      .innerJoin(author, eq(allianceNotes.authorId, author.id))
      .innerJoin(subject, eq(allianceNotes.subjectPlayerId, subject.id))
      .where(
        authorId
          ? and(eq(allianceNotes.seasonId, seasonId), eq(allianceNotes.authorId, authorId))
          : eq(allianceNotes.seasonId, seasonId)
      )
      .groupBy(
        allianceNotes.authorId,
        author.displayName,
        allianceNotes.subjectPlayerId,
        subject.displayName,
        allianceNotes.trustLevel
      );

    // Calculate trust level counts per player
    const playerTrustCounts = await db
      .select({
        playerId: allianceNotes.authorId,
        playerName: author.displayName,
        distrust: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'distrust' THEN 1 END)`,
        neutral: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'neutral' THEN 1 END)`,
        ally: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'ally' THEN 1 END)`,
        core: sql<number>`COUNT(CASE WHEN ${allianceNotes.trustLevel} = 'core' THEN 1 END)`,
      })
      .from(allianceNotes)
      .innerJoin(author, eq(allianceNotes.authorId, author.id))
      .where(
        authorId
          ? and(eq(allianceNotes.seasonId, seasonId), eq(allianceNotes.authorId, authorId))
          : eq(allianceNotes.seasonId, seasonId)
      )
      .groupBy(allianceNotes.authorId, author.displayName);

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
