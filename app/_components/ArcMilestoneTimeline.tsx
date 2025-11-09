"use client";

interface Milestone {
  day: number;
  event: string;
  progress: number;
}

interface ArcMilestoneTimelineProps {
  milestones: Milestone[];
  currentProgress: number;
}

export function ArcMilestoneTimeline({ milestones, currentProgress }: ArcMilestoneTimelineProps) {
  if (milestones.length === 0) {
    return <div className="text-sm text-stone-500">No milestones yet</div>;
  }

  return (
    <div className="space-y-3">
      {milestones.map((milestone, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                currentProgress >= milestone.progress ? "bg-amber-400" : "bg-stone-600"
              }`}
            />
            {idx < milestones.length - 1 && (
              <div
                className={`w-0.5 flex-1 ${
                  currentProgress >= milestone.progress ? "bg-amber-400/50" : "bg-stone-700"
                }`}
                style={{ minHeight: "2rem" }}
              />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="font-semibold text-stone-200">Day {milestone.day}</div>
            <div className="text-sm text-stone-400">{milestone.event}</div>
            <div className="text-xs text-stone-500 mt-1">{milestone.progress}% milestone</div>
          </div>
        </div>
      ))}
    </div>
  );
}

