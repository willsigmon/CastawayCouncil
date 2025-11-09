"use client";

import { useEffect, useState, useRef } from "react";

type TrustLevel = "distrust" | "neutral" | "ally" | "core";

interface Relationship {
  authorId: string;
  authorName: string;
  subjectId: string;
  subjectName: string;
  trustLevel: TrustLevel;
  noteCount: number;
}

interface AllianceNetworkProps {
  seasonId: string;
  authorId?: string;
}

const trustColors: Record<TrustLevel, string> = {
  distrust: "#ef4444",
  neutral: "#eab308",
  ally: "#22c55e",
  core: "#3b82f6",
};

export function AllianceNetwork({ seasonId, authorId }: AllianceNetworkProps) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const params = new URLSearchParams({ seasonId });
        if (authorId) params.append("authorId", authorId);
        const res = await fetch(`/api/alliance/stats?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRelationships(data.stats.relationships || []);
        }
      } catch (error) {
        console.error("Failed to load relationships:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelationships();
  }, [seasonId, authorId]);

  useEffect(() => {
    if (!canvasRef.current || relationships.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Collect unique players
    const players = new Map<string, { name: string; x: number; y: number }>();
    relationships.forEach((rel) => {
      if (!players.has(rel.authorId)) {
        players.set(rel.authorId, { name: rel.authorName, x: 0, y: 0 });
      }
      if (!players.has(rel.subjectId)) {
        players.set(rel.subjectId, { name: rel.subjectName, x: 0, y: 0 });
      }
    });

    // Position players in a circle
    const playerArray = Array.from(players.entries());
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;
    const angleStep = (2 * Math.PI) / playerArray.length;

    playerArray.forEach(([id, player], index) => {
      const angle = index * angleStep;
      player.x = centerX + radius * Math.cos(angle);
      player.y = centerY + radius * Math.sin(angle);
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw relationships (edges)
    relationships.forEach((rel) => {
      const author = players.get(rel.authorId);
      const subject = players.get(rel.subjectId);
      if (!author || !subject) return;

      ctx.strokeStyle = trustColors[rel.trustLevel];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(author.x, author.y);
      ctx.lineTo(subject.x, subject.y);
      ctx.stroke();
    });

    // Draw players (nodes)
    playerArray.forEach(([id, player]) => {
      // Node circle
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Node border
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Player name
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(player.name.substring(0, 10), player.x, player.y - 30);
    });
  }, [relationships]);

  if (loading) {
    return (
      <div className="w-full h-96 bg-stone-800/50 rounded-lg border border-stone-700 animate-pulse flex items-center justify-center">
        <div className="text-stone-400">Loading network...</div>
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="w-full h-96 bg-stone-800/50 rounded-lg border border-stone-700 flex items-center justify-center">
        <div className="text-stone-400">No relationships to display</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500" />
          <span className="text-stone-400">Distrust</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-yellow-500" />
          <span className="text-stone-400">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500" />
          <span className="text-stone-400">Ally</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span className="text-stone-400">Core</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-96 bg-stone-800/50 rounded-lg border border-stone-700"
      />
    </div>
  );
}

