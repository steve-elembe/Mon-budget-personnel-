import React, { useState } from 'react';
import {
  ArrowUpRight,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  FileText
} from 'lucide-react';
import { Transaction, PaymentMethod, Category } from '../types';
import { formatFCFA, validateTransactionForm, TransactionValidationErrors } from '../services/storage';
import { TransactionModal } from '../components/TransactionModal';
import { CategoryIcon } from '../components/CategoryIcon';

interface ExpenseScreenProps {
  transactions: Transaction[];
  categories?: Category[];
  onAddExpense: (
    description: string,
    amount: number,
    category: string,
    date?: string,
    note?: string,
    paymentMethod?: PaymentMethod
  ) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, data: any) => void;
  onOpenCategoryManager?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'MTN Mobile Money',
  'Orange Money',
  'Espèces',
  'Compte bancaire',
  'Carte bancaire',
  'Autre'
];

export const ExpenseScreen: React.FC<ExpenseScreenProps> = ({
  transactions,
  categories = [],
  onAddExpense,
  onDeleteTransaction,
  onUpdateTransaction,
  onOpenCategoryManager
}) => {
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const defaultCategoryName = expenseCategories.length > 0 ? expenseCategories[0].name : 'Alimentation';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultCategoryName);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN Mobile Money');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<TransactionValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Edit modal
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  const validate = () => {
    const res = validateTransactionForm({
      amount,
      category,
      date,
      description
    });
    setErrors(res.errors);
    return res.isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      amount: true,
      category: true,
      date: true,
      description: true
    });

    const isValid = validate();
    if (!isValid) return;

    onAddExpense(
      description.trim(),
      parseFloat(amount),
      category.trim(),
      date,
      note.trim() ? note.trim() : undefined,
      paymentMethod
    );

    setDescription('');
    setAmount('');
    setNote('');
    setTouched({});
    setErrors({});
    setSuccessMsg('Dépense enregistrée avec succès dans la base de données Room');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const selectedCategoryObj = expenseCategories.find(c => c.name === category);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-linear-to-r from-rose-600 via-rose-700 to-amber-700 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Gestion des Dépenses • Room Database & MVVM</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Suivi des Dépenses</h2>
          <p className="text-xs sm:text-sm text-rose-100/90 mt-0.5">
            Contrôlez vos sorties avec précision, catégories dédiées et icônes
          </p>
        </div>
        <div className="sm:text-right bg-white/10 backdrop-blur-xs p-3.5 sm:px-5 rounded-2xl border border-white/10">
          <p className="text-xs text-rose-200 font-medium">Total cumulé des dépenses</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight">{formatFCFA(totalExpense)}</p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-rose-800 dark:text-rose-200 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Add Form + Expense History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ajouter une dépense
              </h3>
            </div>
            {onOpenCategoryManager && (
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Gérer les catégories</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Motif <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (touched.description) {
                    validateTransactionForm({ amount, category, date, description: e.target.value });
                  }
                }}
                onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                placeholder="Ex: Courses supermarché, Facture Eneo, Carburant..."
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Montant <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    if (touched.amount) {
                      validateTransactionForm({ amount: e.target.value, category, date, description });
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                  placeholder="Ex: 25000"
                  className={`w-full pl-3.5 pr-14 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.amount
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500'
                  }`}
                />
                <span className="absolute right-3 text-xs font-bold text-slate-400 select-none">
                  FCFA
                </span>
              </div>
              {errors.amount && (
                <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Dynamic Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catégorie de dépense <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {selectedCategoryObj ? (
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: selectedCategoryObj.color || '#ef4444' }}
                    >
                      <CategoryIcon name={selectedCategoryObj.icon} className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <FolderKanban className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    if (touched.category) {
                      validateTransactionForm({ amount, category: e.target.value, date, description });
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                  className={`w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    errors.category
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500'
                  }`}
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} {cat.isCustom ? '(Personnalisée)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && (
                <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => {
                      setDate(e.target.value);
                      if (touched.date) {
                        validateTransactionForm({ amount, category, date: e.target.value, description });
                      }
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
                    className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                      errors.date
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500'
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mode de règlement
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Note facultative */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Note ou référence (facultative)
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 flex items-start pointer-events-none text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ajoutez une note, reçu, garantie, détails du paiement..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-rose-600 hover:bg-rose-700 active:scale-98 shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer la dépense</span>
            </button>
          </form>
        </div>

        {/* Expense History (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Historique des Dépenses
              </h3>
              <p className="text-xs text-slate-400">
                {expenseTransactions.length} dépense(s) enregistrée(s)
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
              {formatFCFA(totalExpense)}
            </span>
          </div>

          {expenseTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">Aucune dépense enregistrée pour le moment</p>
              <p className="text-xs mt-1">Utilisez le formulaire ci-contre pour ajouter votre première dépense.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
              {expenseTransactions.map(tx => {
                const catObj = expenseCategories.find(c => c.name === tx.category);
                return (
                  <div
                    key={tx.id}
                    className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: catObj?.color || '#ef4444' }}
                      >
                        <CategoryIcon name={catObj?.icon || 'Tag'} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.description || tx.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {tx.category}
                          </span>
                          <span>•</span>
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-medium">
                            {tx.paymentMethod}
                          </span>
                        </div>
                        {tx.note && (
                          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                            « {tx.note} »
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                        -{formatFCFA(tx.amount)}
                      </span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setEditingTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onSave={updatedData => {
            if (onUpdateTransaction) {
              onUpdateTransaction(editingTransaction.id, updatedData);
            }
            setEditingTransaction(null);
          }}
          initialTransaction={editingTransaction}
          defaultType="EXPENSE"
          categories={categories}
          onOpenCategoryManager={onOpenCategoryManager}
        />
      )}
    </div>
  );
};
