import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { getRecipes } from "@/app/_server/db/helpers";
import { handleApiError } from "@/app/_server/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId");
    const status = searchParams.get("status");

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    const recipes = await getRecipes(seasonId, { status: status || undefined });
    return NextResponse.json({ ok: true, recipes });
  } catch (error) {
    return handleApiError(error);
  }
}

