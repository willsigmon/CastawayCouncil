"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSeason } from "@/components/SeasonContext";
import { CraftingModal } from "@/app/_components/CraftingModal";
import { ContributeProjectModal } from "@/app/_components/ContributeProjectModal";
import { NarrativeArcCard } from "@/app/_components/NarrativeArcCard";

type Project = {
  id: string;
  name: string;
  progress: number;
  targetProgress: number;
  status: string;
};

export default function CampPage() {
  const params = useParams();
  const seasonId = params.seasonId as string;
  const { currentPlayer } = useSeason();
  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (seasonId && currentPlayer) {
      fetch(`/api/projects?seasonId=${seasonId}&status=active`)
        .then((res) => res.json())
        .then((data) => setProjects(data.projects || []))
        .catch(console.error);
    }
  }, [seasonId, currentPlayer]);

  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not in a Season</h2>
          <p className="text-gray-400">Join a season to access camp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-100 mb-6">Camp</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Crafting Section */}
        <div className="p-6 bg-stone-800/50 rounded-lg border border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-200">Crafting</h2>
            <button
              onClick={() => setShowCraftingModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold transition-colors"
            >
              Open Crafting
            </button>
          </div>
          <p className="text-sm text-stone-400">
            Craft tools and items using resources from your inventory. Discover new recipes as you explore!
          </p>
        </div>

        {/* Projects Section */}
        <div className="p-6 bg-stone-800/50 rounded-lg border border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-200">Projects</h2>
            {projects.length > 0 && (
              <button
                onClick={() => {
                  setSelectedProjectId(projects[0].id);
                  setShowContributeModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
              >
                Contribute
              </button>
            )}
          </div>
          <p className="text-sm text-stone-400 mb-3">
            Work together with your tribe or solo to complete projects. Contribute resources and progress to unlock rewards.
          </p>
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="p-3 bg-stone-900/50 rounded border border-stone-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-stone-200">{project.name}</span>
                    <span className="text-xs text-stone-400">
                      {Math.round((project.progress / project.targetProgress) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((project.progress / project.targetProgress) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500">No active projects</p>
          )}
        </div>
      </div>

      {/* Narrative Arcs */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-stone-200 mb-4">Your Narrative Arcs</h2>
        <NarrativeArcCard seasonId={seasonId} playerId={currentPlayer.id} />
      </div>

      <CraftingModal
        seasonId={seasonId}
        playerId={currentPlayer.id}
        isOpen={showCraftingModal}
        onClose={() => setShowCraftingModal(false)}
        onSuccess={() => {
          setShowCraftingModal(false);
          // Refresh inventory or show success message
        }}
      />

      {selectedProjectId && (
        <ContributeProjectModal
          projectId={selectedProjectId}
          seasonId={seasonId}
          isOpen={showContributeModal}
          onClose={() => {
            setShowContributeModal(false);
            setSelectedProjectId(null);
          }}
          onSuccess={() => {
            setShowContributeModal(false);
            setSelectedProjectId(null);
            // Refresh projects
            fetch(`/api/projects?seasonId=${seasonId}&status=active`)
              .then((res) => res.json())
              .then((data) => setProjects(data.projects || []))
              .catch(console.error);
          }}
        />
      )}
    </div>
  );
}

