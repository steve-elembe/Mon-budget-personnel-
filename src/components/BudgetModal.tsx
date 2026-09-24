import React, { useState, useEffect } from 'react';
import { X, Wallet, AlertCircle, CheckCircle2, Calendar, FolderKanban } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatFCFA } from '../services/storage';
import { CategoryIcon } from './CategoryIcon';
import { MONTH_NAMES_FR, getBudgetAlertStatus } from '../utils/budgetUtils';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    category: string;
    allocatedAmount: number;
    month: number;
    year: number;
    isGlobal?: boolean;
  }) => void;
  initialBudget?: Budget | null;
  categories: Category[];
  transactions: Transaction[];
  currentMonth: number;
  currentYear: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBudget,
  categories,
  transactions,
  currentMonth,
  currentYear
}) => {
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  const [isGlobal, setIsGlobal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');
  const [month, setMonth] = useState<number>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialBudget) {
      const isGlob = Boolean(
        initialBudget.isGlobal || initialBudget.category.toUpperCase() === 'GLOBAL'
      );
      setIsGlobal(isGlob);
      setSelectedCategory(isGlob ? '' : initialBudget.category);
      setAllocatedAmount(initialBudget.allocatedAmount.toString());
      setMonth(initialBudget.month);
      setYear(initialBudget.year);
    } else {
      setIsGlobal(false);
      setSelectedCategory(expenseCategories.length > 0 ? expenseCategories[0].name : '');
      setAllocatedAmount('');
      setMonth(currentMonth);
      setYear(currentYear);
    }
    setError(null);
  }, [initialBudget, isOpen, currentMonth, currentYear, expenseCategories.length]);

  if (!isOpen) return null;

  // Compute current actual expenses for preview
  const numAmount = parseFloat(allocatedAmount) || 0;
  const targetCategory = isGlobal ? 'GLOBAL' : selectedCategory;

  const currentSpent = transactions
    .filter(tx => {
      if (tx.type !== 'EXPENSE') return false;
      const d = new Date(tx.timestamp || tx.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) return false;
      if (isGlobal) return true;
      return tx.category.trim().toLowerCase() === targetCategory.trim().toLowerCase();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const projectedRemaining = numAmount - currentSpent;
  const projectedPercentage = numAmount > 0 ? (currentSpent / numAmount) * 100 : 0;
  const projectedAlert = getBudgetAlertStatus(projectedPercentage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Le montant prévu doit être supérieur à 0 FCFA.');
      return;
    }
    if (!isGlobal && !selectedCategory) {
      setError('Veuillez sélectionner une catégorie de dépense.');
      return;
    }

    onSave({
      id: initialBudget?.id,
      category: isGlobal ? 'GLOBAL' : selectedCategory,
      allocatedAmount: numAmount,
      month,
      year,
      isGlobal
    });
    onClose();
  };

  const selectedCatObj = expenseCategories.find(c => c.name === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all dark:bg-zinc-900 dark:border dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {initialBudget ? 'Modifier le budget' : 'Nouveau budget mensuel'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fixez votre plafond et suivez l’alerte en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Month and Year Selection */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Période concernée</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {MONTH_NAMES_FR.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {[year - 1, year, year + 1].map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope Selection: Global vs Category */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Portée du budget
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsGlobal(true)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  isGlobal
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                <Wallet className="h-4 w-4" />
                <span>Budget global mensuel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGlobal(false);
                  if (!selectedCategory && expenseCategories.length > 0) {
                    setSelectedCategory(expenseCategories[0].name);
                  }
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  !isGlobal
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                <FolderKanban className="h-4 w-4" />
                <span>Budget par catégorie</span>
              </button>
            </div>
          </div>

          {/* Category Dropdown (if not global) */}
          {!isGlobal && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Catégorie de dépense
              </label>
              <div className="flex items-center gap-2">
                {selectedCatObj && (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                    style={{ backgroundColor: selectedCatObj.color || '#059669' }}
                  >
                    <CategoryIcon name={selectedCatObj.icon} className="h-4 w-4" />
                  </div>
                )}
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} {cat.isCustom ? '(Personnalisée)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Montant prévu (FCFA)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="500"
                required
                placeholder="Ex : 150000"
                value={allocatedAmount}
                onChange={e => setAllocatedAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-base font-bold text-zinc-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400">
                FCFA
              </span>
            </div>
            {numAmount > 0 && (
              <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Plafond défini : {formatFCFA(numAmount)}
              </p>
            )}
          </div>

          {/* Interactive Simulation / Live Preview */}
          {numAmount > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  Simulation sur transactions actuelles :
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${projectedAlert.badgeBg} ${projectedAlert.badgeText} ${projectedAlert.badgeBorder}`}
                >
                  {projectedAlert.label}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Dépenses réelles : {formatFCFA(currentSpent)}</span>
                <span className={projectedRemaining < 0 ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-bold text-zinc-700 dark:text-zinc-200'}>
                  {projectedRemaining < 0
                    ? `Dépassé de ${formatFCFA(Math.abs(projectedRemaining))}`
                    : `Restant : ${formatFCFA(projectedRemaining)}`}
                </span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${projectedAlert.progressBarColor}`}
                  style={{ width: `${Math.min(100, projectedPercentage)}%` }}
                />
              </div>
            </div>
          )}

          {/* Thresholds reminder */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Barème d’alerte :</span>
            <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] sm:grid-cols-4">
              <span className="text-emerald-600 dark:text-emerald-400">● &lt; 70% : Normal</span>
              <span className="text-amber-600 dark:text-amber-400">● 70-89% : Attention</span>
              <span className="text-orange-600 dark:text-orange-400">● 90-99% : Proche limite</span>
              <span className="text-rose-600 dark:text-rose-400">● ≥ 100% : Dépassé</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
            >
              {initialBudget ? 'Sauvegarder les modifications' : 'Créer le budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
