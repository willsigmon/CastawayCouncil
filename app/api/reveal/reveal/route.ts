import { NextRequest, NextResponse } from "next/server";
import { requireGM } from "@/app/_server/auth";
import { RevealRevealSchema } from "@schemas";
import { revealContent } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";
import { db } from "@/app/_server/db/client";
import { reveals } from "@/app/_server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = RevealRevealSchema.parse(body);

    // Get reveal to find seasonId and verify commit hash
    const [reveal] = await db.select().from(reveals).where(eq(reveals.id, data.revealId)).limit(1);
    if (!reveal) {
      throw new ApiError("Reveal not found", 404);
    }

    // Verify commit hash matches reveal content
    if (reveal.commitHash) {
      const contentHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(data.revealContentJson))
        .digest("hex");
      if (contentHash !== reveal.commitHash) {
        throw new ApiError("Reveal content does not match commit hash", 400);
      }
    }

    // Require GM permissions
    const gmPlayer = await requireGM(reveal.seasonId);
    const revealed = await revealContent(data.revealId, data.revealContentJson, gmPlayer.id);

    return NextResponse.json({ reveal: revealed });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Reveal content error:", error);
    return NextResponse.json({ error: "Failed to reveal content" }, { status: 500 });
  }
}
