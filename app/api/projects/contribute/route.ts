import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/app/_server/auth";
import { ProjectContributionSchema } from "@schemas";
import { contributeToProject } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";
import { db } from "@/app/_server/db/client";
import { seasons, projects } from "@/app/_server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ProjectContributionSchema.parse(body);

    // Get project to find season
    const [project] = await db.select().from(projects).where(eq(projects.id, data.projectId)).limit(1);
    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    const player = await getCurrentPlayer(project.seasonId);
    const [season] = await db.select().from(seasons).where(eq(seasons.id, project.seasonId)).limit(1);
    if (!season) {
      throw new ApiError("Season not found", 404);
    }

    const result = await contributeToProject(data.projectId, player.id, season.dayIndex, {
      resourcesContributedJson: data.resourcesContributedJson as Record<string, number> | undefined,
      progressAdded: data.progressAdded,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Project contribution error:", error);
    return NextResponse.json({ error: "Failed to contribute to project" }, { status: 500 });
  }
}
