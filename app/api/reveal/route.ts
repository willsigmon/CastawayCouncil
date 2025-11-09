import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireGM } from "@/app/_server/auth";
import { RevealSchema, RevealListSchema } from "@schemas";
import { createReveal, getReveals } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const params = RevealListSchema.parse({
      seasonId: searchParams.get("seasonId"),
      status: searchParams.get("status"),
    });

    const reveals = await getReveals(params.seasonId, { status: params.status });
    return NextResponse.json({ reveals });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Reveals list error:", error);
    return NextResponse.json({ error: "Failed to list reveals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RevealSchema.parse(body);

    // Require GM permissions
    await requireGM(data.seasonId);

    const reveal = await createReveal({
      seasonId: data.seasonId,
      type: data.type,
      title: data.title,
      description: data.description,
      scheduledDay: data.scheduledDay,
      scheduledPhase: data.scheduledPhase,
    });

    return NextResponse.json({ reveal });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Create reveal error:", error);
    return NextResponse.json({ error: "Failed to create reveal" }, { status: 500 });
  }
}
