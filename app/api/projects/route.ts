import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireGM, getCurrentPlayer } from "@/app/_server/auth";
import { ProjectSchema, ProjectListSchema } from "@schemas";
import { createProject, getProjects } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const params = ProjectListSchema.parse({
      seasonId: searchParams.get("seasonId"),
      tribeId: searchParams.get("tribeId") || undefined,
      playerId: searchParams.get("playerId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const projects = await getProjects(params.seasonId, {
      tribeId: params.tribeId,
      playerId: params.playerId,
      status: params.status,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Projects list error:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ProjectSchema.parse(body);

    // Check permissions: players can create own projects, GM can create any
    const player = await getCurrentPlayer(data.seasonId);
    const isGM = player.isGM;

    // If creating for another player/tribe, require GM
    if ((data.playerId && data.playerId !== player.id) || (data.tribeId && !isGM)) {
      await requireGM(data.seasonId);
    }

    const project = await createProject({
      seasonId: data.seasonId,
      tribeId: data.tribeId,
      playerId: data.playerId,
      name: data.name,
      description: data.description,
      targetProgress: data.targetProgress,
      requiredResourcesJson: data.requiredResourcesJson as Record<string, number> | undefined,
      completionRewardsJson: data.completionRewardsJson as { statDeltas?: Record<string, number>; items?: string[] } | undefined,
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
