'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient, subscribeToTribeChat, joinTribePresence } from '@/app/_lib/supabase-client';

interface Message {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  body: string;
  createdAt: Date;
}

interface Member {
  id: string;
  name: string;
  handle: string;
  isEliminated: boolean;
}

interface TribeChatProps {
  tribeId: string;
  tribeName: string;
  tribeColor: string;
  playerId: string;
  playerName: string;
  members: Member[];
  initialMessages: Message[];
}

export function TribeChat({
  tribeId,
  tribeName,
  tribeColor,
  playerId,
  playerName,
  members,
  initialMessages,
}: TribeChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new messages
    const channel = subscribeToTribeChat(supabase, tribeId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // In real app, fetch full message data
        // For now, we'll rely on page refreshes
        console.log('New message:', payload);
      }
    });

    // Join presence
    const presenceChannel = joinTribePresence(supabase, tribeId, playerId, playerName);

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const online = Object.values(state).flatMap((users: any) =>
        users.map((user: any) => user.playerId)
      );
      setOnlineUsers(online);
    });

    return () => {
      channel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [tribeId, playerId, playerName, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      const response = await fetch('/api/message/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPlayerId: playerId,
          tribeId,
          channelType: 'tribe',
          body: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add message optimistically
      setMessages([
        ...messages,
        {
          id: data.id,
          fromPlayerId: playerId,
          fromPlayerName: playerName,
          body: newMessage.trim(),
          createdAt: new Date(),
        },
      ]);

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activeMembers = members.filter((m) => !m.isEliminated);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white dark:bg-gray-800">
      {/* Sidebar: Tribe Info & Members */}
      <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: tribeColor }} />
            <h2 className="text-xl font-bold">{tribeName}</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
            Members
          </h3>
          {activeMembers.map((member) => {
            const isOnline = onlineUsers.includes(member.id);
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {member.name}
                    {member.id === playerId && (
                      <span className="ml-1 text-xs text-gray-500">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">@{member.handle}</p>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={isOnline ? 'Online' : 'Offline'}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages.map((message) => {
            const isOwn = message.fromPlayerId === playerId;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md rounded-lg p-3 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.fromPlayerName}
                    </p>
                  )}
                  <p className="break-words">{message.body}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
              aria-label="Message input"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/500 characters
          </p>
        </form>
      </div>
    </div>
  );
}
