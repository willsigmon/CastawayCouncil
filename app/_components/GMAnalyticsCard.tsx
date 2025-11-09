"use client";

interface GMAnalyticsCardProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
}

export function GMAnalyticsCard({ title, children, icon }: GMAnalyticsCardProps) {
  return (
    <div className="p-6 bg-stone-800/50 rounded-lg border border-stone-700">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <h3 className="text-lg font-semibold text-stone-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

