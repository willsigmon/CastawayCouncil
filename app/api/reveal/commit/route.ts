import { NextRequest, NextResponse } from "next/server";
import { requireGM } from "@/app/_server/auth";
import { RevealCommitSchema } from "@schemas";
import { commitReveal, getReveals } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";
import { db } from "@/app/_server/db/client";
import { reveals } from "@/app/_server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RevealCommitSchema.parse(body);

    // Get reveal to find seasonId
    const [reveal] = await db.select().from(reveals).where(eq(reveals.id, data.revealId)).limit(1);
    if (!reveal) {
      throw new ApiError("Reveal not found", 404);
    }

    // Require GM permissions
    await requireGM(reveal.seasonId);
    const committedReveal = await commitReveal(data.revealId, data.commitHash);

    return NextResponse.json({ reveal: committedReveal });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Commit reveal error:", error);
    return NextResponse.json({ error: "Failed to commit reveal" }, { status: 500 });
  }
}
