import { NavTabs } from '@/app/_components/nav-tabs';

export default function SeasonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { seasonId: string };
}) {
  // In a real app, get playerId from auth session
  const playerId = 'mock-player-id';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Castaway Council</h1>
        <p className="text-sm text-gray-400">Season {params.seasonId.slice(0, 8)}</p>
      </header>

      <NavTabs seasonId={params.seasonId} playerId={playerId} />

      <main className="flex-1 bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  );
}
