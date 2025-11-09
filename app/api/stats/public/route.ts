import { NextResponse } from "next/server";
import {
    getActivePlayersCount,
    getTotalSeasonsCount,
    getTotalVotesCount,
    getMessagesCountToday,
} from "@/server/analytics/queries";

// Cache for 60 seconds with stale-while-revalidate
export const revalidate = 60;

export async function GET() {
    try {
        const [activePlayers, totalSeasons, totalVotes, messagesToday] = await Promise.all([
            getActivePlayersCount(),
            getTotalSeasonsCount(),
            getTotalVotesCount(),
            getMessagesCountToday(),
        ]);

        return NextResponse.json({
            activePlayers,
            totalSeasons,
            totalVotes,
            messagesToday,
        });
    } catch (error) {
        console.error("Failed to fetch public stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
