import { db } from '@/drizzle/db';
import { players, tribeMembers, messages } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TribeChat } from './tribe-chat';

interface PageProps {
  params: { seasonId: string };
}

export default async function TribePage({ params }: PageProps) {
  const { seasonId } = params;

  // Mock player ID (in real app, get from auth)
  const player = await db.query.players.findFirst({
    where: eq(players.seasonId, seasonId),
    with: {
      tribeMembers: {
        with: {
          tribe: true,
        },
      },
    },
  });

  if (!player || !player.tribeMembers[0]) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">No tribe assigned</h1>
      </div>
    );
  }

  const tribe = player.tribeMembers[0].tribe;

  // Get tribe members
  const members = await db.query.tribeMembers.findMany({
    where: eq(tribeMembers.tribeId, tribe.id),
    with: {
      player: {
        with: {
          user: true,
        },
      },
    },
  });

  // Get recent messages
  const recentMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.tribeId, tribe.id),
      eq(messages.channelType, 'tribe')
    ),
    orderBy: [desc(messages.createdAt)],
    limit: 50,
    with: {
      fromPlayer: {
        with: {
          user: true,
        },
      },
    },
  });

  return (
    <div className="h-[calc(100vh-8rem)]">
      <TribeChat
        tribeId={tribe.id}
        tribeName={tribe.name}
        tribeColor={tribe.color}
        playerId={player.id}
        playerName={player.displayName}
        members={members.map((m) => ({
          id: m.player.id,
          name: m.player.displayName,
          handle: m.player.user.handle,
          isEliminated: !!m.player.eliminatedAt,
        }))}
        initialMessages={recentMessages.map((m) => ({
          id: m.id,
          fromPlayerId: m.fromPlayerId,
          fromPlayerName: m.fromPlayer.displayName,
          body: m.body,
          createdAt: m.createdAt,
        }))}
      />
    </div>
  );
}
