import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/app/_server/auth";
import { craftItem } from "@/app/_server/db/helpers";
import { CraftItemSchema } from "@schemas";
import { handleApiError } from "@/app/_server/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CraftItemSchema.parse(body);

    const player = await getCurrentPlayer(data.seasonId);
    const result = await craftItem(data.recipeId, player.id, data.seasonId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return handleApiError(error);
  }
}

