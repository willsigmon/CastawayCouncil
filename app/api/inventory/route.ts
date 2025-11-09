import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_server/auth";
import { InventoryListSchema, InventoryUpdateSchema } from "@schemas";
import { getInventory, updateInventory } from "@/app/_server/db/helpers";
import { ApiError } from "@/app/_server/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const params = InventoryListSchema.parse({
      seasonId: searchParams.get("seasonId"),
      tribeId: searchParams.get("tribeId") || undefined,
      playerId: searchParams.get("playerId") || undefined,
    });

    if (!params.tribeId && !params.playerId) {
      throw new ApiError("Must provide either tribeId or playerId", 400);
    }

    const inventory = await getInventory(params.seasonId, {
      tribeId: params.tribeId,
      playerId: params.playerId,
    });

    return NextResponse.json({ inventory });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Inventory list error:", error);
    return NextResponse.json({ error: "Failed to list inventory" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const data = InventoryUpdateSchema.parse(body);

    const inventory = await updateInventory(
      data.inventoryId,
      data.quantityDelta,
      data.reason,
      {
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
      }
    );

    return NextResponse.json({ inventory });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[API] Update inventory error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
