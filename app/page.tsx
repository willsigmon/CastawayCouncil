export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Castaway Council</h1>
        <p className="text-xl mb-8">
          A real-time social survival RPG where every day counts
        </p>
        <div className="space-y-2 text-left bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">Game Loop:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Camp Tasks - Manage hunger, thirst, energy</li>
            <li>Challenge - Compete for immunity and rewards</li>
            <li>Tribal Council - Vote to eliminate</li>
            <li>Merge at 10 players remaining</li>
            <li>Final 3 face the Jury</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
