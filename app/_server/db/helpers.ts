import { db } from "./client";
import {
  players,
  seasons,
  stats,
  debuffs,
  actions,
  campaignEvents,
  projects,
  projectContributions,
  resources,
  inventories,
  resourceTransactions,
  reveals,
  narrativeArcs,
  trades,
  craftingRecipes,
} from "./schema";
import { eq, and, desc, lt, gt, or, isNull } from "drizzle-orm";

/**
 * Get the active season for a player
 * Returns the season with status='active' that the player is in
 */
export async function getActiveSeasonForPlayer(playerId: string) {
  const result = await db
    .select({
      season: seasons,
      player: players,
    })
    .from(players)
    .innerJoin(seasons, eq(players.seasonId, seasons.id))
    .where(
      and(
        eq(players.id, playerId),
        eq(seasons.status, "active")
      )
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get or create stats for a player on a specific day
 * If stats don't exist, create them from the previous day's stats or defaults
 */
export async function getOrCreateStats(playerId: string, day: number) {
  // Try to get existing stats
  const existing = await db
    .select()
    .from(stats)
    .where(
      and(
        eq(stats.playerId, playerId),
        eq(stats.day, day)
      )
    )
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  // Get previous day's stats or use defaults
  const previousStats = await db
    .select()
    .from(stats)
    .where(
      and(
        eq(stats.playerId, playerId),
        lt(stats.day, day)
      )
    )
    .orderBy(desc(stats.day))
    .limit(1);

  const baseStats = previousStats[0] ?? {
    energy: 100,
    hunger: 100,
    thirst: 100,
    social: 50,
  };

  // Create new stats entry
  const [newStats] = await db
    .insert(stats)
    .values({
      playerId,
      day,
      energy: baseStats.energy,
      hunger: baseStats.hunger,
      thirst: baseStats.thirst,
      social: baseStats.social,
    })
    .returning();

  return newStats;
}

/**
 * Update player stats with deltas, clamping values between 0-100
 */
export async function updateStats(
  playerId: string,
  day: number,
  deltas: {
    energy?: number;
    hunger?: number;
    thirst?: number;
    social?: number;
  }
) {
  // Get current stats
  const currentStats = await getOrCreateStats(playerId, day);

  // Calculate new values with clamping
  const clamp = (value: number) => Math.max(0, Math.min(100, value));

  const updated = await db
    .update(stats)
    .set({
      energy: deltas.energy !== undefined
        ? clamp(currentStats.energy + deltas.energy)
        : currentStats.energy,
      hunger: deltas.hunger !== undefined
        ? clamp(currentStats.hunger + deltas.hunger)
        : currentStats.hunger,
      thirst: deltas.thirst !== undefined
        ? clamp(currentStats.thirst + deltas.thirst)
        : currentStats.thirst,
      social: deltas.social !== undefined
        ? clamp(currentStats.social + deltas.social)
        : currentStats.social,
    })
    .where(
      and(
        eq(stats.playerId, playerId),
        eq(stats.day, day)
      )
    )
    .returning();

  return updated[0]!;
}

/**
 * Get active debuffs for a player (not expired)
 */
export async function getActiveDebuffs(playerId: string) {
  const now = new Date();
  return await db
    .select()
    .from(debuffs)
    .where(
      and(
        eq(debuffs.playerId, playerId),
        or(
          isNull(debuffs.expiresAt),
          gt(debuffs.expiresAt, now)
        )
      )
    )
    .orderBy(desc(debuffs.createdAt));
}

/**
 * Apply a debuff to a player
 */
export async function applyDebuff(
  playerId: string,
  seasonId: string,
  day: number,
  kind: string,
  severity: number = 1,
  durationDays?: number
) {
  // Check if debuff already exists
  const existing = await db
    .select()
    .from(debuffs)
    .where(
      and(
        eq(debuffs.playerId, playerId),
        eq(debuffs.kind, kind),
        or(
          isNull(debuffs.expiresAt),
          gt(debuffs.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  // If it exists, update severity instead of creating duplicate
  if (existing[0]) {
    const [updated] = await db
      .update(debuffs)
      .set({
        severity: Math.max(existing[0].severity, severity),
        expiresAt: durationDays
          ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
          : null,
      })
      .where(eq(debuffs.id, existing[0].id))
      .returning();
    return updated;
  }

  // Create new debuff
  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null;

  const [newDebuff] = await db
    .insert(debuffs)
    .values({
      playerId,
      seasonId,
      day,
      kind,
      severity,
      expiresAt,
    })
    .returning();

  return newDebuff;
}

/**
 * Remove a specific debuff from a player
 */
export async function removeDebuff(playerId: string, kind: string) {
  await db
    .delete(debuffs)
    .where(
      and(
        eq(debuffs.playerId, playerId),
        eq(debuffs.kind, kind)
      )
    );
}

/**
 * Remove all expired debuffs for a player
 */
export async function removeExpiredDebuffs(playerId: string) {
  const now = new Date();
  await db
    .delete(debuffs)
    .where(
      and(
        eq(debuffs.playerId, playerId),
        lt(debuffs.expiresAt, now)
      )
    );
}

/**
 * Log a player action with narrative outcome
 */
export async function logAction(
  playerId: string,
  seasonId: string,
  day: number,
  actionType: string,
  success: boolean,
  outcomeText: string,
  statDeltas?: Record<string, number>,
  targetPlayerId?: string
) {
  const [action] = await db
    .insert(actions)
    .values({
      playerId,
      seasonId,
      day,
      actionType,
      success,
      outcomeText,
      statDeltas: statDeltas || null,
      targetPlayerId: targetPlayerId || null,
    })
    .returning();

  return action;
}

/**
 * Get action history for a player
 */
export async function getActionHistory(
  playerId: string,
  limit: number = 10
) {
  return await db
    .select()
    .from(actions)
    .where(eq(actions.playerId, playerId))
    .orderBy(desc(actions.createdAt))
    .limit(limit);
}

/**
 * Get actions for a specific day/season
 */
export async function getActionsForDay(seasonId: string, day: number) {
  return await db
    .select()
    .from(actions)
    .where(
      and(
        eq(actions.seasonId, seasonId),
        eq(actions.day, day)
      )
    )
    .orderBy(desc(actions.createdAt));
}

/**
 * Update player's last active timestamp
 */
export async function updateLastActive(playerId: string) {
  await db
    .update(players)
    .set({ lastActiveAt: new Date() })
    .where(eq(players.id, playerId));
}

// ========== Campaign Events Helpers ==========

export async function createCampaignEvent(data: {
  seasonId: string;
  type: string;
  title: string;
  description: string;
  scheduledDay?: number;
  scheduledPhase?: string;
  payloadJson?: Record<string, any>;
  statEffectsJson?: Record<string, Record<string, number>>;
  triggeredBy?: string;
}) {
  const [event] = await db
    .insert(campaignEvents)
    .values({
      seasonId: data.seasonId,
      type: data.type as any,
      title: data.title,
      description: data.description,
      scheduledDay: data.scheduledDay ?? null,
      scheduledPhase: data.scheduledPhase ?? null,
      payloadJson: data.payloadJson ?? null,
      statEffectsJson: data.statEffectsJson ?? null,
      triggeredBy: data.triggeredBy ?? null,
      triggeredAt: data.triggeredBy ? new Date() : null,
    })
    .returning();

  return event;
}

export async function triggerCampaignEvent(eventId: string, triggeredBy: string | null) {
  const [event] = await db
    .update(campaignEvents)
    .set({
      triggeredAt: new Date(),
      triggeredBy: triggeredBy || null,
    })
    .where(eq(campaignEvents.id, eventId))
    .returning();

  // Apply stat effects if any
  if (event.statEffectsJson) {
    const effects = event.statEffectsJson as Record<string, Record<string, number>>;
    const currentDay = await getCurrentDayForSeason(event.seasonId);

    for (const [playerId, deltas] of Object.entries(effects)) {
      await updateStats(playerId, currentDay, deltas);
    }
  }

  // Emit push notification for campaign event
  // Only import if available (infra directory may not be present in Vercel builds)
  try {
    // Use eval to create a fully dynamic import that webpack can't statically analyze
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const importPath = ['..', '..', 'infra', 'temporal', 'activities'].join('/');
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const activities = await eval(`import('${importPath}')`);
    if (activities?.emitPush) {
      await activities.emitPush({
        seasonId: event.seasonId,
        type: "campaign_event",
        campaignEventId: event.id,
      });
    }
  } catch (_error) {
    // Silently fail if temporal activities aren't available (expected in Vercel builds)
    // This is expected when infra/ directory is excluded by .vercelignore
  }

  return event;
}

export async function getCampaignEvents(seasonId: string, filters?: { status?: "pending" | "triggered" | "all" }) {
  let query = db.select().from(campaignEvents).where(eq(campaignEvents.seasonId, seasonId));

  if (filters?.status === "pending") {
    query = query.where(and(eq(campaignEvents.seasonId, seasonId), isNull(campaignEvents.triggeredAt))) as any;
  } else if (filters?.status === "triggered") {
    query = query.where(and(eq(campaignEvents.seasonId, seasonId), gt(campaignEvents.triggeredAt, new Date(0)))) as any;
  }

  return await query.orderBy(desc(campaignEvents.createdAt));
}

async function getCurrentDayForSeason(seasonId: string): Promise<number> {
  const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
  return season?.dayIndex ?? 1;
}

// ========== Projects Helpers ==========

export async function createProject(data: {
  seasonId: string;
  tribeId?: string;
  playerId?: string;
  name: string;
  description: string;
  targetProgress?: number;
  requiredResourcesJson?: Record<string, number>;
  completionRewardsJson?: { statDeltas?: Record<string, number>; items?: string[] };
}) {
  const [project] = await db
    .insert(projects)
    .values({
      seasonId: data.seasonId,
      tribeId: data.tribeId ?? null,
      playerId: data.playerId ?? null,
      name: data.name,
      description: data.description,
      targetProgress: data.targetProgress ?? 100,
      requiredResourcesJson: data.requiredResourcesJson ?? null,
      completionRewardsJson: data.completionRewardsJson ?? null,
      status: "planning",
    })
    .returning();

  return project;
}

export async function contributeToProject(
  projectId: string,
  playerId: string,
  day: number,
  data: {
    resourcesContributedJson?: Record<string, number>;
    progressAdded?: number;
  }
) {
  // Get project
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Project not found");

  // Create contribution
  const [contribution] = await db
    .insert(projectContributions)
    .values({
      projectId,
      playerId,
      day,
      resourcesContributedJson: data.resourcesContributedJson ?? null,
      progressAdded: data.progressAdded ?? 0,
    })
    .returning();

  // Update project progress
  const newProgress = Math.min(project.progress + (data.progressAdded ?? 0), project.targetProgress);
  const [updated] = await db
    .update(projects)
    .set({
      progress: newProgress,
      status: newProgress >= project.targetProgress ? "completed" : "active",
      startedAt: project.startedAt ?? new Date(),
      completedAt: newProgress >= project.targetProgress ? new Date() : null,
    })
    .where(eq(projects.id, projectId))
    .returning();

  // Apply completion rewards if completed
  if (updated.status === "completed" && updated.completionRewardsJson) {
    const rewards = updated.completionRewardsJson as { statDeltas?: Record<string, number>; items?: string[] };
    if (rewards.statDeltas && project.playerId) {
      await updateStats(project.playerId, day, rewards.statDeltas);
    }
    // TODO: Grant items if rewards.items exists

    // Emit push notification for project completion
    // Only import if available (infra directory may not be present in Vercel builds)
    try {
      // Use eval to create a fully dynamic import that webpack can't statically analyze
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const importPath = ['..', '..', 'infra', 'temporal', 'activities'].join('/');
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const activities = await eval(`import('${importPath}')`);
      if (activities?.emitPush) {
        await activities.emitPush({
          seasonId: project.seasonId,
          type: "project_completed",
          projectId: project.id,
        });
      }
    } catch (_error) {
      // Silently fail if temporal activities aren't available (expected in Vercel builds)
      // This is expected when infra/ directory is excluded by .vercelignore
    }
  }

  return { contribution, project: updated };
}

export async function getProjects(seasonId: string, filters?: { tribeId?: string; playerId?: string; status?: string }) {
  const conditions = [eq(projects.seasonId, seasonId)];

  if (filters?.tribeId) {
    conditions.push(eq(projects.tribeId, filters.tribeId));
  }
  if (filters?.playerId) {
    conditions.push(eq(projects.playerId, filters.playerId));
  }
  if (filters?.status) {
    conditions.push(eq(projects.status, filters.status as any));
  }

  return await db.select().from(projects).where(and(...conditions)).orderBy(desc(projects.createdAt));
}

// ========== Resources & Inventory Helpers ==========

export async function createResource(data: {
  seasonId: string;
  type: string;
  name: string;
  description?: string;
  stackable?: boolean;
  perishable?: boolean;
}) {
  const [resource] = await db
    .insert(resources)
    .values({
      seasonId: data.seasonId,
      type: data.type as any,
      name: data.name,
      description: data.description ?? null,
      stackable: data.stackable ?? true,
      perishable: data.perishable ?? false,
    })
    .returning();

  return resource;
}

export async function getOrCreateInventory(
  seasonId: string,
  resourceId: string,
  options: { tribeId?: string; playerId?: string }
) {
  const conditions = [
    eq(inventories.seasonId, seasonId),
    eq(inventories.resourceId, resourceId),
  ];

  if (options.tribeId) {
    conditions.push(eq(inventories.tribeId, options.tribeId));
    conditions.push(isNull(inventories.playerId));
  } else if (options.playerId) {
    conditions.push(eq(inventories.playerId, options.playerId));
    conditions.push(isNull(inventories.tribeId));
  } else {
    throw new Error("Must provide either tribeId or playerId");
  }

  const existing = await db.select().from(inventories).where(and(...conditions)).limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const [inventory] = await db
    .insert(inventories)
    .values({
      seasonId,
      resourceId,
      tribeId: options.tribeId ?? null,
      playerId: options.playerId ?? null,
      quantity: 0,
    })
    .returning();

  return inventory;
}

export async function updateInventory(
  inventoryId: string,
  quantityDelta: number,
  reason: string,
  options?: {
    relatedEntityType?: string;
    relatedEntityId?: string;
  }
) {
  const [inventory] = await db.select().from(inventories).where(eq(inventories.id, inventoryId)).limit(1);
  if (!inventory) throw new Error("Inventory not found");

  const newQuantity = Math.max(0, inventory.quantity + quantityDelta);

  await db.transaction(async (tx) => {
    await tx
      .update(inventories)
      .set({
        quantity: newQuantity,
        updatedAt: new Date(),
      })
      .where(eq(inventories.id, inventoryId));

    await tx.insert(resourceTransactions).values({
      seasonId: inventory.seasonId,
      inventoryId,
      resourceId: inventory.resourceId,
      quantityDelta,
      reason,
      relatedEntityType: options?.relatedEntityType ?? null,
      relatedEntityId: options?.relatedEntityId ?? null,
    });
  });

  return { ...inventory, quantity: newQuantity };
}

export async function getInventory(seasonId: string, filters: { tribeId?: string; playerId?: string }) {
  const conditions = [eq(inventories.seasonId, seasonId)];

  if (filters.tribeId) {
    conditions.push(eq(inventories.tribeId, filters.tribeId));
    conditions.push(isNull(inventories.playerId));
  } else if (filters.playerId) {
    conditions.push(eq(inventories.playerId, filters.playerId));
    conditions.push(isNull(inventories.tribeId));
  }

  return await db.select().from(inventories).where(and(...conditions));
}

// ========== Reveals Helpers ==========

export async function createReveal(data: {
  seasonId: string;
  type: string;
  title: string;
  description?: string;
  scheduledDay?: number;
  scheduledPhase?: string;
}) {
  const [reveal] = await db
    .insert(reveals)
    .values({
      seasonId: data.seasonId,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      scheduledDay: data.scheduledDay ?? null,
      scheduledPhase: data.scheduledPhase ?? null,
      status: "pending",
    })
    .returning();

  return reveal;
}

export async function commitReveal(revealId: string, commitHash: string) {
  const [reveal] = await db
    .update(reveals)
    .set({
      commitHash,
      status: "committed",
    })
    .where(eq(reveals.id, revealId))
    .returning();

  return reveal;
}

export async function revealContent(revealId: string, revealContentJson: Record<string, any>, revealedBy: string) {
  const [reveal] = await db
    .update(reveals)
    .set({
      revealContentJson,
      status: "revealed",
      revealedAt: new Date(),
      revealedBy,
    })
    .where(eq(reveals.id, revealId))
    .returning();

  // Emit push notification for reveal
  // Only import if available (infra directory may not be present in Vercel builds)
  try {
    // Use eval to create a fully dynamic import that webpack can't statically analyze
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const importPath = ['..', '..', 'infra', 'temporal', 'activities'].join('/');
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const activities = await eval(`import('${importPath}')`);
    if (activities?.emitPush) {
      await activities.emitPush({
        seasonId: reveal.seasonId,
        type: "reveal_revealed",
        revealId: reveal.id,
      });
    }
  } catch (_error) {
      // Silently fail if temporal activities aren't available (expected in Vercel builds)
      // This is expected when infra/ directory is excluded by .vercelignore
    }

  return reveal;
}

export async function getReveals(seasonId: string, filters?: { status?: string }) {
  const conditions = [eq(reveals.seasonId, seasonId)];

  if (filters?.status) {
    conditions.push(eq(reveals.status, filters.status as any));
  }

  return await db.select().from(reveals).where(and(...conditions)).orderBy(desc(reveals.createdAt));
}

// ========== Narrative Arcs Helpers ==========

export async function createNarrativeArc(data: {
  seasonId: string;
  playerId: string;
  arcType: string;
  title: string;
  description?: string;
}) {
  const [arc] = await db
    .insert(narrativeArcs)
    .values({
      seasonId: data.seasonId,
      playerId: data.playerId,
      arcType: data.arcType,
      title: data.title,
      description: data.description ?? null,
      progress: 0,
      isActive: true,
    })
    .returning();

  return arc;
}

export async function updateNarrativeArc(
  arcId: string,
  progress: number,
  milestone?: { day: number; event: string; progress: number }
) {
  const [arc] = await db.select().from(narrativeArcs).where(eq(narrativeArcs.id, arcId)).limit(1);
  if (!arc) throw new Error("Narrative arc not found");

  const milestones = (arc.milestonesJson as any[]) ?? [];
  if (milestone) {
    milestones.push(milestone);
  }

  const [updated] = await db
    .update(narrativeArcs)
    .set({
      progress: Math.min(100, Math.max(0, progress)),
      milestonesJson: milestones,
      completedAt: progress >= 100 ? new Date() : null,
      isActive: progress < 100,
    })
    .where(eq(narrativeArcs.id, arcId))
    .returning();

  return updated;
}

export async function getNarrativeArcs(seasonId: string, filters?: { playerId?: string; isActive?: boolean }) {
  const conditions = [eq(narrativeArcs.seasonId, seasonId)];

  if (filters?.playerId) {
    conditions.push(eq(narrativeArcs.playerId, filters.playerId));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(narrativeArcs.isActive, filters.isActive));
  }

  return await db.select().from(narrativeArcs).where(and(...conditions)).orderBy(desc(narrativeArcs.startedAt));
}

// ========== Trade Functions ==========

export async function createTradeOffer(data: {
  seasonId: string;
  proposerId: string;
  recipientId: string;
  proposerTribeId?: string;
  recipientTribeId?: string;
  resourcesOfferedJson: Record<string, number>;
  resourcesRequestedJson: Record<string, number>;
  message?: string;
}) {
  // Verify proposer has the resources they're offering
  for (const [resourceId, quantity] of Object.entries(data.resourcesOfferedJson)) {
    const inventory = await getOrCreateInventory({
      seasonId: data.seasonId,
      resourceId,
      playerId: data.proposerTribeId ? undefined : data.proposerId,
      tribeId: data.proposerTribeId,
    });
    if (inventory.quantity < quantity) {
      throw new Error(`Insufficient ${resourceId}: have ${inventory.quantity}, need ${quantity}`);
    }
  }

  const [trade] = await db
    .insert(trades)
    .values({
      seasonId: data.seasonId,
      proposerId: data.proposerId,
      recipientId: data.recipientId,
      proposerTribeId: data.proposerTribeId || null,
      recipientTribeId: data.recipientTribeId || null,
      resourcesOfferedJson: data.resourcesOfferedJson,
      resourcesRequestedJson: data.resourcesRequestedJson,
      message: data.message || null,
      status: "pending",
    })
    .returning();

  return trade;
}

export async function acceptTrade(tradeId: string) {
  const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  if (!trade) {
    throw new Error("Trade not found");
  }
  if (trade.status !== "pending") {
    throw new Error(`Trade is ${trade.status}, cannot accept`);
  }

  // Verify recipient has the resources they're offering (requested by proposer)
  for (const [resourceId, quantity] of Object.entries(trade.resourcesRequestedJson as Record<string, number>)) {
    const inventory = await getOrCreateInventory({
      seasonId: trade.seasonId,
      resourceId,
      playerId: trade.recipientTribeId ? undefined : trade.recipientId,
      tribeId: trade.recipientTribeId || undefined,
    });
    if (inventory.quantity < quantity) {
      throw new Error(`Recipient insufficient ${resourceId}: have ${inventory.quantity}, need ${quantity}`);
    }
  }

  // Execute the trade: transfer resources
  // Transfer from proposer to recipient (resourcesOffered)
  for (const [resourceId, quantity] of Object.entries(trade.resourcesOfferedJson as Record<string, number>)) {
    // Remove from proposer
    await updateInventory({
      inventoryId: (
        await getOrCreateInventory({
          seasonId: trade.seasonId,
          resourceId,
          playerId: trade.proposerTribeId ? undefined : trade.proposerId,
          tribeId: trade.proposerTribeId || undefined,
        })
      ).id,
      quantityDelta: -quantity,
      reason: "trade_offer",
      relatedEntityType: "trade",
      relatedEntityId: tradeId,
    });

    // Add to recipient
    await updateInventory({
      inventoryId: (
        await getOrCreateInventory({
          seasonId: trade.seasonId,
          resourceId,
          playerId: trade.recipientTribeId ? undefined : trade.recipientId,
          tribeId: trade.recipientTribeId || undefined,
        })
      ).id,
      quantityDelta: quantity,
      reason: "trade_receive",
      relatedEntityType: "trade",
      relatedEntityId: tradeId,
    });
  }

  // Transfer from recipient to proposer (resourcesRequested)
  for (const [resourceId, quantity] of Object.entries(trade.resourcesRequestedJson as Record<string, number>)) {
    // Remove from recipient
    await updateInventory({
      inventoryId: (
        await getOrCreateInventory({
          seasonId: trade.seasonId,
          resourceId,
          playerId: trade.recipientTribeId ? undefined : trade.recipientId,
          tribeId: trade.recipientTribeId || undefined,
        })
      ).id,
      quantityDelta: -quantity,
      reason: "trade_offer",
      relatedEntityType: "trade",
      relatedEntityId: tradeId,
    });

    // Add to proposer
    await updateInventory({
      inventoryId: (
        await getOrCreateInventory({
          seasonId: trade.seasonId,
          resourceId,
          playerId: trade.proposerTribeId ? undefined : trade.proposerId,
          tribeId: trade.proposerTribeId || undefined,
        })
      ).id,
      quantityDelta: quantity,
      reason: "trade_receive",
      relatedEntityType: "trade",
      relatedEntityId: tradeId,
    });
  }

  // Update trade status
  const [updated] = await db
    .update(trades)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(trades.id, tradeId))
    .returning();

  return updated;
}

export async function rejectTrade(tradeId: string) {
  const [updated] = await db
    .update(trades)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
    })
    .where(eq(trades.id, tradeId))
    .returning();

  return updated;
}

export async function cancelTrade(tradeId: string, playerId: string) {
  const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  if (!trade) {
    throw new Error("Trade not found");
  }
  if (trade.proposerId !== playerId) {
    throw new Error("Only proposer can cancel trade");
  }
  if (trade.status !== "pending") {
    throw new Error(`Trade is ${trade.status}, cannot cancel`);
  }

  const [updated] = await db
    .update(trades)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(trades.id, tradeId))
    .returning();

  return updated;
}

export async function getTrades(seasonId: string, filters?: { playerId?: string; status?: string }) {
  const conditions = [eq(trades.seasonId, seasonId)];

  if (filters?.playerId) {
    conditions.push(or(eq(trades.proposerId, filters.playerId), eq(trades.recipientId, filters.playerId)));
  }
  if (filters?.status) {
    conditions.push(eq(trades.status, filters.status as any));
  }

  return await db.select().from(trades).where(and(...conditions)).orderBy(desc(trades.createdAt));
}

// ========== Crafting Functions ==========

export async function getRecipes(seasonId: string, filters?: { status?: string; playerId?: string }) {
  const conditions = [eq(craftingRecipes.seasonId, seasonId)];

  if (filters?.status) {
    conditions.push(eq(craftingRecipes.status, filters.status as any));
  }

  return await db.select().from(craftingRecipes).where(and(...conditions)).orderBy(desc(craftingRecipes.createdAt));
}

export async function craftItem(
  recipeId: string,
  playerId: string,
  seasonId: string,
  tribeId?: string
) {
  const [recipe] = await db
    .select()
    .from(craftingRecipes)
    .where(eq(craftingRecipes.id, recipeId))
    .limit(1);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // Verify player has required resources
  const inputs = recipe.inputsJson as Record<string, number>;
  for (const [resourceId, quantity] of Object.entries(inputs)) {
    const inventory = await getOrCreateInventory({
      seasonId,
      resourceId,
      playerId: tribeId ? undefined : playerId,
      tribeId,
    });
    if (inventory.quantity < quantity) {
      throw new Error(`Insufficient ${resourceId}: have ${inventory.quantity}, need ${quantity}`);
    }
  }

  // Consume inputs
  for (const [resourceId, quantity] of Object.entries(inputs)) {
    await updateInventory({
      inventoryId: (
        await getOrCreateInventory({
          seasonId,
          resourceId,
          playerId: tribeId ? undefined : playerId,
          tribeId,
        })
      ).id,
      quantityDelta: -quantity,
      reason: "crafting",
      relatedEntityType: "action",
      relatedEntityId: recipeId,
    });
  }

  // Produce outputs
  const outputs = recipe.outputsJson as Record<string, number>;
  for (const [resourceId, quantity] of Object.entries(outputs)) {
    await updateInventory({
      inventoryId: (
        await getOrCreateInventory({
          seasonId,
          resourceId,
          playerId: tribeId ? undefined : playerId,
          tribeId,
        })
      ).id,
      quantityDelta: quantity,
      reason: "crafting",
      relatedEntityType: "action",
      relatedEntityId: recipeId,
    });
  }

  return { recipe, outputs };
}
