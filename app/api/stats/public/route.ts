import { NextResponse } from "next/server";
import {
    getActivePlayersCount,
    getTotalSeasonsCount,
    getTotalVotesCount,
    getMessagesCountToday,
} from "@/app/_server/analytics/queries";

// Cache for 60 seconds with stale-while-revalidate
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Use Promise.allSettled to prevent one failure from crashing the entire request
        const results = await Promise.allSettled([
            getActivePlayersCount(),
            getTotalSeasonsCount(),
            getTotalVotesCount(),
            getMessagesCountToday(),
        ]);

        // Helper to extract value or log error and return 0
        const getValue = (result: PromiseSettledResult<number>, name: string) => {
            if (result.status === "fulfilled") {
                return result.value;
            } else {
                console.error(`Failed to fetch ${name}:`, result.reason);
                return 0;
            }
        };

        const activePlayers = getValue(results[0], "activePlayers");
        const totalSeasons = getValue(results[1], "totalSeasons");
        const totalVotes = getValue(results[2], "totalVotes");
        const messagesToday = getValue(results[3], "messagesToday");

        return NextResponse.json({
            activePlayers,
            totalSeasons,
            totalVotes,
            messagesToday,
        });
    } catch (error) {
        // This catch block handles errors outside of the individual queries (unlikely with Promise.allSettled)
        console.error("Critical failure in public stats API:", error);
        return NextResponse.json(
            {
                activePlayers: 0,
                totalSeasons: 0,
                totalVotes: 0,
                messagesToday: 0
            },
            { status: 200 } // Return 200 with zeroed stats to prevent frontend crash
        );
    }
}
