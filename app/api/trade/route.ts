import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/app/_server/auth";
import { createTradeOffer, getTrades, cancelTrade } from "@/app/_server/db/helpers";
import { TradeOfferSchema, TradeListSchema } from "@schemas";
import { handleApiError } from "@/app/_server/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = TradeOfferSchema.parse(body);

    const player = await getCurrentPlayer(data.seasonId);
    if (player.id !== data.proposerId) {
      return NextResponse.json({ error: "Cannot create trade for another player" }, { status: 403 });
    }

    const trade = await createTradeOffer(data);
    return NextResponse.json({ ok: true, trade });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = TradeListSchema.parse({
      seasonId: searchParams.get("seasonId"),
      playerId: searchParams.get("playerId") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const player = await getCurrentPlayer(data.seasonId);
    const filters: { playerId?: string; status?: string } = {};
    if (data.playerId) {
      filters.playerId = data.playerId;
    } else {
      filters.playerId = player.id; // Default to current player's trades
    }
    if (data.status) {
      filters.status = data.status;
    }

    const trades = await getTrades(data.seasonId, filters);
    return NextResponse.json({ ok: true, trades });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tradeId = searchParams.get("tradeId");
    if (!tradeId) {
      return NextResponse.json({ error: "tradeId required" }, { status: 400 });
    }

    // Get trade to find seasonId
    const { db } = await import("@/app/_server/db/client");
    const { trades } = await import("@/app/_server/db/schema");
    const { eq } = await import("drizzle-orm");

    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const player = await getCurrentPlayer(trade.seasonId);
    const cancelled = await cancelTrade(tradeId, player.id);
    return NextResponse.json({ ok: true, trade: cancelled });
  } catch (error) {
    return handleApiError(error);
  }
}
