import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/app/_server/auth";
import { acceptTrade, rejectTrade } from "@/app/_server/db/helpers";
import { TradeAcceptSchema } from "@schemas";
import { handleApiError } from "@/app/_server/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tradeId, action } = body; // action: "accept" | "reject"

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
    if (player.id !== trade.recipientId) {
      return NextResponse.json({ error: "Only recipient can accept/reject trade" }, { status: 403 });
    }

    if (action === "accept") {
      const updated = await acceptTrade(tradeId);
      return NextResponse.json({ ok: true, trade: updated });
    } else if (action === "reject") {
      const updated = await rejectTrade(tradeId);
      return NextResponse.json({ ok: true, trade: updated });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

