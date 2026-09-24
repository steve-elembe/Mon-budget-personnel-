import { Budget, Transaction, BudgetCalculation, BudgetAlertStatus } from '../types';

export const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

export interface AlertVisuals {
  status: BudgetAlertStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  progressBarColor: string;
  cardBorder: string;
  accentText: string;
  iconType: 'check' | 'alert' | 'warning' | 'critical';
}

/**
 * Visual alerts rule:
 * - moins de 70 % : situation normale
 * - 70 à 89 % : attention
 * - 90 à 99 % : proche de la limite
 * - 100 % ou plus : budget dépassé
 */
export function getBudgetAlertStatus(percentage: number): AlertVisuals {
  const rounded = Math.round(percentage);

  if (rounded >= 100) {
    return {
      status: 'EXCEEDED',
      label: 'Budget dépassé',
      badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
      badgeText: 'text-rose-700 dark:text-rose-300 font-bold',
      badgeBorder: 'border border-rose-300 dark:border-rose-800',
      progressBarColor: 'bg-rose-600 dark:bg-rose-500',
      cardBorder: 'border-rose-300 dark:border-rose-800 shadow-rose-500/10',
      accentText: 'text-rose-600 dark:text-rose-400',
      iconType: 'critical'
    };
  } else if (rounded >= 90) {
    return {
      status: 'CRITICAL',
      label: 'Proche de la limite',
      badgeBg: 'bg-orange-100 dark:bg-orange-950/80',
      badgeText: 'text-orange-800 dark:text-orange-300 font-bold',
      badgeBorder: 'border border-orange-300 dark:border-orange-800',
      progressBarColor: 'bg-orange-500 dark:bg-orange-400',
      cardBorder: 'border-orange-300 dark:border-orange-800 shadow-orange-500/10',
      accentText: 'text-orange-600 dark:text-orange-400',
      iconType: 'warning'
    };
  } else if (rounded >= 70) {
    return {
      status: 'WARNING',
      label: 'Attention',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
      badgeText: 'text-amber-800 dark:text-amber-300 font-bold',
      badgeBorder: 'border border-amber-300 dark:border-amber-800',
      progressBarColor: 'bg-amber-500 dark:bg-amber-400',
      cardBorder: 'border-amber-200 dark:border-amber-900/60 shadow-amber-500/5',
      accentText: 'text-amber-600 dark:text-amber-400',
      iconType: 'alert'
    };
  } else {
    return {
      status: 'NORMAL',
      label: 'Situation normale',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
      badgeText: 'text-emerald-800 dark:text-emerald-300 font-bold',
      badgeBorder: 'border border-emerald-300 dark:border-emerald-800',
      progressBarColor: 'bg-emerald-500 dark:bg-emerald-400',
      cardBorder: 'border-zinc-200 dark:border-zinc-800 shadow-2xs',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      iconType: 'check'
    };
  }
}

/**
 * Calculates budget metrics strictly from recorded transactions for the budget's month and year.
 * Formula: budget restant = budget prévu - dépenses réalisées
 */
export function computeBudgetCalculation(
  budget: Budget,
  transactions: Transaction[]
): BudgetCalculation {
  const isGlobal = budget.isGlobal || budget.category.toUpperCase() === 'GLOBAL';

  // Filter strictly recorded expense transactions for this month and year
  const matchingExpenses = transactions.filter(tx => {
    if (tx.type !== 'EXPENSE') return false;
    const d = new Date(tx.timestamp || tx.date);
    const inMonth = d.getMonth() === budget.month;
    const inYear = d.getFullYear() === budget.year;
    if (!inMonth || !inYear) return false;

    if (isGlobal) {
      return true;
    }
    return tx.category.trim().toLowerCase() === budget.category.trim().toLowerCase();
  });

  const spentAmount = matchingExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const allocatedAmount = budget.allocatedAmount;
  // Formula requested: budget restant = budget prévu - dépenses réalisées
  const remainingAmount = allocatedAmount - spentAmount;
  const percentage = allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0;
  const alertInfo = getBudgetAlertStatus(percentage);
  const isExceeded = spentAmount > allocatedAmount;
  const exceededAmount = Math.max(0, spentAmount - allocatedAmount);

  return {
    budget,
    allocatedAmount,
    spentAmount,
    remainingAmount,
    percentage,
    alertStatus: alertInfo.status,
    alertLabel: alertInfo.label,
    isExceeded,
    exceededAmount
  };
}
