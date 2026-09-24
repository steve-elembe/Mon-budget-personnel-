import React from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Smartphone,
  Plus,
  FolderKanban,
  Bell,
  Lock,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  User,
  Sparkles
} from 'lucide-react';
import { ScreenName, UserAccount, CloudSyncInfo } from '../types';

interface TopAppBarProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  darkTheme: boolean;
  onToggleTheme: () => void;
  onOpenAndroidCode: (tab?: 'code' | 'export') => void;
  onOpenCategoryManager?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  isLockEnabled?: boolean;
  onLockApp?: () => void;
  currentUser?: UserAccount | null;
  syncInfo?: CloudSyncInfo;
  onOpenAuthSync?: () => void;
}

const SCREEN_TITLES: Record<ScreenName, string> = {
  dashboard: 'Mon Budget',
  income: 'Ajouter un Revenu',
  expense: 'Ajouter une Dépense',
  transactions: 'Toutes les Transactions',
  budgets: 'Gestion des Budgets',
  savings: 'Objectifs d’Épargne',
  stats: 'Statistiques & Analyses',
  assistant: 'Assistant Financier',
  settings: 'Paramètres'
};

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentScreen,
  onNavigate,
  darkTheme,
  onToggleTheme,
  onOpenAndroidCode,
  onOpenCategoryManager,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  isLockEnabled = false,
  onLockApp
}) => {
  const isRoot = currentScreen === 'dashboard';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/95">
      <div className="flex items-center gap-3">
        {!isRoot ? (
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Retour au tableau de bord"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <span className="text-base font-bold tracking-tight">MB</span>
          </div>
        )}
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 sm:text-lg">
            {SCREEN_TITLES[currentScreen]}
          </h1>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Jetpack Compose • Room • Offline-first
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick action buttons if on dashboard */}
        {isRoot && (
          <div className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => onNavigate('income')}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Revenu
            </button>
            <button
              onClick={() => onNavigate('expense')}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Dépense
            </button>
          </div>
        )}

        {/* Assistant Financier Gemini */}
        <button
          onClick={() => onNavigate('assistant')}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
            currentScreen === 'assistant'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300'
          }`}
          title="Assistant Financier Gemini"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Notifications Bell Button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Centre d’alertes & notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white dark:ring-zinc-900">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Lock button if lock enabled */}
        {isLockEnabled && onLockApp && (
          <button
            onClick={onLockApp}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Verrouiller l’application"
          >
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {/* Categories Button */}
        {onOpenCategoryManager && (
          <button
            onClick={onOpenCategoryManager}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Gérer les catégories"
          >
            <FolderKanban className="h-4 w-4" />
          </button>
        )}

        {/* Android Native Source Code Button */}
        <button
          onClick={() => onOpenAndroidCode()}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
          title="Consulter le code Kotlin & architecture Android"
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Projet Android</span>
          <span className="md:hidden">Android</span>
        </button>

        {/* Dark/Light toggle */}
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title={darkTheme ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {darkTheme ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
