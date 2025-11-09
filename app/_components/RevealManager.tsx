"use client";

import { useState, useEffect } from "react";

interface RevealManagerProps {
  seasonId: string;
}

type Reveal = {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: "pending" | "committed" | "revealed" | "verified";
  commitHash?: string;
  revealContentJson?: Record<string, unknown>;
};

export function RevealManager({ seasonId }: RevealManagerProps) {
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [selectedReveal, setSelectedReveal] = useState<Reveal | null>(null);
  const [action, setAction] = useState<"create" | "commit" | "reveal" | null>(null);
  const [formData, setFormData] = useState({
    type: "custom" as "idol_location" | "tribe_swap" | "immunity" | "custom",
    title: "",
    description: "",
    commitHash: "",
    revealContent: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReveals();
  }, [seasonId]);

  const fetchReveals = async () => {
    try {
      const res = await fetch(`/api/reveal?seasonId=${seasonId}`);
      if (res.ok) {
        const data = await res.json();
        setReveals(data.reveals || []);
      }
    } catch (err) {
      console.error("Failed to fetch reveals:", err);
    }
  };

  const generateCommitHash = async (content: string): Promise<string> => {
    // Use Web Crypto API for browser
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleCreateReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId,
          type: formData.type,
          title: formData.title,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create reveal");
      }

      await fetchReveals();
      setAction(null);
      setFormData({
        type: "custom",
        title: "",
        description: "",
        commitHash: "",
        revealContent: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reveal");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReveal) return;

    setLoading(true);
    setError(null);

    try {
      const commitHash = formData.commitHash || (await generateCommitHash(formData.revealContent));

      const response = await fetch("/api/reveal/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revealId: selectedReveal.id,
          commitHash,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to commit reveal");
      }

      await fetchReveals();
      setAction(null);
      setSelectedReveal(null);
      setFormData({
        type: "custom",
        title: "",
        description: "",
        commitHash: "",
        revealContent: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit reveal");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReveal) return;

    setLoading(true);
    setError(null);

    try {
      let revealContentJson: Record<string, unknown>;
      try {
        revealContentJson = JSON.parse(formData.revealContent);
      } catch {
        throw new Error("Invalid JSON in reveal content");
      }

      const response = await fetch("/api/reveal/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revealId: selectedReveal.id,
          revealContentJson,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reveal content");
      }

      await fetchReveals();
      setAction(null);
      setSelectedReveal(null);
      setFormData({
        type: "custom",
        title: "",
        description: "",
        commitHash: "",
        revealContent: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal content");
    } finally {
      setLoading(false);
    }
  };

  const [hashMatch, setHashMatch] = useState<boolean | null>(null);

  useEffect(() => {
    if (formData.revealContent && selectedReveal?.commitHash) {
      generateCommitHash(formData.revealContent).then((hash) => {
        setHashMatch(hash === selectedReveal.commitHash);
      });
    } else {
      setHashMatch(null);
    }
  }, [formData.revealContent, selectedReveal?.commitHash]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-purple-100">Reveals</h3>
        <button
          onClick={() => {
            setAction("create");
            setSelectedReveal(null);
            setFormData({
              type: "custom",
              title: "",
              description: "",
              commitHash: "",
              revealContent: "",
            });
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
        >
          + Create Reveal
        </button>
      </div>

      {/* Reveals List */}
      <div className="space-y-2">
        {reveals.map((reveal) => (
          <div
            key={reveal.id}
            className="p-4 bg-purple-900/20 border border-purple-700 rounded-lg hover:border-purple-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-bold text-purple-100">{reveal.title}</div>
                {reveal.description && <div className="text-sm text-stone-400">{reveal.description}</div>}
                <div className="text-xs text-stone-500 mt-1">
                  Type: {reveal.type} • Status: {reveal.status}
                </div>
                {reveal.commitHash && (
                  <div className="text-xs text-stone-500 mt-1 font-mono">
                    Commit: {reveal.commitHash.slice(0, 16)}...
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {reveal.status === "pending" && (
                  <button
                    onClick={() => {
                      setAction("commit");
                      setSelectedReveal(reveal);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Commit
                  </button>
                )}
                {reveal.status === "committed" && (
                  <button
                    onClick={() => {
                      setAction("reveal");
                      setSelectedReveal(reveal);
                    }}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    Reveal
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Reveal Modal */}
      {action === "create" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-purple-100">Create Reveal</h3>
            <form onSubmit={handleCreateReveal} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as typeof formData.type })
                  }
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
                >
                  <option value="idol_location">Idol Location</option>
                  <option value="tribe_swap">Tribe Swap</option>
                  <option value="immunity">Immunity</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100"
                  rows={3}
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Commit Modal */}
      {action === "commit" && selectedReveal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-purple-100">Commit Reveal: {selectedReveal.title}</h3>
            <form onSubmit={handleCommit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">
                  Commit Hash (leave empty to auto-generate from content)
                </label>
                <input
                  type="text"
                  value={formData.commitHash}
                  onChange={(e) => setFormData({ ...formData, commitHash: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 font-mono text-sm"
                  placeholder="64-character hex string"
                  pattern="[a-f0-9]{64}"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">
                  Reveal Content (JSON) - for hash generation
                </label>
                <textarea
                  value={formData.revealContent}
                  onChange={(e) => setFormData({ ...formData, revealContent: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 font-mono text-sm"
                  rows={6}
                  placeholder='{"location": "behind the waterfall", "clue": "..."}'
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAction(null);
                    setSelectedReveal(null);
                  }}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  {loading ? "Committing..." : "Commit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reveal Modal */}
      {action === "reveal" && selectedReveal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-purple-100">Reveal: {selectedReveal.title}</h3>
            <form onSubmit={handleReveal} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-300 mb-2">Reveal Content (JSON)</label>
                <textarea
                  value={formData.revealContent}
                  onChange={(e) => setFormData({ ...formData, revealContent: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded text-stone-100 font-mono text-sm"
                  rows={8}
                  required
                  placeholder='{"location": "behind the waterfall", "clue": "..."}'
                />
              </div>
              {selectedReveal.commitHash && hashMatch !== null && (
                <div className="p-3 bg-stone-800 rounded">
                  <div className="text-sm text-stone-400 mb-1">Commit Hash Verification:</div>
                  <div className={`text-sm font-mono ${hashMatch ? "text-green-400" : "text-red-400"}`}>
                    {hashMatch ? "✓ Hash matches" : "✗ Hash does not match"}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">Expected: {selectedReveal.commitHash.slice(0, 16)}...</div>
                </div>
              )}
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAction(null);
                    setSelectedReveal(null);
                  }}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                >
                  {loading ? "Revealing..." : "Reveal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
