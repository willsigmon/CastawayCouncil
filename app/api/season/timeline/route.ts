import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { ApiError } from "@/app/_server/errors";

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");

  if (!seasonId) throw new ApiError("seasonId required", 400);

  // Placeholder: In production, this would query season_schedule table
  // For now, return mock timeline data
  const events = [
    {
      episode: 1,
      phase: "camp" as const,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      status: "current" as const,
    },
    {
      episode: 1,
      phase: "challenge" as const,
      startsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: "future" as const,
    },
    {
      episode: 1,
      phase: "tribal" as const,
      startsAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      status: "future" as const,
    },
  ];

  return NextResponse.json({ ok: true, events });
}
