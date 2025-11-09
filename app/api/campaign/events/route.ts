import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireGM } from "@/app/_server/auth";
import { CampaignEventSchema, CampaignEventListSchema } from "@schemas";
import { createCampaignEvent, getCampaignEvents } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const params = CampaignEventListSchema.parse({
      seasonId: searchParams.get("seasonId"),
      status: searchParams.get("status") || "all",
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    });

    const events = await getCampaignEvents(params.seasonId, { status: params.status });
    return NextResponse.json({ events: events.slice(params.offset, params.offset + params.limit) });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Campaign events list error:", error);
    return NextResponse.json({ error: "Failed to list campaign events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CampaignEventSchema.parse(body);

    // Require GM permissions
    const gmPlayer = await requireGM(data.seasonId);

    const event = await createCampaignEvent({
      seasonId: data.seasonId,
      type: data.type,
      title: data.title,
      description: data.description,
      scheduledDay: data.scheduledDay,
      scheduledPhase: data.scheduledPhase,
      payloadJson: data.payloadJson,
      statEffectsJson: data.statEffectsJson as Record<string, Record<string, number>> | undefined,
      triggeredBy: data.scheduledDay ? undefined : gmPlayer.id, // Auto-trigger if not scheduled
    });

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Campaign event create error:", error);
    return NextResponse.json({ error: "Failed to create campaign event" }, { status: 500 });
  }
}
