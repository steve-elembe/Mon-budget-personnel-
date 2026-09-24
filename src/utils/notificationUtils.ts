/**
 * Utilitaires de notifications pour « Mon Budget »
 * - Alertes de seuil budgétaire : 70 %, 90 % et Dépassement (100 %+)
 * - Rappels d'objectifs d'épargne
 * - Gestion granulaire des permissions Android (POST_NOTIFICATIONS / Web Notifications)
 * - Demande la permission UNIQUEMENT quand l'utilisateur l'active explicitement
 */

import {
  Budget,
  Transaction,
  SavingsGoal,
  NotificationSettings,
  AppNotification,
  AppNotificationType
} from '../types';
import { formatFCFA } from '../services/storage';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  alert70Enabled: true,
  alert90Enabled: true,
  alertExceededEnabled: true,
  savingsRemindersEnabled: true,
  systemNotificationsEnabled: false
};

/**
 * Demande la permission de notification système (Android 13+ POST_NOTIFICATIONS / Web)
 * Appelée UNIQUEMENT à la demande explicite de l'utilisateur.
 */
export async function requestAndroidNotificationPermission(): Promise<{
  granted: boolean;
  status: 'granted' | 'denied' | 'default' | 'unsupported';
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      granted: false,
      status: 'unsupported',
      message: 'Les notifications système ne sont pas supportées par ce navigateur.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return {
        granted: true,
        status: 'granted',
        message: 'Permission accordée ! Vous recevrez les alertes budgétaires en temps réel.'
      };
    } else if (permission === 'denied') {
      return {
        granted: false,
        status: 'denied',
        message: 'Permission refusée. Vous pouvez toujours consulter les alertes dans l’application.'
      };
    } else {
      return {
        granted: false,
        status: 'default',
        message: 'Permission non accordée.'
      };
    }
  } catch (err) {
    console.error('Erreur demande permission notifications:', err);
    return {
      granted: false,
      status: 'denied',
      message: 'Impossible de demander la permission de notifications.'
    };
  }
}

/**
 * Affiche une notification système Android / navigateur si la permission est accordée
 */
export function sendAndroidSystemNotification(
  title: string,
  body: string,
  tag?: string
): boolean {
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(title, {
        body,
        icon: '/icon.png',
        tag: tag || 'mon-budget-alert',
        badge: '/icon.png'
      });
      return true;
    } catch (e) {
      console.debug('Notification système bloquée par le navigateur/iframe:', e);
    }
  }
  return false;
}

/**
 * Analyse les budgets et l'épargne pour générer les alertes requises
 * Seuils : 70%, 90%, Dépassement 100%+ et Rappels d'épargne
 */
export function evaluateFinancialNotifications(params: {
  budgets: Budget[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  settings: NotificationSettings;
  existingNotifications: AppNotification[];
  currentDate?: Date;
  currency?: string;
}): { newNotifications: AppNotification[]; hasAlerts: boolean } {
  const {
    budgets,
    transactions,
    savingsGoals,
    settings,
    existingNotifications,
    currentDate = new Date(),
    currency = 'FCFA'
  } = params;

  if (!settings.enabled) {
    return { newNotifications: [], hasAlerts: false };
  }

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filtrer les dépenses du mois en cours
  const monthExpenses = transactions.filter(t => {
    if (t.type !== 'EXPENSE') return false;
    const [y, m] = t.date.split('-').map(Number);
    return y === currentYear && m - 1 === currentMonth;
  });

  const totalSpentMonth = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  const existingIds = new Set(existingNotifications.map(n => n.id));
  const createdNotifications: AppNotification[] = [];

  // 1. Analyse des budgets (Global et par Catégorie)
  for (const budget of budgets) {
    // Vérifier si le budget correspond au mois actuel
    if (budget.month !== currentMonth || budget.year !== currentYear) {
      continue;
    }

    const isGlobal = Boolean(budget.isGlobal || budget.category.toUpperCase() === 'GLOBAL');
    const spent = isGlobal
      ? totalSpentMonth
      : monthExpenses
          .filter(t => t.category.trim().toLowerCase() === budget.category.trim().toLowerCase())
          .reduce((sum, t) => sum + t.amount, 0);

    const allocated = budget.allocatedAmount;
    if (allocated <= 0) continue;

    const ratio = (spent / allocated) * 100;
    const catLabel = isGlobal ? 'Budget Global' : `Budget « ${budget.category} »`;
    const budgetIdKey = `${budget.id}_${currentYear}_${currentMonth}`;

    // Avertissement lorsque le budget est dépassé (>= 100%)
    if (ratio >= 100 && settings.alertExceededEnabled) {
      const notifId = `notif_exceeded_${budgetIdKey}`;
      if (!existingIds.has(notifId)) {
        const diff = spent - allocated;
        const notif: AppNotification = {
          id: notifId,
          type: 'BUDGET_EXCEEDED',
          title: `Dépassement du ${catLabel} !`,
          message: `Dépensé : ${formatFCFA(spent, currency)} sur ${formatFCFA(allocated, currency)} prévu (+${formatFCFA(diff, currency)} de dépassement).`,
          timestamp: Date.now(),
          read: false,
          linkScreen: 'budgets',
          level: 'danger'
        };
        createdNotifications.push(notif);
        existingIds.add(notifId);

        if (settings.systemNotificationsEnabled) {
          sendAndroidSystemNotification(notif.title, notif.message, notifId);
        }
      }
    }
    // Avertissement à 90% (entre 90% et 100%)
    else if (ratio >= 90 && ratio < 100 && settings.alert90Enabled) {
      const notifId = `notif_90_${budgetIdKey}`;
      if (!existingIds.has(notifId)) {
        const remaining = allocated - spent;
        const notif: AppNotification = {
          id: notifId,
          type: 'BUDGET_90',
          title: `Alerte 90% : ${catLabel}`,
          message: `Vous avez consommé ${ratio.toFixed(0)} % du budget. Il vous reste seulement ${formatFCFA(remaining, currency)}.`,
          timestamp: Date.now(),
          read: false,
          linkScreen: 'budgets',
          level: 'warning'
        };
        createdNotifications.push(notif);
        existingIds.add(notifId);

        if (settings.systemNotificationsEnabled) {
          sendAndroidSystemNotification(notif.title, notif.message, notifId);
        }
      }
    }
    // Avertissement lorsque le budget atteint 70% (entre 70% et 90%)
    else if (ratio >= 70 && ratio < 90 && settings.alert70Enabled) {
      const notifId = `notif_70_${budgetIdKey}`;
      if (!existingIds.has(notifId)) {
        const remaining = allocated - spent;
        const notif: AppNotification = {
          id: notifId,
          type: 'BUDGET_70',
          title: `Avertissement 70% : ${catLabel}`,
          message: `70 % du budget est atteint (${ratio.toFixed(0)} % utilisé). Solde disponible : ${formatFCFA(remaining, currency)}.`,
          timestamp: Date.now(),
          read: false,
          linkScreen: 'budgets',
          level: 'info'
        };
        createdNotifications.push(notif);
        existingIds.add(notifId);

        if (settings.systemNotificationsEnabled) {
          sendAndroidSystemNotification(notif.title, notif.message, notifId);
        }
      }
    }
  }

  // 2. Rappel facultatif concernant les objectifs d'épargne
  if (settings.savingsRemindersEnabled) {
    for (const goal of savingsGoals) {
      const goalKey = `${goal.id}_${currentYear}_${currentMonth}`;
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

      // Rappel si échéance proche (date cible définie)
      if (goal.targetDate) {
        const targetDateObj = new Date(goal.targetDate);
        const diffDays = Math.ceil((targetDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 15 && progress < 100) {
          const notifId = `notif_savings_due_${goalKey}`;
          if (!existingIds.has(notifId)) {
            const missing = goal.targetAmount - goal.currentAmount;
            const notif: AppNotification = {
              id: notifId,
              type: 'SAVINGS_REMINDER',
              title: `Rappel épargne : ${goal.name}`,
              message: `Échéance dans ${diffDays} jour${diffDays > 1 ? 's' : ''} ! Il vous reste ${formatFCFA(missing, currency)} à épargner (${progress.toFixed(0)}% atteint).`,
              timestamp: Date.now(),
              read: false,
              linkScreen: 'savings',
              level: 'info'
            };
            createdNotifications.push(notif);
            existingIds.add(notifId);

            if (settings.systemNotificationsEnabled) {
              sendAndroidSystemNotification(notif.title, notif.message, notifId);
            }
          }
        }
      } else if (progress < 50) {
        // Rappel d'encouragement périodique si l'objectif avance lentement
        const notifId = `notif_savings_boost_${goalKey}`;
        if (!existingIds.has(notifId)) {
          const notif: AppNotification = {
            id: notifId,
            type: 'SAVINGS_REMINDER',
            title: `Objectif d'épargne : ${goal.name}`,
            message: `Pensez à alimenter votre cagnotte (${formatFCFA(goal.currentAmount, currency)} / ${formatFCFA(goal.targetAmount, currency)} atteints).`,
            timestamp: Date.now(),
            read: false,
            linkScreen: 'savings',
            level: 'info'
          };
          createdNotifications.push(notif);
          existingIds.add(notifId);
        }
      }
    }
  }

  return {
    newNotifications: createdNotifications,
    hasAlerts: createdNotifications.length > 0
  };
}
