import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Flame,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Budget, Transaction, Category, BudgetCalculation, BudgetAlertStatus } from '../types';
import { formatFCFA } from '../services/storage';
import { CategoryIcon } from '../components/CategoryIcon';
import { BudgetModal } from '../components/BudgetModal';
import {
  MONTH_NAMES_FR,
  getBudgetAlertStatus,
  computeBudgetCalculation
} from '../utils/budgetUtils';

interface BudgetsScreenProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories?: Category[];
  onAddBudget: (category: string, allocatedAmount: number) => void;
  onSaveBudget?: (data: {
    id?: string;
    category: string;
    allocatedAmount: number;
    month: number;
    year: number;
    isGlobal?: boolean;
  }) => void;
  onUpdateBudget?: (id: string, updates: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
  onApplyTestScenario?: (scenario: 'normal' | 'warning' | 'critical' | 'exceeded') => void;
  onOpenCategoryManager?: () => void;
}

export const BudgetsScreen: React.FC<BudgetsScreenProps> = ({
  budgets,
  transactions,
  categories = [],
  onAddBudget,
  onSaveBudget,
  onDeleteBudget,
  onApplyTestScenario,
  onOpenCategoryManager
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [activeFilter, setActiveFilter] = useState<'ALL' | BudgetAlertStatus>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const isCurrentMonthSelected =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  // Filter budgets for the selected month and year
  const monthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  // Find global budget for the selected month (if any)
  const globalBudget = useMemo(() => {
    return monthBudgets.find(b => b.isGlobal || b.category.toUpperCase() === 'GLOBAL');
  }, [monthBudgets]);

  // Category budgets (excluding global)
  const categoryBudgets = useMemo(() => {
    return monthBudgets.filter(b => !b.isGlobal && b.category.toUpperCase() !== 'GLOBAL');
  }, [monthBudgets]);

  // Calculations for each category budget
  const categoryCalculations: BudgetCalculation[] = useMemo(() => {
    return categoryBudgets.map(b => computeBudgetCalculation(b, transactions));
  }, [categoryBudgets, transactions]);

  // Total expense of the selected month
  const totalMonthExpense = useMemo(() => {
    return transactions
      .filter(tx => {
        if (tx.type !== 'EXPENSE') return false;
        const d = new Date(tx.timestamp || tx.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, selectedMonth, selectedYear]);

  // Global Budget calculations
  const globalCalculation = useMemo(() => {
    if (globalBudget) {
      return computeBudgetCalculation(globalBudget, transactions);
    }
    // If no explicit global budget, construct a fallback from sum of category budgets
    const sumAllocated = categoryBudgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
    const remaining = sumAllocated - totalMonthExpense;
    const percentage = sumAllocated > 0 ? (totalMonthExpense / sumAllocated) * 100 : 0;
    const alert = getBudgetAlertStatus(percentage);
    return {
      budget: {
        id: 'virtual-global',
        category: 'GLOBAL',
        allocatedAmount: sumAllocated,
        month: selectedMonth,
        year: selectedYear,
        isGlobal: true
      },
      allocatedAmount: sumAllocated,
      spentAmount: totalMonthExpense,
      remainingAmount: remaining,
      percentage,
      alertStatus: alert.status,
      alertLabel: alert.label,
      isExceeded: totalMonthExpense > sumAllocated && sumAllocated > 0,
      exceededAmount: Math.max(0, totalMonthExpense - sumAllocated)
    };
  }, [globalBudget, categoryBudgets, transactions, totalMonthExpense, selectedMonth, selectedYear]);

  // Filtered list of category calculations
  const filteredCategoryCalculations = useMemo(() => {
    if (activeFilter === 'ALL') return categoryCalculations;
    return categoryCalculations.filter(c => c.alertStatus === activeFilter);
  }, [categoryCalculations, activeFilter]);

  // Count alerts across this month's budgets
  const alertCounts = useMemo(() => {
    const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0, EXCEEDED: 0 };
    categoryCalculations.forEach(c => {
      counts[c.alertStatus]++;
    });
    return counts;
  }, [categoryCalculations]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleSaveBudget = (data: {
    id?: string;
    category: string;
    allocatedAmount: number;
    month: number;
    year: number;
    isGlobal?: boolean;
  }) => {
    if (onSaveBudget) {
      onSaveBudget(data);
    } else {
      onAddBudget(data.category, data.allocatedAmount);
    }
    showNotification(
      data.id ? 'Budget mis à jour avec succès.' : 'Nouveau budget enregistré.'
    );
  };

  const confirmDelete = () => {
    if (budgetToDelete) {
      onDeleteBudget(budgetToDelete.id);
      showNotification('Budget supprimé avec succès.');
      setBudgetToDelete(null);
    }
  };

  const handleScenarioClick = (scenario: 'normal' | 'warning' | 'critical' | 'exceeded') => {
    if (onApplyTestScenario) {
      onApplyTestScenario(scenario);
      const labels = {
        normal: 'Scénario 1 appliqué : Situation normale (< 70%)',
        warning: 'Scénario 2 appliqué : Attention (70 à 89%)',
        critical: 'Scénario 3 appliqué : Proche de la limite (90 à 99%)',
        exceeded: 'Scénario 4 appliqué : Budget dépassé (≥ 100%)'
      };
      showNotification(labels[scenario]);
    }
  };

  const monthLabel = `${MONTH_NAMES_FR[selectedMonth]} ${selectedYear}`;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900/95 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-md dark:bg-zinc-100 dark:text-zinc-900 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Month Navigator Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Mois précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base">
                {monthLabel}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Mois suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {!isCurrentMonthSelected && (
            <button
              onClick={handleResetToCurrentMonth}
              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              Ce mois-ci
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {onOpenCategoryManager && (
            <button
              onClick={onOpenCategoryManager}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <FolderKanban className="h-3.5 w-3.5 text-zinc-500" />
              <span>Catégories</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau budget</span>
          </button>
        </div>
      </div>

      {/* Global Monthly Budget Envelope Card */}
      {(() => {
        const visual = getBudgetAlertStatus(globalCalculation.percentage);
        const hasExplicitGlobal = Boolean(globalBudget);

        return (
          <div
            className={`relative overflow-hidden rounded-3xl bg-linear-to-br p-6 text-white shadow-lg transition-all ${
              globalCalculation.alertStatus === 'EXCEEDED'
                ? 'from-rose-900 via-rose-950 to-zinc-950 ring-2 ring-rose-500'
                : globalCalculation.alertStatus === 'CRITICAL'
                ? 'from-orange-950 via-zinc-900 to-zinc-950'
                : globalCalculation.alertStatus === 'WARNING'
                ? 'from-amber-950 via-teal-950 to-zinc-950'
                : 'from-teal-800 via-emerald-900 to-zinc-950'
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
                    <Wallet className="h-4 w-4 text-emerald-200" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
                      {hasExplicitGlobal
                        ? 'Budget global mensuel'
                        : 'Enveloppe globale (somme des catégories)'}
                    </span>
                    <p className="text-[11px] text-emerald-100/70">{monthLabel}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
                    {formatFCFA(globalCalculation.allocatedAmount)}
                  </h2>
                  <span className="text-xs font-semibold text-emerald-100/80">prévu</span>
                </div>
              </div>

              {/* Status Badge & Edit */}
              <div className="flex items-center gap-2 self-start">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-sm ${visual.badgeBg} ${visual.badgeText} ${visual.badgeBorder}`}
                >
                  {globalCalculation.alertStatus === 'EXCEEDED' && (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {globalCalculation.alertStatus === 'CRITICAL' && (
                    <Flame className="h-3.5 w-3.5 text-orange-600" />
                  )}
                  {globalCalculation.alertStatus === 'WARNING' && (
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  {globalCalculation.alertStatus === 'NORMAL' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <span>{globalCalculation.alertLabel}</span>
                </span>

                <button
                  onClick={() => {
                    if (globalBudget) {
                      handleEditBudget(globalBudget);
                    } else {
                      setEditingBudget({
                        id: '',
                        category: 'GLOBAL',
                        allocatedAmount: globalCalculation.allocatedAmount || 300000,
                        month: selectedMonth,
                        year: selectedYear,
                        isGlobal: true
                      });
                      setIsModalOpen(true);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-xs transition hover:bg-white/25 active:scale-95"
                  title="Modifier le budget global"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-black/25 p-4 backdrop-blur-xs sm:grid-cols-4">
              <div>
                <span className="text-[11px] font-medium text-emerald-100/70">Montant prévu</span>
                <p className="text-sm font-bold text-white">
                  {formatFCFA(globalCalculation.allocatedAmount)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-emerald-100/70">Dépensé réalisé</span>
                <p className="text-sm font-bold text-white">
                  {formatFCFA(globalCalculation.spentAmount)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-emerald-100/70">
                  {globalCalculation.isExceeded ? 'Dépassement' : 'Montant restant'}
                </span>
                <p
                  className={`text-sm font-black ${
                    globalCalculation.isExceeded
                      ? 'text-rose-300'
                      : 'text-emerald-200'
                  }`}
                >
                  {globalCalculation.isExceeded
                    ? `- ${formatFCFA(globalCalculation.exceededAmount)}`
                    : formatFCFA(globalCalculation.remainingAmount)}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-emerald-100/70">Consommé</span>
                <p className="text-sm font-black text-white">
                  {Math.round(globalCalculation.percentage)}%
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-emerald-100/80 mb-1">
                <span>Progression mensuelle</span>
                <span className="font-bold">{Math.round(globalCalculation.percentage)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${visual.progressBarColor}`}
                  style={{ width: `${Math.min(100, globalCalculation.percentage)}%` }}
                />
              </div>
            </div>

            {/* Critical Exceeded Warning Banner */}
            {globalCalculation.isExceeded && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-400/40 p-3 text-xs text-rose-200 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" />
                <span>
                  Attention : Votre enveloppe mensuelle est dépassée de{' '}
                  <strong className="underline text-white">
                    {formatFCFA(globalCalculation.exceededAmount)}
                  </strong>
                  . Réduisez vos dépenses ou réajustez votre budget.
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Interactive Scenario Tester (Demande explicite de l'utilisateur : "Teste plusieurs scénarios, notamment budget dépassé") */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
              Simulateur & Tests de Scénarios
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Validez en un clic les 4 niveaux d'alerte officiels
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => handleScenarioClick('normal')}
            className="flex flex-col items-start gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-left transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>&lt; 70%</span>
            </div>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
              Situation normale (~46%)
            </span>
          </button>

          <button
            onClick={() => handleScenarioClick('warning')}
            className="flex flex-col items-start gap-1 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-left transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>70 à 89%</span>
            </div>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
              Attention (~77%)
            </span>
          </button>

          <button
            onClick={() => handleScenarioClick('critical')}
            className="flex flex-col items-start gap-1 rounded-xl border border-orange-200 bg-orange-50/70 p-2.5 text-left transition hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-orange-800 dark:text-orange-300">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>90 à 99%</span>
            </div>
            <span className="text-[10px] text-orange-700/80 dark:text-orange-400">
              Proche limite (~94%)
            </span>
          </button>

          <button
            onClick={() => handleScenarioClick('exceeded')}
            className="flex flex-col items-start gap-1 rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 text-left transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40"
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>≥ 100%</span>
            </div>
            <span className="text-[10px] text-rose-700/80 dark:text-rose-400">
              Budget dépassé (~126%)
            </span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Alert Threshold */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base">
          Budgets par catégorie ({categoryBudgets.length})
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            Tous ({categoryCalculations.length})
          </button>

          <button
            onClick={() => setActiveFilter('NORMAL')}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Normal ({alertCounts.NORMAL})</span>
          </button>

          <button
            onClick={() => setActiveFilter('WARNING')}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'WARNING'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Attention ({alertCounts.WARNING})</span>
          </button>

          <button
            onClick={() => setActiveFilter('CRITICAL')}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'CRITICAL'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <span>Limite ({alertCounts.CRITICAL})</span>
          </button>

          <button
            onClick={() => setActiveFilter('EXCEEDED')}
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'EXCEEDED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Dépassé ({alertCounts.EXCEEDED})</span>
          </button>
        </div>
      </div>

      {/* Category Budgets Grid / List */}
      {filteredCategoryCalculations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <Wallet className="mx-auto h-10 w-10 text-zinc-400" />
          <h4 className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {categoryBudgets.length === 0
              ? `Aucun budget par catégorie pour ${monthLabel}`
              : 'Aucun budget ne correspond à ce filtre'}
          </h4>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
            Définissez des plafonds par poste (Alimentation, Transport, Logement...) pour maîtriser
            vos dépenses avec précision.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Créer un budget pour {monthLabel}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredCategoryCalculations.map(calc => {
            const { budget, allocatedAmount, spentAmount, remainingAmount, percentage, alertStatus, alertLabel, isExceeded, exceededAmount } = calc;
            const visual = getBudgetAlertStatus(percentage);
            const catObj = categories.find(c => c.name === budget.category);

            return (
              <div
                key={budget.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4.5 shadow-2xs transition hover:shadow-md dark:bg-zinc-900 ${visual.cardBorder}`}
              >
                <div>
                  {/* Category Header & Alert Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs"
                        style={{ backgroundColor: catObj?.color || '#059669' }}
                      >
                        <CategoryIcon name={catObj?.icon || 'Tag'} className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{budget.category}</span>
                          {catObj?.isCustom && (
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              Perso
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Plafond : {formatFCFA(allocatedAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Alert Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${visual.badgeBg} ${visual.badgeText} ${visual.badgeBorder}`}
                    >
                      {isExceeded && <AlertTriangle className="h-3 w-3 text-rose-600" />}
                      {alertStatus === 'CRITICAL' && <Flame className="h-3 w-3 text-orange-600" />}
                      {alertStatus === 'WARNING' && <Clock className="h-3 w-3 text-amber-600" />}
                      {alertStatus === 'NORMAL' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                      <span>{alertLabel}</span>
                    </span>
                  </div>

                  {/* Calculations Details */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50/80 p-2.5 text-center dark:bg-zinc-800/40">
                    <div>
                      <span className="text-[10px] text-zinc-400">Dépensé</span>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {formatFCFA(spentAmount)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400">
                        {isExceeded ? 'Dépassement' : 'Restant'}
                      </span>
                      <p
                        className={`text-xs font-black ${
                          isExceeded
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isExceeded
                          ? `- ${formatFCFA(exceededAmount)}`
                          : formatFCFA(remainingAmount)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400">Consommé</span>
                      <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                        {Math.round(percentage)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                      <span>Progression</span>
                      <span className="font-bold">{Math.round(percentage)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${visual.progressBarColor}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Exceeded alert text */}
                  {isExceeded && (
                    <p className="mt-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Dépassement de {formatFCFA(exceededAmount)} sur ce poste !</span>
                    </p>
                  )}
                </div>

                {/* Edit and Delete Actions */}
                <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <button
                    onClick={() => handleEditBudget(budget)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={() => setBudgetToDelete(budget)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:border dark:border-zinc-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>

            <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
              Supprimer ce budget ?
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Êtes-vous sûr de vouloir supprimer le budget pour{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {budgetToDelete.isGlobal ? 'l’enveloppe globale' : budgetToDelete.category}
              </strong>{' '}
              de {MONTH_NAMES_FR[budgetToDelete.month]} {budgetToDelete.year} ?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        initialBudget={editingBudget}
        categories={categories}
        transactions={transactions}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />
    </div>
  );
};
