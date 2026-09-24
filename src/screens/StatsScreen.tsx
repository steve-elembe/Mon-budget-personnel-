import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  PieChart,
  Award,
  Filter,
  ArrowUpDown,
  Coins,
  Wallet,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import { Transaction, DashboardSummary, Category, SavingsGoal } from '../types';
import { formatFCFA } from '../services/storage';
import {
  StatPeriod,
  calculateFinancialStats,
  MONTH_NAMES_FR_FULL,
  formatDateISO
} from '../utils/statsUtils';
import {
  TrendLineChart,
  IncomeExpenseComparison,
  CategoryBreakdownList,
  MonthlyStatsView
} from '../components/StatsCharts';
import { CategoryIcon } from '../components/CategoryIcon';

interface StatsScreenProps {
  transactions: Transaction[];
  summary: DashboardSummary;
  categories?: Category[];
  savingsGoals?: SavingsGoal[];
}

type TabType = 'overview' | 'categories' | 'trends' | 'annual';

export const StatsScreen: React.FC<StatsScreenProps> = ({
  transactions,
  categories = [],
  savingsGoals = []
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<StatPeriod>('THIS_MONTH');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [trendMetric, setTrendMetric] = useState<'balance' | 'both' | 'expense' | 'income'>('balance');

  // Custom date range state
  const now = new Date();
  const defaultStart = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [customStart, setCustomStart] = useState<string>(defaultStart);
  const [customEnd, setCustomEnd] = useState<string>(defaultEnd);

  // Compute all statistics reactively from real Room transactions
  const stats = useMemo(() => {
    return calculateFinancialStats(
      transactions,
      categories,
      selectedPeriod,
      customStart,
      customEnd,
      new Date()
    );
  }, [transactions, categories, selectedPeriod, customStart, customEnd]);

  const periods: { id: StatPeriod; label: string }[] = [
    { id: 'THIS_MONTH', label: 'Ce mois' },
    { id: 'PREV_MONTH', label: 'Mois précédent' },
    { id: 'LAST_3_MONTHS', label: '3 derniers mois' },
    { id: 'THIS_YEAR', label: 'Cette année' },
    { id: 'CUSTOM', label: 'Période personnalisée' }
  ];

  return (
    <div className="space-y-4 p-4 pb-12 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Statistiques Financières
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Analyses et métriques de trésorerie calculées sur les données Room
          </p>
        </div>

        {/* Badge with active period label */}
        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
          <Calendar className="h-3.5 w-3.5" />
          <span>{stats.dateRange.label}</span>
        </div>
      </div>

      {/* Period Selection Filter (Material 3 Horizontal Chips) */}
      <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
        {periods.map(p => {
          const isSelected = selectedPeriod === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs dark:bg-emerald-600'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Inputs (visible only if CUSTOM is selected) */}
      {selectedPeriod === 'CUSTOM' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 transition dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Sélection de la plage de dates personnalisée</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Date de début
              </label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Date de fin
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab bar Navigation */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-zinc-200/70 p-1 dark:bg-zinc-800/60">
        <button
          onClick={() => setActiveTab('overview')}
          className={`rounded-xl py-2 text-center text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Aperçu
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`rounded-xl py-2 text-center text-xs font-bold transition ${
            activeTab === 'categories'
              ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Catégories
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`rounded-xl py-2 text-center text-xs font-bold transition ${
            activeTab === 'trends'
              ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Évolution
        </button>
        <button
          onClick={() => setActiveTab('annual')}
          className={`rounded-xl py-2 text-center text-xs font-bold transition ${
            activeTab === 'annual'
              ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Annuel
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Key Metric Indicators Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Taux d'épargne */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Taux d'épargne
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Percent className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-xl font-black text-emerald-700 dark:text-emerald-400 sm:text-2xl">
                {stats.savingsRate}%
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-400">Part des revenus épargnée</p>
            </div>

            {/* Solde net de la période */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Solde net
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                    stats.netBalance >= 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  <Coins className="h-3.5 w-3.5" />
                </span>
              </div>
              <div
                className={`mt-2 text-lg font-black sm:text-xl truncate ${
                  stats.netBalance >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {stats.netBalance >= 0 ? '+' : ''}
                {formatFCFA(stats.netBalance)}
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-400">Sur la période choisie</p>
            </div>

            {/* Moyenne des dépenses */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Moyenne dépenses
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  <TrendingDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-lg font-bold text-rose-600 dark:text-rose-400 sm:text-xl truncate">
                {formatFCFA(stats.averageExpensePerDay)}
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-400">
                Par jour ({formatFCFA(stats.averageExpensePerTransaction)}/tx)
              </p>
            </div>

            {/* Moyenne des revenus */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Moyenne revenus
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-lg font-bold text-emerald-700 dark:text-emerald-400 sm:text-xl truncate">
                {formatFCFA(stats.averageIncomePerDay)}
              </div>
              <p className="mt-0.5 text-[10px] text-zinc-400">
                Par jour ({formatFCFA(stats.averageIncomePerTransaction)}/tx)
              </p>
            </div>
          </div>

          {/* Top Catégorie de Dépense Card */}
          {stats.topExpenseCategory && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/25">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Catégorie de dépense la plus importante
                  </span>
                </div>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                  {stats.topExpenseCategory.percentage}% du total
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-2xs"
                    style={{ backgroundColor: stats.topExpenseCategory.color }}
                  >
                    <CategoryIcon name={stats.topExpenseCategory.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      {stats.topExpenseCategory.category}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {stats.topExpenseCategory.count} transaction{stats.topExpenseCategory.count > 1 ? 's' : ''} enregistrée{stats.topExpenseCategory.count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 sm:text-base">
                    -{formatFCFA(stats.topExpenseCategory.amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Comparaison Revenus vs Dépenses */}
          <IncomeExpenseComparison
            totalIncome={stats.totalIncome}
            totalExpense={stats.totalExpense}
            netBalance={stats.netBalance}
            savingsRate={stats.savingsRate}
            expenseRatio={stats.expenseRatio}
          />

          {/* Évolution chronologique chart preview */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                  Évolution temporelle ({stats.dateRange.label})
                </h3>
              </div>

              {/* Metric selector pills */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTrendMetric('balance')}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    trendMetric === 'balance'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Solde
                </button>
                <button
                  onClick={() => setTrendMetric('both')}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    trendMetric === 'both'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Flux
                </button>
                <button
                  onClick={() => setTrendMetric('expense')}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    trendMetric === 'expense'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Dépenses
                </button>
                <button
                  onClick={() => setTrendMetric('income')}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    trendMetric === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Revenus
                </button>
              </div>
            </div>

            <div className="mt-3">
              <TrendLineChart points={stats.trendPoints} viewMode={trendMetric} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES (Dépenses et Revenus par catégorie) */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Top Dépenses par catégorie */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                  Dépenses par catégorie ({stats.expensesByCategory.length})
                </h3>
              </div>
              <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                -{formatFCFA(stats.totalExpense)}
              </span>
            </div>

            <div className="mt-3">
              <CategoryBreakdownList
                categories={stats.expensesByCategory}
                totalAmount={stats.totalExpense}
                type="EXPENSE"
                emptyMessage="Aucune dépense enregistrée sur cette période."
              />
            </div>
          </div>

          {/* Top Revenus par catégorie */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                  Revenus par catégorie ({stats.incomesByCategory.length})
                </h3>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                +{formatFCFA(stats.totalIncome)}
              </span>
            </div>

            <div className="mt-3">
              <CategoryBreakdownList
                categories={stats.incomesByCategory}
                totalAmount={stats.totalIncome}
                type="INCOME"
                emptyMessage="Aucun revenu enregistré sur cette période."
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRENDS (Évolution du solde, dépenses et revenus) */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                  Trajectoire et Dynamique de Trésorerie
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {stats.trendPoints.length} points temporels analysés
                </p>
              </div>

              {/* View options */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTrendMetric('balance')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    trendMetric === 'balance'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Solde net
                </button>
                <button
                  onClick={() => setTrendMetric('both')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    trendMetric === 'both'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Flux croisés
                </button>
                <button
                  onClick={() => setTrendMetric('expense')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    trendMetric === 'expense'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Dépenses
                </button>
                <button
                  onClick={() => setTrendMetric('income')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    trendMetric === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  Revenus
                </button>
              </div>
            </div>

            <div className="mt-4">
              <TrendLineChart points={stats.trendPoints} viewMode={trendMetric} />
            </div>
          </div>

          {/* Quick Stats on Trend Period */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-400">Total opérations</p>
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {stats.filteredTransactions.length} tx
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-400">Durée période</p>
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {stats.dateRange.numDays} jours
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-400">Moyenne par tx dépense</p>
              <p className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                {formatFCFA(stats.averageExpensePerTransaction)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] text-zinc-400">Moyenne par tx revenu</p>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatFCFA(stats.averageIncomePerTransaction)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANNUAL & MONTHLY (Statistiques mensuelles et annuelles) */}
      {activeTab === 'annual' && (
        <div className="space-y-4">
          {/* Annual Overview Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 sm:text-sm">
                Bilan Annuel Synthétique ({stats.annualStats.year})
              </h3>
              <span className="text-xs font-bold text-zinc-500">
                Cumul 12 mois
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400">Revenus annuels</span>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 sm:text-base">
                  +{formatFCFA(stats.annualStats.totalIncome)}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400">Dépenses annuelles</span>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 sm:text-base">
                  -{formatFCFA(stats.annualStats.totalExpense)}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400">Solde net annuel</span>
                <p
                  className={`text-sm font-black sm:text-base ${
                    stats.annualStats.netBalance >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {stats.annualStats.netBalance >= 0 ? '+' : ''}
                  {formatFCFA(stats.annualStats.netBalance)}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400">Taux d'épargne moyen</span>
                <p className="text-sm font-black text-cyan-600 dark:text-cyan-400 sm:text-base">
                  {stats.annualStats.savingsRate}%
                </p>
              </div>
            </div>

            {/* Annual Highlights */}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {stats.annualStats.highestExpenseMonth && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Mois le plus dépensier
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {stats.annualStats.highestExpenseMonth.monthName} ({formatFCFA(stats.annualStats.highestExpenseMonth.amount)})
                  </p>
                </div>
              )}

              {stats.annualStats.highestIncomeMonth && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Mois le plus rémunérateur
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {stats.annualStats.highestIncomeMonth.monthName} (+{formatFCFA(stats.annualStats.highestIncomeMonth.amount)})
                  </p>
                </div>
              )}

              {stats.annualStats.mostProfitableMonth && (
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-2.5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                    Mois le plus rentable
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {stats.annualStats.mostProfitableMonth.monthName} (+{formatFCFA(stats.annualStats.mostProfitableMonth.net)})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly detailed matrix & histogram */}
          <MonthlyStatsView
            breakdowns={stats.monthlyBreakdowns}
            year={stats.annualStats.year}
          />
        </div>
      )}
    </div>
  );
};
