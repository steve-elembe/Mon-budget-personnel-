import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  Wallet,
  CheckCircle2,
  Clock,
  Flame,
  ChevronRight,
  PiggyBank,
  Target,
  Sparkles
} from 'lucide-react';
import { DashboardSummary, Transaction, ScreenName, Category, Budget, SavingsGoal } from '../types';
import { formatFCFA } from '../services/storage';
import { CategoryIcon } from '../components/CategoryIcon';
import { getBudgetAlertStatus, computeBudgetCalculation, MONTH_NAMES_FR } from '../utils/budgetUtils';

interface DashboardScreenProps {
  summary: DashboardSummary;
  recentTransactions: Transaction[];
  categories?: Category[];
  budgets?: Budget[];
  savingsGoals?: SavingsGoal[];
  onNavigate: (screen: ScreenName) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenCategoryManager?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  summary,
  recentTransactions,
  categories = [],
  budgets = [],
  savingsGoals = [],
  onNavigate,
  onOpenCategoryManager
}) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Active month budgets
  const activeMonthBudgets = budgets.filter(
    b => b.month === currentMonth && b.year === currentYear
  );

  // Category budgets for preview (limit to top 4)
  const categoryBudgetsPreview = activeMonthBudgets
    .filter(b => !b.isGlobal && b.category.toUpperCase() !== 'GLOBAL')
    .slice(0, 4);

  // Accurate budget calculations
  const budgetPercentage = summary.totalBudget > 0
    ? (summary.totalExpenseMonth / summary.totalBudget) * 100
    : 0;

  const budgetVisual = getBudgetAlertStatus(budgetPercentage);
  const isBudgetExceeded = summary.totalBudget > 0 && summary.totalExpenseMonth > summary.totalBudget;
  const exceededAmount = Math.max(0, summary.totalExpenseMonth - summary.totalBudget);

  const savingsProgress =
    summary.targetSavings > 0
      ? Math.min(100, Math.round((summary.totalSavings / summary.targetSavings) * 100))
      : 0;

  const currentMonthName = `${MONTH_NAMES_FR[currentMonth]} ${currentYear}`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Date banner & Category shortcut */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="capitalize">{currentMonthName}</span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenCategoryManager && (
            <button
              onClick={onOpenCategoryManager}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl"
            >
              <FolderKanban className="w-3 h-3" />
              <span>Gérer les catégories</span>
            </button>
          )}
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            Room DB • En ligne
          </span>
        </div>
      </div>

      {/* Critical Alert Banner if budget exceeded or close to limit */}
      {isBudgetExceeded && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-600 p-4 text-white shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black">ALERTE : Budget mensuel dépassé !</h4>
              <p className="text-xs text-rose-100">
                Vous avez dépassé votre plafond prévu de{' '}
                <span className="font-bold underline">{formatFCFA(exceededAmount)}</span> ({Math.round(budgetPercentage)}% consommé).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('budgets')}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-50"
          >
            Ajuster le budget
          </button>
        </div>
      )}

      {budgetVisual.status === 'CRITICAL' && !isBudgetExceeded && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-orange-600 p-3.5 text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <Flame className="h-5 w-5 text-orange-200 shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Attention : Proche de la limite budgétaire ({Math.round(budgetPercentage)}%)</h4>
              <p className="text-[11px] text-orange-100">
                Il ne vous reste que {formatFCFA(summary.remainingBudget)} sur votre budget de ce mois.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('budgets')}
            className="shrink-0 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/30"
          >
            Détails
          </button>
        </div>
      )}

      {/* Hero Solde Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-100/90">
              Solde Actuel Global
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-2.5 py-0.5 text-[11px] text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Temps réel</span>
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {formatFCFA(summary.currentBalance)}
            </h2>
          </div>

          <p className="mt-1 text-xs text-emerald-200/80">
            Trésorerie nette après calcul de tous les flux réels
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              onClick={() => onNavigate('income')}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-3 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/30 active:scale-95"
            >
              <ArrowDownRight className="h-4 w-4 text-emerald-300" />
              <span>+ Revenu</span>
            </button>

            <button
              onClick={() => onNavigate('expense')}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-3 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/30 active:scale-95"
            >
              <ArrowUpRight className="h-4 w-4 text-rose-300" />
              <span>- Dépense</span>
            </button>

            <button
              onClick={() => onNavigate('budgets')}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-3 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/30 active:scale-95"
            >
              <TrendingDown className="h-4 w-4 text-amber-300" />
              <span>Budgets</span>
            </button>

            <button
              onClick={() => onNavigate('savings')}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-3 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/30 active:scale-95"
            >
              <TrendingUp className="h-4 w-4 text-cyan-300" />
              <span>Épargne</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (4 columns on desktop, 2 columns on mobile) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenus du Mois */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Revenus du mois
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-700 dark:text-emerald-400">
            +{formatFCFA(summary.totalIncomeMonth)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Entrées de ce mois</p>
        </div>

        {/* Total Dépenses du Mois */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Dépenses du mois
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-rose-600 dark:text-rose-400">
            -{formatFCFA(summary.totalExpenseMonth)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Sorties enregistrées</p>
        </div>

        {/* Budget Restant avec Alerte Officielle */}
        <div
          onClick={() => onNavigate('budgets')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-2xs transition hover:shadow-md dark:bg-zinc-900 ${
            isBudgetExceeded
              ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20'
              : 'border-zinc-200 bg-white dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {isBudgetExceeded ? 'Dépassement budget' : 'Budget restant'}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${budgetVisual.badgeBg} ${budgetVisual.badgeText}`}
            >
              {budgetVisual.label}
            </span>
          </div>

          <div
            className={`mt-2 text-lg font-black ${
              isBudgetExceeded
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {isBudgetExceeded
              ? `- ${formatFCFA(exceededAmount)}`
              : formatFCFA(summary.remainingBudget)}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetVisual.progressBarColor}`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Prévu : {formatFCFA(summary.totalBudget)}</span>
            <span className="font-bold">{Math.round(budgetPercentage)}% consommé</span>
          </div>
        </div>

        {/* Progression de l'Épargne */}
        <div
          onClick={() => onNavigate('savings')}
          className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Progression épargne
            </span>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              {savingsProgress}% cible
            </span>
          </div>

          <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatFCFA(summary.totalSavings)}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${savingsProgress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">
            Objectif total : {formatFCFA(summary.targetSavings)}
          </p>
        </div>
      </div>

      {/* Assistant Financier Gemini Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-100/50 p-4 shadow-2xs dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-zinc-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                  Assistant Financier Gemini
                </h3>
                <span className="rounded-full bg-emerald-200/70 px-1.5 py-0.2 text-[9px] font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                  IA
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                Analyse de vos dépenses, calculs budgétaires réels & conseils personnalisés.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('assistant')}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
          >
            <span>Consulter</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Aperçu du Module de Budget (Demande explicite : mise à jour automatique du tableau de bord) */}
      {categoryBudgetsPreview.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                Suivi budgétaire de {MONTH_NAMES_FR[currentMonth]}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <span>Voir tous ({activeMonthBudgets.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {categoryBudgetsPreview.map(b => {
              const calc = computeBudgetCalculation(b, recentTransactions);
              const vis = getBudgetAlertStatus(calc.percentage);
              const catObj = categories.find(c => c.name === b.category);

              return (
                <div
                  key={b.id}
                  onClick={() => onNavigate('budgets')}
                  className="cursor-pointer rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/20 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs"
                        style={{ backgroundColor: catObj?.color || '#059669' }}
                      >
                        <CategoryIcon name={catObj?.icon || 'Tag'} className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {b.category}
                      </span>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${vis.badgeBg} ${vis.badgeText}`}
                    >
                      {vis.label}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Dépensé : {formatFCFA(calc.spentAmount)}</span>
                    <span className={calc.isExceeded ? 'font-bold text-rose-600' : 'font-semibold'}>
                      {calc.isExceeded
                        ? `- ${formatFCFA(calc.exceededAmount)}`
                        : `Reste : ${formatFCFA(calc.remainingAmount)}`}
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${vis.progressBarColor}`}
                      style={{ width: `${Math.min(100, calc.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aperçu du Module Épargne & Projets */}
      {savingsGoals.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                Projets d'épargne en cours ({savingsGoals.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('savings')}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
            >
              <span>Gérer l'épargne</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {savingsGoals.slice(0, 3).map(goal => {
              const progress =
                goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                  : 0;
              const isDone = goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  onClick={() => onNavigate('savings')}
                  className="cursor-pointer rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 transition hover:border-cyan-200 hover:bg-cyan-50/20 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600 text-white">
                        <CategoryIcon name={goal.iconName || 'Target'} className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {goal.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-cyan-600 dark:text-cyan-400'
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{formatFCFA(goal.currentAmount)}</span>
                    <span>Cible : {formatFCFA(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Résumé des dernières transactions */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
            Dernières opérations Room
          </h3>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Voir tout le journal
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Aucune transaction enregistrée.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentTransactions.slice(0, 5).map(tx => {
              const isIncome = tx.type === 'INCOME';
              const catObj = categories.find(c => c.name === tx.category);

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                      style={{
                        backgroundColor:
                          catObj?.color || (isIncome ? '#10b981' : '#ef4444')
                      }}
                    >
                      <CategoryIcon
                        name={catObj?.icon || (isIncome ? 'Briefcase' : 'Tag')}
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                        {tx.description || tx.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {tx.category} • {tx.paymentMethod} • {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold sm:text-sm ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatFCFA(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
