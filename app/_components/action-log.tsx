'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/_lib/supabase-client';
import { ClassBadge } from './class-badge';

interface ActionMessage {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  playerClass?: string;
  wildcardAbility?: string;
  body: string;
  metadata?: {
    action?: string;
    items?: string[];
    statChanges?: {
      hunger?: number;
      thirst?: number;
      comfort?: number;
      energy?: number;
    };
  };
  createdAt: Date;
}

interface ActionLogProps {
  tribeId: string;
  tribeName: string;
  initialMessages: ActionMessage[];
}

const actionIcons: Record<string, string> = {
  collect_firewood: '🪵',
  gather_coconuts: '🥥',
  spear_fish: '🐟',
  build_shelter: '🏠',
  get_water: '💧',
  cook_food: '🍲',
  rest: '😴',
  meditate: '🧘',
  search_advantages: '🔍',
};

export function ActionLog({ tribeId, tribeName, initialMessages }: ActionLogProps) {
  const [messages, setMessages] = useState<ActionMessage[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new action messages
    const channel = supabase
      .channel(`action-log-${tribeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channelType=eq.action`,
        },
        (payload) => {
          console.log('New action message:', payload);
          // In production, you'd fetch the full message with player details
          // For now, we'll rely on page refreshes
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tribeId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatStatChange = (change: number) => {
    return change > 0 ? `+${change}` : `${change}`;
  };

  const getActionIcon = (action?: string) => {
    if (!action) return '📋';
    return actionIcons[action] || '📋';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-xl font-bold">Action Log</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tribeName} camp activities
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No actions yet. Start performing camp actions!</p>
          </div>
        )}

        {messages.map((message) => {
          const action = message.metadata?.action;
          const icon = getActionIcon(action);
          const items = message.metadata?.items;
          const statChanges = message.metadata?.statChanges;

          return (
            <div
              key={message.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {message.fromPlayerName}
                    </span>
                    {message.playerClass && (
                      <ClassBadge
                        playerClass={message.playerClass as any}
                        wildcardAbility={message.wildcardAbility as any}
                        size="sm"
                      />
                    )}
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {message.body}
                  </p>

                  {/* Items Found */}
                  {items && items.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                        Items:
                      </span>
                      {items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stat Changes */}
                  {statChanges && Object.keys(statChanges).length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      {statChanges.hunger !== undefined && statChanges.hunger !== 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            statChanges.hunger > 0
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          🍎 {formatStatChange(statChanges.hunger)}
                        </span>
                      )}
                      {statChanges.thirst !== undefined && statChanges.thirst !== 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            statChanges.thirst > 0
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          💧 {formatStatChange(statChanges.thirst)}
                        </span>
                      )}
                      {statChanges.comfort !== undefined && statChanges.comfort !== 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            statChanges.comfort > 0
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          🛏️ {formatStatChange(statChanges.comfort)}
                        </span>
                      )}
                      {statChanges.energy !== undefined && statChanges.energy !== 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            statChanges.energy > 0
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          ⚡ {formatStatChange(statChanges.energy)}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-750">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 Action logs show all camp activities by your tribe. This helps coordinate strategies and
          track resource gathering.
        </p>
      </div>
    </div>
  );
}
