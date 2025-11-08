import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { juryQuestions } from "@/app/_server/db/schema";
import { ApiError } from "@/app/_server/errors";
import { JuryQuestionSchema } from "@schemas";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await requireAuth();
  const body = await req.json();
  const data = JuryQuestionSchema.omit({ id: true, answeredAt: true }).parse(body);

  const [question] = await db
    .insert(juryQuestions)
    .values({
      seasonId: data.seasonId,
      jurorId: data.jurorId,
      finalistId: data.finalistId,
      question: data.question,
    })
    .returning();

  return NextResponse.json({ ok: true, question });
}

export async function PATCH(req: NextRequest) {
  await requireAuth();
  const { id, answer } = await req.json();

  if (!id || !answer) {
    throw new ApiError("id and answer required", 400);
  }

  const [question] = await db
    .select()
    .from(juryQuestions)
    .where(eq(juryQuestions.id, id));

  if (!question) throw new ApiError("Question not found", 404);

  const [updated] = await db
    .update(juryQuestions)
    .set({ answer, answeredAt: new Date() })
    .where(eq(juryQuestions.id, id))
    .returning();

  return NextResponse.json({ ok: true, question: updated });
}

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");

  if (!seasonId) throw new ApiError("seasonId required", 400);

  const questions = await db
    .select()
    .from(juryQuestions)
    .where(eq(juryQuestions.seasonId, seasonId));

  return NextResponse.json({ ok: true, questions });
}
