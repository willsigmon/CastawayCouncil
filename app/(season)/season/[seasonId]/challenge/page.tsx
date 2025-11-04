import { db } from '@/drizzle/db';
import { players, seasons, challenges } from '@/drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { ChallengeInterface } from './challenge-interface';

interface PageProps {
  params: { seasonId: string };
}

export default async function ChallengePage({ params }: PageProps) {
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
  });

  if (!player) {
    return <div className="p-8 text-center">No active player</div>;
  }

  // Get current challenge
  const currentChallenge = await db.query.challenges.findFirst({
    where: and(eq(challenges.seasonId, seasonId), eq(challenges.day, season.dayIndex)),
  });

  // Mock challenge end time
  const challengeEndsAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <ChallengeInterface
        playerId={player.id}
        playerName={player.displayName}
        seasonId={seasonId}
        currentDay={season.dayIndex}
        challenge={currentChallenge}
        challengeEndsAt={challengeEndsAt}
      />
    </div>
  );
}
