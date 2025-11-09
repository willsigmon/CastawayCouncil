import type { SeasonWorkflowInput } from "./workflows";
import { db } from "../../app/_server/db/client";
import {
  challenges,
  votes,
  events,
  players,
  tribes,
  tribeMembers,
  pushSubscriptions,
  items,
  campaignEvents,
  projects,
  projectContributions,
  resources,
  inventories,
  reveals,
} from "../../app/_server/db/schema";
import { eq, and, sql, isNull, desc, lt, gt } from "drizzle-orm";
import webpush from "web-push";
import { triggerCampaignEvent, getCampaignEvents } from "../../app/_server/db/helpers";

// Configure webpush with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function emitPush(input: {
  seasonId: string;
  type: string;
  phase?: string;
  day?: number;
  closesAt?: string;
  campaignEventId?: string;
  projectId?: string;
  revealId?: string;
  resourceExpiration?: boolean;
}): Promise<void> {
  try {
    // Emit phase_open event to DB if this is a phase event
    if (input.type === "phase_open" && input.phase && input.day) {
      await db.insert(events).values({
        seasonId: input.seasonId,
        day: input.day,
        kind: "phase_open",
        payloadJson: {
          phase: input.phase,
          opensAt: new Date().toISOString(),
          closesAt: input.closesAt,
        },
      });
    }

    // Get target users based on notification type
    let userIds: string[] = [];

    if (input.type === "campaign_event" && input.campaignEventId) {
      // Campaign events: notify all season players
      const seasonPlayers = await db
        .select({ userId: players.userId })
        .from(players)
        .where(eq(players.seasonId, input.seasonId));
      userIds = seasonPlayers.map((p) => p.userId);
    } else if (input.type === "project_completed" && input.projectId) {
      // Project completion: notify project contributors
      const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (project) {
        const contributors = await db
          .select({ playerId: projectContributions.playerId })
          .from(projectContributions)
          .where(eq(projectContributions.projectId, input.projectId));
        if (contributors.length > 0) {
          const contributorIds = contributors.map((c) => c.playerId);
          const contributorPlayers = await db
            .select({ userId: players.userId })
            .from(players)
            .where(sql`${players.id} = ANY(${contributorIds})`);
          userIds = contributorPlayers.map((p) => p.userId);
        }
      }
    } else if (input.type === "reveal_revealed" && input.revealId) {
      // Reveals: notify all season players
      const seasonPlayers = await db
        .select({ userId: players.userId })
        .from(players)
        .where(eq(players.seasonId, input.seasonId));
      userIds = seasonPlayers.map((p) => p.userId);
    } else if (input.type === "resource_expiration") {
      // Resource expiration: notify inventory owners
      const expiredInventories = await db
        .select({ playerId: inventories.playerId, tribeId: inventories.tribeId })
        .from(inventories)
        .where(eq(inventories.seasonId, input.seasonId));
      const ownerIds = expiredInventories
        .map((inv) => inv.playerId || inv.tribeId)
        .filter((id): id is string => !!id);
      if (ownerIds.length > 0) {
        const owners = await db
          .select({ userId: players.userId })
          .from(players)
          .where(sql`${players.id} = ANY(${ownerIds})`);
        userIds = owners.map((p) => p.userId);
      }
    } else {
      // Default: all season players
    const seasonPlayers = await db
      .select({ userId: players.userId })
      .from(players)
      .where(eq(players.seasonId, input.seasonId));
      userIds = seasonPlayers.map((p) => p.userId);
    }

    if (userIds.length === 0) return;

    // Get push subscriptions for these users
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(sql`${pushSubscriptions.userId} = ANY(${userIds})`);

    // Build notification payload based on type with action buttons
    let notificationPayload: {
      title: string;
      body: string;
      icon: string;
      data?: Record<string, unknown>;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    } = {
      title: "Castaway Council",
      body: "Update available",
      icon: "/icon-192x192.png",
    };

    if (input.type === "campaign_event" && input.campaignEventId) {
      const [event] = await db
        .select()
        .from(campaignEvents)
        .where(eq(campaignEvents.id, input.campaignEventId))
        .limit(1);
      if (event) {
        const eventIcons: Record<string, string> = {
          storm: "⛈️",
          supply_drop: "📦",
          wildlife_encounter: "🐍",
          tribe_swap: "🔄",
          exile_island: "🏝️",
          reward_challenge: "🎁",
          immunity_idol_clue: "💎",
          social_twist: "🎭",
          resource_discovery: "💎",
        };
        notificationPayload = {
          title: `${eventIcons[event.type] || "✨"} ${event.title}`,
          body: event.description,
          icon: "/icon-192x192.png",
          data: { type: "campaign_event", eventId: event.id, url: `/season/${input.seasonId}/log` },
          actions: [
            { action: "view", title: "View Event", icon: "/icon-192x192.png" },
            { action: "dismiss", title: "Dismiss" },
          ],
        };
      }
    } else if (input.type === "project_completed" && input.projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (project) {
        notificationPayload = {
          title: "🔨 Project Completed!",
          body: `${project.name} has been completed!`,
          icon: "/icon-192x192.png",
          data: { type: "project_completed", projectId: project.id, url: `/season/${input.seasonId}` },
          actions: [
            { action: "view", title: "View Project", icon: "/icon-192x192.png" },
            { action: "dismiss", title: "Dismiss" },
          ],
        };
      }
    } else if (input.type === "reveal_revealed" && input.revealId) {
      const [reveal] = await db.select().from(reveals).where(eq(reveals.id, input.revealId)).limit(1);
      if (reveal) {
        notificationPayload = {
          title: "💎 Reveal!",
          body: `${reveal.title} has been revealed!`,
          icon: "/icon-192x192.png",
          data: { type: "reveal_revealed", revealId: reveal.id, url: `/season/${input.seasonId}/gm` },
          actions: [
            { action: "view", title: "View Reveal", icon: "/icon-192x192.png" },
            { action: "dismiss", title: "Dismiss" },
          ],
        };
      }
    } else if (input.type === "resource_expiration") {
      notificationPayload = {
        title: "⚠️ Resource Expiring",
        body: "Some of your resources are about to expire!",
        icon: "/icon-192x192.png",
        data: { type: "resource_expiration", url: `/season/${input.seasonId}` },
        actions: [
          { action: "view", title: "Check Inventory", icon: "/icon-192x192.png" },
          { action: "dismiss", title: "Dismiss" },
        ],
      };
    } else if (input.type === "phase_open" && input.phase) {
      notificationPayload = {
        title: `Phase: ${input.phase}`,
        body: `${input.phase} phase started`,
        icon: "/icon-192x192.png",
        data: { type: "phase_open", phase: input.phase, url: `/season/${input.seasonId}` },
        actions: [
          { action: "view", title: "View Season", icon: "/icon-192x192.png" },
          { action: "dismiss", title: "Dismiss" },
        ],
      };
    }

    // Send notifications
    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(notificationPayload)
        );
      } catch (error) {
        // Ignore failed notifications (expired subscriptions, etc.)
        console.error(`Failed to send push to ${sub.endpoint}:`, error);
      }
    });

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error("[Activity] Emit push error:", error);
  }
}

export async function scoreChallenge(input: { seasonId: string; day: number }): Promise<void> {
  try {
    // Find challenge for this day
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.seasonId, input.seasonId),
          eq(challenges.day, input.day)
        )
      )
      .limit(1);

    if (!challenge) {
      throw new Error(`Challenge not found for season ${input.seasonId}, day ${input.day}`);
    }

    // Call the score API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/challenge/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: challenge.id }),
    });

    if (!response.ok) {
      throw new Error(`Failed to score challenge: ${response.statusText}`);
    }
  } catch (error) {
    console.error("[Activity] Score challenge error:", error);
    throw error;
  }
}

export async function tallyVotes(input: { seasonId: string; day: number }): Promise<void> {
  try {
    // Get all votes for this day
    const dayVotes = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.seasonId, input.seasonId),
          eq(votes.day, input.day)
        )
      );

    // Get active players (not eliminated)
    const activePlayers = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.seasonId, input.seasonId),
          isNull(players.eliminatedAt)
        )
      );

    // Count votes per target
    const voteCounts: Record<string, number> = {};
    for (const vote of dayVotes) {
      voteCounts[vote.targetPlayerId] = (voteCounts[vote.targetPlayerId] || 0) + 1;
    }

    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayerId: string | null = null;
    const tiedPlayers: string[] = [];

    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayerId = playerId;
        tiedPlayers.length = 0;
        tiedPlayers.push(playerId);
      } else if (count === maxVotes) {
        tiedPlayers.push(playerId);
      }
    }

    // Handle ties: for MVP, eliminate first tied player (in production, would trigger revote/fire-making)
    if (tiedPlayers.length > 1) {
      eliminatedPlayerId = tiedPlayers[0];
    }

    if (!eliminatedPlayerId) {
      throw new Error("No votes to tally");
    }

    // Eliminate player and reveal votes
    await db.transaction(async (tx) => {
      await tx
        .update(players)
        .set({ eliminatedAt: new Date() })
        .where(eq(players.id, eliminatedPlayerId!));

      await tx
        .update(votes)
        .set({ revealedAt: new Date() })
        .where(
          and(
            eq(votes.seasonId, input.seasonId),
            eq(votes.day, input.day)
          )
        );

      await tx.insert(events).values({
        seasonId: input.seasonId,
        day: input.day,
        kind: "eliminate",
        payloadJson: {
          playerId: eliminatedPlayerId,
          voteCounts,
        },
      });
    });
  } catch (error) {
    console.error("[Activity] Tally votes error:", error);
    throw error;
  }
}

export async function mergeTribes(input: { seasonId: string }): Promise<void> {
  try {
    // Get all active tribes
    const activeTribes = await db
      .select()
      .from(tribes)
      .where(eq(tribes.seasonId, input.seasonId));

    if (activeTribes.length <= 1) {
      return; // Already merged or only one tribe
    }

    // Create merged tribe (use first tribe as base)
    const mergedTribe = activeTribes[0];

    // Move all players from other tribes to merged tribe
    const otherTribeIds = activeTribes.slice(1).map((t) => t.id);

    await db.transaction(async (tx) => {
      // Update tribe memberships
      for (const tribeId of otherTribeIds) {
        await tx
          .update(tribeMembers)
          .set({ tribeId: mergedTribe.id })
          .where(eq(tribeMembers.tribeId, tribeId));
      }

      // Emit merge event
      await tx.insert(events).values({
        seasonId: input.seasonId,
        day: 10, // Merge happens at day 10
        kind: "merge",
        payloadJson: {
          mergedTribeId: mergedTribe.id,
          mergedTribes: otherTribeIds,
        },
      });
    });
  } catch (error) {
    console.error("[Activity] Merge tribes error:", error);
    throw error;
  }
}

export async function emitDailySummary(input: { seasonId: string; day: number }): Promise<void> {
  try {
    // Get events for this day
    const dayEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.seasonId, input.seasonId),
          eq(events.day, input.day)
        )
      )
      .orderBy(desc(events.createdAt));

    // Create summary
    const summary = {
      day: input.day,
      events: dayEvents.map((e) => ({
        kind: e.kind,
        payload: e.payloadJson,
        timestamp: e.createdAt,
      })),
    };

    // Emit to public log (event is already in DB, Realtime will broadcast)
    await db.insert(events).values({
      seasonId: input.seasonId,
      day: input.day,
      kind: "phase_close",
      payloadJson: {
        phase: "summary",
        summary,
      },
    });
  } catch (error) {
    console.error("[Activity] Daily summary error:", error);
  }
}

// ========== Campaign Event Activities ==========

export async function checkScheduledEvents(input: { seasonId: string; day: number; phase: string }): Promise<void> {
  try {
    // Find events scheduled for this day/phase
    const scheduledEvents = await db
      .select()
      .from(campaignEvents)
      .where(
        and(
          eq(campaignEvents.seasonId, input.seasonId),
          eq(campaignEvents.scheduledDay, input.day),
          eq(campaignEvents.scheduledPhase, input.phase),
          isNull(campaignEvents.triggeredAt)
        )
      );

    // Trigger each scheduled event
    for (const event of scheduledEvents) {
      // Use system trigger (no player ID)
      await triggerCampaignEvent(event.id, null);
    }
  } catch (error) {
    console.error("[Activity] Check scheduled events error:", error);
  }
}

export async function advanceProjects(input: { seasonId: string; day: number }): Promise<void> {
  try {
    // Get active projects
    const activeProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.seasonId, input.seasonId),
          eq(projects.status, "active")
        )
      );

    // TODO: Apply passive progress based on project type, tribe size, etc.
    // For now, this is a placeholder for future automation
    console.log(`[Activity] Advancing ${activeProjects.length} active projects for day ${input.day}`);
  } catch (error) {
    console.error("[Activity] Advance projects error:", error);
  }
}

export async function tickResources(input: { seasonId: string; day: number }): Promise<void> {
  try {
    const { updateInventory, getOrCreateInventory } = await import("../../app/_server/db/helpers");
    
    // Get all inventories for this season
    const seasonInventories = await db
      .select()
      .from(inventories)
      .where(eq(inventories.seasonId, input.seasonId));

    // Apply maintenance costs (shelter maintenance, tool degradation, food/water consumption)
    for (const inventory of seasonInventories) {
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, inventory.resourceId))
        .limit(1);

      if (!resource) continue;

      // Daily maintenance costs based on resource type
      let maintenanceCost = 0;
      if (resource.type === "materials" && inventory.quantity > 0) {
        // Shelter maintenance: consume 1 material per day per 10 materials
        maintenanceCost = Math.ceil(inventory.quantity / 10);
      } else if (resource.type === "tools" && inventory.quantity > 0) {
        // Tool degradation: 5% chance per tool to degrade
        const degradationChance = inventory.quantity * 0.05;
        if (Math.random() < degradationChance) {
          maintenanceCost = 1;
        }
      } else if (resource.type === "food" && inventory.quantity > 0) {
        // Food consumption: 1 food per player per day (simplified)
        maintenanceCost = 1;
      } else if (resource.type === "water" && inventory.quantity > 0) {
        // Water consumption: 1 water per player per day
        maintenanceCost = 1;
      }

      if (maintenanceCost > 0 && inventory.quantity >= maintenanceCost) {
        await updateInventory({
          inventoryId: inventory.id,
          quantityDelta: -maintenanceCost,
          reason: "maintenance",
          relatedEntityType: "action",
        });
      }
    }

    // Get perishable resources
    const perishableResources = await db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.seasonId, input.seasonId),
          eq(resources.perishable, true)
        )
      );

    // Check expiration dates and reduce quantities
    const now = new Date();
    for (const resource of perishableResources) {
      if (resource.expiresAt && resource.expiresAt < now) {
        // Reduce inventory quantities for expired resources
        const resourceInventories = await db
          .select()
          .from(inventories)
          .where(eq(inventories.resourceId, resource.id));

        for (const inventory of resourceInventories) {
          if (inventory.quantity > 0) {
            // Reduce by 50% each day after expiration
            const newQuantity = Math.floor(inventory.quantity * 0.5);
            await db
              .update(inventories)
              .set({ quantity: newQuantity, updatedAt: now })
              .where(eq(inventories.id, inventory.id));

            // Emit push notification for resource expiration warning
            if (inventory.quantity > 0 && newQuantity <= inventory.quantity * 0.1) {
              try {
                await emitPush({
                  seasonId: input.seasonId,
                  type: "resource_expiration",
                  resourceExpiration: true,
                });
              } catch (error) {
                console.error("Failed to emit push notification for resource expiration:", error);
              }
            }
          }
        }
      }
    }

    // Check for resource scarcity events (random chance)
    if (Math.random() < 0.1) {
      // 10% chance per day for scarcity event
      await checkResourceScarcity(input.seasonId, input.day);
    }
  } catch (error) {
    console.error("[Activity] Tick resources error:", error);
  }
}

async function checkResourceScarcity(seasonId: string, day: number) {
  try {
    // Randomly select a resource type to become scarce
    const resourceTypes = ["food", "water", "materials", "tools", "medicine"];
    const scarceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

    // Create a scarcity campaign event
    const { createCampaignEvent } = await import("../../app/_server/db/helpers");
    await createCampaignEvent({
      seasonId,
      type: "resource_discovery", // Reuse existing type, could add "scarcity" type
      title: `${scarceType.charAt(0).toUpperCase() + scarceType.slice(1)} Shortage`,
      description: `A shortage of ${scarceType} has been discovered. Players will need to adapt their strategies.`,
      payloadJson: { scarcityType: scarceType, day },
      triggeredBy: null, // System-triggered
    });

    // Emit push notification
    await emitPush({
      seasonId,
      type: "campaign_event",
      day,
      campaignEventId: undefined, // Will be set by createCampaignEvent
    });
  } catch (error) {
    console.error("[Activity] Resource scarcity check error:", error);
  }
}
