import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  PiggyBank,
  Wallet,
  BarChart3,
  Settings,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { ScreenName } from '../types';

interface BottomNavBarProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentScreen, onNavigate }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems: { id: ScreenName; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Accueil',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Receipt className="h-5 w-5" />
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: <Wallet className="h-5 w-5" />
    },
    {
      id: 'savings',
      label: 'Épargne',
      icon: <PiggyBank className="h-5 w-5" />
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: <BarChart3 className="h-5 w-5" />
    }
  ];

  const secondaryItems: { id: ScreenName; label: string; icon: React.ReactNode }[] = [
    {
      id: 'assistant',
      label: 'Assistant IA',
      icon: <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'income',
      label: 'Revenus',
      icon: <ArrowDownCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'expense',
      label: 'Dépenses',
      icon: <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
    }
  ];

  const handleSelectMore = (id: ScreenName) => {
    onNavigate(id);
    setShowMoreMenu(false);
  };

  const isMoreActive = ['assistant', 'income', 'expense', 'settings'].includes(currentScreen);

  return (
    <>
      {/* Popover menu for secondary screens */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="absolute bottom-20 right-4 z-50 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Autres écrans
            </div>
            <div className="space-y-1">
              {secondaryItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectMore(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    currentScreen === item.id
                      ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Material 3 Bottom Navigation Bar */}
      <nav className="sticky bottom-0 z-30 flex h-16 w-full items-center justify-around border-t border-zinc-200/80 bg-white/95 px-2 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/95">
        {mainItems.map(item => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <div
                className={`flex h-8 w-14 items-center justify-center rounded-full transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="mt-0.5 text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Plus / More Menu button */}
        <button
          onClick={() => setShowMoreMenu(prev => !prev)}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition ${
            isMoreActive || showMoreMenu
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <div
            className={`flex h-8 w-14 items-center justify-center rounded-full transition-all ${
              isMoreActive || showMoreMenu
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : ''
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <span className="mt-0.5 text-[11px] font-medium tracking-tight">
            Plus
          </span>
        </button>
      </nav>
    </>
  );
};
