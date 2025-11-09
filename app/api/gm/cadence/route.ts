import { NextRequest, NextResponse } from "next/server";
import { requireGM } from "@/app/_server/auth";
import { GMCadenceControlSchema } from "@schemas";
import { ApiError } from "@/app/_server/errors";
import { db } from "@/app/_server/db/client";
import { seasons, events } from "@/app/_server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = GMCadenceControlSchema.parse(body);

    // Require GM permissions
    await requireGM(data.seasonId);
    const [season] = await db.select().from(seasons).where(eq(seasons.id, data.seasonId)).limit(1);
    if (!season) {
      throw new ApiError("Season not found", 404);
    }

    // Emit cadence control event
    await db.insert(events).values({
      seasonId: data.seasonId,
      day: season.dayIndex,
      kind: "phase_open", // Reuse existing event kind
      payloadJson: {
        gmAction: data.action,
        phase: data.phase,
        durationMs: data.durationMs,
      },
    });

    // TODO: Actually pause/resume Temporal workflow
    // This would require Temporal client integration

    return NextResponse.json({ success: true, action: data.action });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] GM cadence control error:", error);
    return NextResponse.json({ error: "Failed to control cadence" }, { status: 500 });
  }
}
