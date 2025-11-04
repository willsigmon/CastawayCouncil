'use client';

import { useState } from 'react';

interface Confessional {
  id: string;
  body: string;
  visibility: 'private' | 'postseason';
  createdAt: Date;
}

interface ConfessionalWriterProps {
  playerId: string;
  playerName: string;
  seasonStatus: string;
  existingConfessionals: Confessional[];
}

export function ConfessionalWriter({
  playerId,
  playerName,
  seasonStatus,
  existingConfessionals,
}: ConfessionalWriterProps) {
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'postseason'>('private');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/confessional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          body: body.trim(),
          visibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save confessional');
      }

      setMessage({
        type: 'success',
        text: 'Confessional saved successfully!',
      });

      setBody('');

      // Refresh page to show new confessional
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save confessional',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2">📔 Confessional</h1>
        <p className="text-purple-100">
          Your private diary. Share your thoughts, strategies, and feelings.
        </p>
      </div>

      {/* Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">
          🔒 Privacy Notice
        </h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
          <li>
            <strong>Private:</strong> Only you can see these confessionals during the season
          </li>
          <li>
            <strong>Post-Season:</strong> Opt to share after season ends (great for recaps!)
          </li>
          <li>Season organizers never see private confessionals</li>
        </ul>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Writer */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Write a Confessional</h2>

        <div className="space-y-4">
          <div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's on your mind? Share your thoughts, strategy, alliances, or fears..."
              rows={8}
              maxLength={5000}
              disabled={submitting}
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              aria-label="Confessional text"
            />
            <p className="text-xs text-gray-500 mt-1">
              {body.length}/5000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Visibility</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value as 'private')}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">🔒 Private</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Only you can see this (recommended during season)
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="visibility"
                  value="postseason"
                  checked={visibility === 'postseason'}
                  onChange={(e) => setVisibility(e.target.value as 'postseason')}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium">👁️ Post-Season</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Share after season ends (great for episode recaps!)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Confessional'}
          </button>
        </div>
      </form>

      {/* Past Confessionals */}
      {existingConfessionals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Your Confessionals</h2>
          <div className="space-y-4">
            {existingConfessionals.map((conf) => (
              <div
                key={conf.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(conf.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      conf.visibility === 'private'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                    }`}
                  >
                    {conf.visibility === 'private' ? '🔒 Private' : '👁️ Post-Season'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{conf.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {existingConfessionals.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500">No confessionals yet. Write your first one above!</p>
        </div>
      )}
    </div>
  );
}
