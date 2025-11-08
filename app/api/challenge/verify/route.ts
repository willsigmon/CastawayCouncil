import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { challenges } from "@/app/_server/db/schema";
import { ApiError } from "@/app/_server/errors";
import { VerifyChallengeSchema } from "@schemas";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await requireAuth();
  const body = await req.json();
  const { challengeId } = VerifyChallengeSchema.parse(body);

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId));

  if (!challenge) throw new ApiError("Challenge not found", 404);
  if (!challenge.serverSeed) throw new ApiError("Seeds not yet revealed", 400);

  // Verify server seed matches commit
  const computedHash = createHash("sha256").update(challenge.serverSeed).digest("hex");
  const isValid = computedHash === challenge.seedCommit;

  return NextResponse.json({
    ok: true,
    challengeId,
    isValid,
    seedCommit: challenge.seedCommit,
    serverSeed: challenge.serverSeed,
    clientSeeds: challenge.clientSeedsJson,
  });
}
