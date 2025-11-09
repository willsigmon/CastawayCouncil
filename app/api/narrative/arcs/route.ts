import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { getNarrativeArcs } from "@/app/_server/db/helpers";
import { handleApiError } from "@/app/_server/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");
    const playerId = searchParams.get("playerId");
    const isActive = searchParams.get("isActive");

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    const arcs = await getNarrativeArcs(seasonId, {
      playerId: playerId || undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    });

    return NextResponse.json({ ok: true, arcs });
  } catch (error) {
    return handleApiError(error);
  }
}

