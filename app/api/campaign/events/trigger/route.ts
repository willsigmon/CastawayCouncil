import { NextRequest, NextResponse } from "next/server";
import { requireGM } from "@/app/_server/auth";
import { GMTriggerEventSchema } from "@schemas";
import { triggerCampaignEvent } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";
import { db } from "@/app/_server/db/client";
import { campaignEvents } from "@/app/_server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = GMTriggerEventSchema.parse(body);

    // Get event to find seasonId
    const [event] = await db.select().from(campaignEvents).where(eq(campaignEvents.id, data.eventId)).limit(1);
    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    // Require GM permissions
    const gmPlayer = await requireGM(event.seasonId);
    const triggeredEvent = await triggerCampaignEvent(data.eventId, gmPlayer.id);

    return NextResponse.json({ event: triggeredEvent });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Trigger campaign event error:", error);
    return NextResponse.json({ error: "Failed to trigger campaign event" }, { status: 500 });
  }
}
