import { NextRequest, NextResponse } from "next/server";
import { requireGM } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import {
  campaignEvents,
  projects,
  resources,
  inventories,
  resourceTransactions,
  narrativeArcs,
  players,
  actions,
  seasons,
} from "@/app/_server/db/schema";
import { eq, and, sql, isNotNull, count, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    // Require GM access
    await requireGM(seasonId);

    // Get season info
    const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Event trigger frequency
    const eventStats = await db
      .select({
        type: campaignEvents.type,
        count: count(),
        triggered: sql<number>`COUNT(CASE WHEN ${campaignEvents.triggeredAt} IS NOT NULL THEN 1 END)`,
      })
      .from(campaignEvents)
      .where(eq(campaignEvents.seasonId, seasonId))
      .groupBy(campaignEvents.type);

    const eventsPerDay = await db
      .select({
        day: sql<number>`DATE_TRUNC('day', ${campaignEvents.triggeredAt})`,
        count: count(),
      })
      .from(campaignEvents)
      .where(and(eq(campaignEvents.seasonId, seasonId), isNotNull(campaignEvents.triggeredAt)))
      .groupBy(sql`DATE_TRUNC('day', ${campaignEvents.triggeredAt})`)
      .orderBy(desc(sql`DATE_TRUNC('day', ${campaignEvents.triggeredAt})`))
      .limit(30);

    // Project completion rates
    const projectStats = await db
      .select({
        status: projects.status,
        count: count(),
        tribeProjects: sql<number>`COUNT(CASE WHEN ${projects.tribeId} IS NOT NULL THEN 1 END)`,
        playerProjects: sql<number>`COUNT(CASE WHEN ${projects.playerId} IS NOT NULL THEN 1 END)`,
      })
      .from(projects)
      .where(eq(projects.seasonId, seasonId))
      .groupBy(projects.status);

    // Resource economy stats
    const resourceDistribution = await db
      .select({
        type: resources.type,
        totalQuantity: sql<number>`SUM(${inventories.quantity})`,
        uniqueOwners: sql<number>`COUNT(DISTINCT COALESCE(${inventories.playerId}, ${inventories.tribeId}))`,
      })
      .from(inventories)
      .innerJoin(resources, eq(inventories.resourceId, resources.id))
      .where(eq(inventories.seasonId, seasonId))
      .groupBy(resources.type);

    const transactionStats = await db
      .select({
        reason: resourceTransactions.reason,
        totalDelta: sql<number>`SUM(${resourceTransactions.quantityDelta})`,
        count: count(),
      })
      .from(resourceTransactions)
      .innerJoin(inventories, eq(resourceTransactions.inventoryId, inventories.id))
      .where(eq(inventories.seasonId, seasonId))
      .groupBy(resourceTransactions.reason)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Player engagement metrics
    const activePlayers = await db
      .select({
        playerId: players.id,
        displayName: players.displayName,
        actionCount: sql<number>`COUNT(${actions.id})`,
        lastAction: sql<Date>`MAX(${actions.createdAt})`,
      })
      .from(players)
      .leftJoin(actions, eq(actions.playerId, players.id))
      .where(eq(players.seasonId, seasonId))
      .groupBy(players.id, players.displayName)
      .orderBy(desc(sql`COUNT(${actions.id})`))
      .limit(20);

    // Narrative arc progress
    const arcStats = await db
      .select({
        arcType: narrativeArcs.arcType,
        avgProgress: sql<number>`AVG(${narrativeArcs.progress})`,
        count: count(),
        active: sql<number>`COUNT(CASE WHEN ${narrativeArcs.isActive} = true THEN 1 END)`,
      })
      .from(narrativeArcs)
      .where(eq(narrativeArcs.seasonId, seasonId))
      .groupBy(narrativeArcs.arcType);

    return NextResponse.json({
      ok: true,
      analytics: {
        events: {
          byType: eventStats,
          perDay: eventsPerDay,
          total: eventStats.reduce((sum, e) => sum + Number(e.count), 0),
          triggered: eventStats.reduce((sum, e) => sum + Number(e.triggered), 0),
        },
        projects: {
          byStatus: projectStats,
          total: projectStats.reduce((sum, p) => sum + Number(p.count), 0),
          tribeCount: projectStats.reduce((sum, p) => sum + Number(p.tribeProjects), 0),
          playerCount: projectStats.reduce((sum, p) => sum + Number(p.playerProjects), 0),
        },
        resources: {
          distribution: resourceDistribution,
          transactions: transactionStats,
        },
        engagement: {
          activePlayers,
          totalPlayers: activePlayers.length,
        },
        narrativeArcs: {
          byType: arcStats,
          total: arcStats.reduce((sum, a) => sum + Number(a.count), 0),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch GM analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

