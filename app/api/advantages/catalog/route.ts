import { requireAuth } from "@/app/_server/auth";
import { NextRequest, NextResponse } from "next/server";

const ADVANTAGE_TYPES = [
  {
    id: "immunity-idol",
    name: "Hidden Immunity Idol",
    description: "Play before votes are read. Nullifies all votes against you.",
    icon: "💎",
    rarity: "rare",
  },
  {
    id: "extra-vote",
    name: "Extra Vote",
    description: "Cast two votes at one Tribal Council.",
    icon: "📜",
    rarity: "uncommon",
  },
  {
    id: "vote-steal",
    name: "Vote Steal",
    description: "Steal another player's vote. They cannot vote.",
    icon: "🎯",
    rarity: "rare",
  },
  {
    id: "knowledge-is-power",
    name: "Knowledge is Power",
    description: "Ask a player if they have an advantage. If yes, take it.",
    icon: "🔍",
    rarity: "legendary",
  },
] as const;

export async function GET(_req: NextRequest) {
  await requireAuth();
  return NextResponse.json({ ok: true, advantages: ADVANTAGE_TYPES });
}
