import { db } from '@/drizzle/db';
import { players, confessionals, seasons } from '@/drizzle/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { ConfessionalWriter } from './confessional-writer';

interface PageProps {
  params: { seasonId: string };
}

export default async function ConfessionalPage({ params }: PageProps) {
  const { seasonId } = params;

  // Mock player (in real app, get from auth)
  const player = await db.query.players.findFirst({
    where: and(eq(players.seasonId, seasonId), isNull(players.eliminatedAt)),
  });

  if (!player) {
    return <div className="p-8 text-center">No active player</div>;
  }

  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
  });

  // Get player's confessionals
  const playerConfessionals = await db.query.confessionals.findMany({
    where: eq(confessionals.playerId, player.id),
    orderBy: [desc(confessionals.createdAt)],
  });

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <ConfessionalWriter
        playerId={player.id}
        playerName={player.displayName}
        seasonStatus={season?.status || 'active'}
        existingConfessionals={playerConfessionals.map((c) => ({
          id: c.id,
          body: c.body,
          visibility: c.visibility,
          createdAt: c.createdAt,
        }))}
      />
    </div>
  );
}
