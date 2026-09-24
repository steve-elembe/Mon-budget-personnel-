import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  AlertOctagon,
  Info,
  PiggyBank,
  CheckCheck,
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AppNotification, ScreenName } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigateToScreen: (screen: ScreenName) => void;
  onTestNotification: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onNavigateToScreen,
  onTestNotification
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'BUDGET_EXCEEDED':
        return <AlertOctagon className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      case 'BUDGET_90':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'BUDGET_70':
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'SAVINGS_REMINDER':
        return <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />;
    }
  };

  const getBadgeStyle = (level?: string) => {
    switch (level) {
      case 'danger':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-all dark:bg-zinc-900 sm:rounded-l-3xl border-l border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 sm:text-base">
                  Centre d'Alertes
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Seuils budgétaires (70%, 90%, 100%) & Rappels d'épargne
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-4 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-800/40 dark:text-zinc-400 sm:px-6">
          <button
            onClick={onTestNotification}
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            title="Envoyer une alerte de simulation"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tester une alerte</span>
          </button>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Tout lire</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Effacer</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-500 mb-3">
                <Bell className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Aucune alerte active
              </p>
              <p className="mt-1 text-xs text-zinc-400 max-w-xs">
                Vos budgets et vos objectifs d'épargne sont sous contrôle. Les alertes apparaîtront dès qu'un seuil (70%, 90% ou dépassement) sera atteint.
              </p>
              <button
                onClick={onTestNotification}
                className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Générer une notification de test
              </button>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.linkScreen) {
                    onNavigateToScreen(notif.linkScreen);
                    onClose();
                  }
                }}
                className={`group relative flex cursor-pointer gap-3 rounded-2xl border p-3.5 transition hover:shadow-md ${
                  notif.read
                    ? 'border-zinc-200/70 bg-white/70 dark:border-zinc-800/60 dark:bg-zinc-800/30 opacity-75'
                    : 'border-zinc-200 bg-white shadow-2xs dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {new Date(notif.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.linkScreen && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Accéder à {notif.linkScreen === 'budgets' ? 'vos budgets' : 'votre épargne'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
