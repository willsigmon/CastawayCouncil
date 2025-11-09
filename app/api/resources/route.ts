import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { resources } from "@/app/_server/db/schema";
import { eq, and } from "drizzle-orm";
import { handleApiError } from "@/app/_server/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");
    const type = searchParams.get("type");

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    const conditions = [eq(resources.seasonId, seasonId)];
    if (type) {
      conditions.push(eq(resources.type, type as any));
    }

    const allResources = await db
      .select()
      .from(resources)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    return NextResponse.json({ ok: true, resources: allResources });
  } catch (error) {
    return handleApiError(error);
  }
}

