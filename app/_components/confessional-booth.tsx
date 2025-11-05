'use client';

import { useState, useEffect } from 'react';

interface Confessional {
  id: string;
  body: string;
  visibility: 'private' | 'postseason';
  createdAt: string;
  insights: Array<{
    points: number;
    category: string;
  }>;
}

interface InsightSummary {
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

interface Reward {
  threshold: number;
  reward: string;
  description: string;
  unlocked: boolean;
}

interface ConfessionalBoothProps {
  playerId: string;
  seasonId: string;
}

export function ConfessionalBooth({ playerId, seasonId }: ConfessionalBoothProps) {
  const [confessionals, setConfessionals] = useState<Confessional[]>([]);
  const [insightSummary, setInsightSummary] = useState<InsightSummary | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [newConfessional, setNewConfessional] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'postseason'>('private');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newReward, setNewReward] = useState<Reward | null>(null);

  useEffect(() => {
    fetchConfessionals();
  }, [playerId]);

  async function fetchConfessionals() {
    try {
      const response = await fetch(
        `/api/confessionals?playerId=${playerId}&rewards=true&prompts=true`
      );
      const data = await response.json();

      if (response.ok) {
        setConfessionals(data.confessionals);
        setInsightSummary(data.insightSummary);
        setRewards(data.rewards || []);
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Failed to fetch confessionals:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newConfessional.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/confessionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          body: newConfessional,
          visibility,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewConfessional('');
        setSelectedPrompt(null);
        setShowSuccess(true);

        // Show new reward if unlocked
        if (data.newRewards && data.newRewards.length > 0) {
          setNewReward(data.newRewards[0]);
        }

        // Refresh confessionals
        await fetchConfessionals();

        setTimeout(() => {
          setShowSuccess(false);
          setNewReward(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to submit confessional:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function usePrompt(prompt: string) {
    setSelectedPrompt(prompt);
    setNewConfessional(prompt + '\n\n');
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strategy':
        return 'bg-purple-500';
      case 'social':
        return 'bg-blue-500';
      case 'observation':
        return 'bg-green-500';
      case 'prediction':
        return 'bg-yellow-500';
      case 'self_reflection':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">🎬 Confessional Booth</h2>
        <p className="text-purple-200">
          Share your thoughts, strategies, and observations. Earn insight points for detailed
          confessionals.
        </p>

        {/* Insight Summary */}
        {insightSummary && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">{insightSummary.total}</div>
              <div className="text-sm text-purple-200">Total Insight Points</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">{insightSummary.count}</div>
              <div className="text-sm text-purple-200">Confessionals</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">
                {rewards.filter((r) => r.unlocked).length}/{rewards.length}
              </div>
              <div className="text-sm text-purple-200">Rewards Unlocked</div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Confessional recorded successfully!
        </div>
      )}

      {/* New Reward Unlocked */}
      {newReward && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
          <div className="font-bold">🎉 New Reward Unlocked!</div>
          <div>{newReward.description}</div>
        </div>
      )}

      {/* New Confessional Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-xl font-bold mb-4">Record New Confessional</h3>

        {/* Prompts */}
        {prompts.length > 0 && !selectedPrompt && (
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-sm text-gray-600 dark:text-gray-400">
              Need inspiration? Try one of these prompts:
            </h4>
            <div className="space-y-2">
              {prompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => usePrompt(prompt)}
                  className="block w-full text-left px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded text-sm transition-colors"
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={newConfessional}
              onChange={(e) => setNewConfessional(e.target.value)}
              placeholder="Share your thoughts on the game... (minimum 10 characters)"
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700"
              disabled={isSubmitting}
            />
            <div className="text-sm text-gray-500 mt-1">
              {newConfessional.length} characters
              {newConfessional.length >= 100 && ' (detailed +2 pts)'}
              {newConfessional.length >= 50 && newConfessional.length < 100 && ' (substantial +1 pt)'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
                className="text-purple-600"
              />
              <span className="text-sm">🔒 Private (only you can see)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="postseason"
                checked={visibility === 'postseason'}
                onChange={() => setVisibility('postseason')}
                className="text-purple-600"
              />
              <span className="text-sm">📺 Postseason (visible after game)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || newConfessional.length < 10}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Recording...' : 'Record Confessional'}
          </button>
        </form>
      </div>

      {/* Rewards Progress */}
      {rewards.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">Reward Milestones</h3>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div
                key={reward.threshold}
                className={`flex items-center justify-between p-3 rounded ${
                  reward.unlocked
                    ? 'bg-green-100 dark:bg-green-900/20 border border-green-300'
                    : 'bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <div>
                  <div className="font-semibold">
                    {reward.unlocked ? '✅' : '🔒'} {reward.threshold} points
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {reward.description}
                  </div>
                </div>
                {!reward.unlocked && insightSummary && (
                  <div className="text-sm text-gray-500">
                    {reward.threshold - insightSummary.total} more pts
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Confessionals */}
      {confessionals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">Your Confessionals</h3>
          <div className="space-y-4">
            {confessionals.map((conf) => (
              <div
                key={conf.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {conf.insights.map((insight, i) => (
                      <span
                        key={i}
                        className={`${getCategoryColor(
                          insight.category
                        )} text-white text-xs px-2 py-1 rounded`}
                      >
                        +{insight.points} {insight.category}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(conf.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {conf.body}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {conf.visibility === 'private' ? '🔒 Private' : '📺 Postseason'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
