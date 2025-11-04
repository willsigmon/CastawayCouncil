export default function AlliesPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">🤝 Alliances</h1>
        <p className="text-green-100">
          Form secret alliances with other players
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Alliance management features are under development
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto text-left">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">
            Planned Features:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Create secret alliances</li>
            <li>Invite players to join</li>
            <li>Private alliance chat</li>
            <li>Coordinate voting strategies</li>
            <li>View alliance history</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
