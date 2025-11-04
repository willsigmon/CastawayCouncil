'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Tab {
  label: string;
  href: string;
  icon: string;
}

interface NavTabsProps {
  seasonId: string;
  playerId: string;
}

export function NavTabs({ seasonId, playerId }: NavTabsProps) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { label: 'Dashboard', href: `/season/${seasonId}`, icon: '🏠' },
    { label: 'Tribe', href: `/season/${seasonId}/tribe`, icon: '👥' },
    { label: 'Allies', href: `/season/${seasonId}/allies`, icon: '🤝' },
    { label: 'DMs', href: `/season/${seasonId}/dm`, icon: '💬' },
    { label: 'Log', href: `/season/${seasonId}/log`, icon: '📜' },
    { label: 'Confessional', href: `/season/${seasonId}/confessional`, icon: '📔' },
    { label: 'Vote', href: `/season/${seasonId}/vote`, icon: '🗳️' },
    { label: 'Challenge', href: `/season/${seasonId}/challenge`, icon: '⚔️' },
  ];

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <div className="flex space-x-1 px-4" role="tablist">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
            >
              <span role="img" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
