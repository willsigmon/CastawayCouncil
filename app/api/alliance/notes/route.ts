import { requireAuth } from "@/app/_server/auth";
import { db } from "@/app/_server/db/client";
import { allianceNotes } from "@/app/_server/db/schema";
import { ApiError } from "@/app/_server/errors";
import { AllianceNoteSchema } from "@schemas";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await requireAuth();
  const body = await req.json();
  const data = AllianceNoteSchema.omit({ id: true }).parse(body);

  const [note] = await db
    .insert(allianceNotes)
    .values({
      seasonId: data.seasonId,
      authorId: data.authorId,
      subjectPlayerId: data.subjectPlayerId,
      note: data.note,
      trustLevel: data.trustLevel,
      tags: data.tags,
      pinned: data.pinned,
    })
    .returning();

  return NextResponse.json({ ok: true, note });
}

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");
  const authorId = searchParams.get("authorId");

  if (!seasonId || !authorId) {
    throw new ApiError("seasonId and authorId required", 400);
  }

  const notes = await db
    .select()
    .from(allianceNotes)
    .where(and(eq(allianceNotes.seasonId, seasonId), eq(allianceNotes.authorId, authorId)));

  return NextResponse.json({ ok: true, notes });
}
