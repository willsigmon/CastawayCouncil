import { db } from '@/drizzle/db';
import { players, seasons, votes, tribeMembers } from '@/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { VoteInterface } from './vote-interface';

interface PageProps {
  params: { seasonId: string };
}

export default async function VotePage({ params }: PageProps) {
  const { seasonId } = params;

  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
  });

  if (!season) {
    return <div className="p-8 text-center">Season not found</div>;
  }

  // Mock player (in real app, get from auth)
  const player = await db.query.players.findFirst({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
    with: {
      tribeMembers: {
        with: {
          tribe: true,
        },
      },
    },
  });

  if (!player) {
    return <div className="p-8 text-center">No active player</div>;
  }

  // Get all eligible targets (tribe mates)
  const tribe = player.tribeMembers[0]?.tribe;
  let eligibleTargets: Array<{ id: string; name: string; handle: string }> = [];

  if (tribe) {
    const tribemates = await db.query.tribeMembers.findMany({
      where: eq(tribeMembers.tribeId, tribe.id),
      with: {
        player: {
          with: {
            user: true,
          },
        },
      },
    });

    eligibleTargets = tribemates
      .filter((m) => !m.player.eliminatedAt && m.player.id !== player.id)
      .map((m) => ({
        id: m.player.id,
        name: m.player.displayName,
        handle: m.player.user.handle,
      }));
  }

  // Check existing vote
  const existingVote = await db.query.votes.findFirst({
    where: and(
      eq(votes.seasonId, seasonId),
      eq(votes.day, season.dayIndex),
      eq(votes.voterPlayerId, player.id)
    ),
  });

  // Mock phase end time (in real app, get from events)
  const voteEndsAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <VoteInterface
        playerId={player.id}
        seasonId={seasonId}
        currentDay={season.dayIndex}
        eligibleTargets={eligibleTargets}
        currentVote={existingVote?.targetPlayerId ?? null}
        voteEndsAt={voteEndsAt}
      />
    </div>
  );
}
