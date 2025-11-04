import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Realtime channel helpers
export function subscribeToSeasonEvents(
  client: ReturnType<typeof createClient>,
  seasonId: string,
  callback: (payload: any) => void
) {
  const channel = client.channel(`season:${seasonId}:public`);

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
    .subscribe();

  return channel;
}

export function subscribeToTribeChat(
  client: ReturnType<typeof createClient>,
  tribeId: string,
  callback: (payload: any) => void
) {
  const channel = client.channel(`tribe:${tribeId}:chat`);

  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
    .subscribe();

  return channel;
}

export function subscribeToDMs(
  client: ReturnType<typeof createClient>,
  playerId1: string,
  playerId2: string,
  callback: (payload: any) => void
) {
  const pairKey = [playerId1, playerId2].sort().join('-');
  const channel = client.channel(`dm:${pairKey}`);

  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
    .subscribe();

  return channel;
}

export function joinTribePresence(
  client: ReturnType<typeof createClient>,
  tribeId: string,
  playerId: string,
  playerName: string
) {
  const channel = client.channel(`tribe:${tribeId}:chat`, {
    config: {
      presence: {
        key: playerId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Presence sync:', state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          playerId,
          playerName,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}
