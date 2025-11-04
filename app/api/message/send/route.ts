import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { messages, players, tribeMembers } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const SendMessageSchema = z.object({
  fromPlayerId: z.string().uuid(),
  tribeId: z.string().uuid().optional(),
  toPlayerId: z.string().uuid().optional(),
  channelType: z.enum(['tribe', 'dm', 'public']),
  body: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromPlayerId, tribeId, toPlayerId, channelType, body: messageBody } =
      SendMessageSchema.parse(body);

    // Verify sender exists
    const sender = await db.query.players.findFirst({
      where: eq(players.id, fromPlayerId),
      with: { season: true },
    });

    if (!sender || sender.eliminatedAt) {
      return NextResponse.json(
        { error: 'Sender not found or eliminated' },
        { status: 404 }
      );
    }

    // Validate channel access
    if (channelType === 'tribe') {
      if (!tribeId) {
        return NextResponse.json(
          { error: 'Tribe ID required for tribe messages' },
          { status: 400 }
        );
      }

      // Verify sender is in tribe
      const membership = await db.query.tribeMembers.findFirst({
        where: and(
          eq(tribeMembers.tribeId, tribeId),
          eq(tribeMembers.playerId, fromPlayerId)
        ),
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Not a member of this tribe' },
          { status: 403 }
        );
      }
    }

    if (channelType === 'dm') {
      if (!toPlayerId) {
        return NextResponse.json(
          { error: 'Recipient required for DMs' },
          { status: 400 }
        );
      }

      const recipient = await db.query.players.findFirst({
        where: eq(players.id, toPlayerId),
      });

      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }

      // Must be in same season
      if (recipient.seasonId !== sender.seasonId) {
        return NextResponse.json(
          { error: 'Can only message players in same season' },
          { status: 400 }
        );
      }
    }

    // Create message
    const [message] = await db
      .insert(messages)
      .values({
        seasonId: sender.seasonId,
        channelType,
        tribeId: channelType === 'tribe' ? tribeId : null,
        fromPlayerId,
        toPlayerId: channelType === 'dm' ? toPlayerId : null,
        body: messageBody,
      })
      .returning();

    return NextResponse.json({
      id: message!.id,
      createdAt: message!.createdAt,
    });
  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
