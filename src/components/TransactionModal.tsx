import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, Category } from '../types';
import { validateTransactionForm, TransactionValidationErrors } from '../services/storage';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    note?: string;
  }) => void;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  categories?: Category[];
  onOpenCategoryManager?: () => void;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Alimentation',
  'Transport',
  'Logement',
  'Électricité',
  'Eau',
  'Internet',
  'Téléphone',
  'Santé',
  'Éducation',
  'Vêtements',
  'Loisirs',
  'Famille',
  'Dettes',
  'Abonnements',
  'Autre'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salaire',
  'Activité commerciale',
  'Prime',
  'Bonus',
  'Transfert reçu',
  'Autre'
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Espèces',
  'MTN Mobile Money',
  'Orange Money',
  'Compte bancaire',
  'Carte bancaire',
  'Autre'
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  defaultType = 'EXPENSE',
  categories = [],
  onOpenCategoryManager
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN Mobile Money');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<TransactionValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Get active categories list for the current type
  const activeCategoryObjects = categories.filter(c => c.type === type);
  const activeCategoryNames =
    activeCategoryObjects.length > 0
      ? activeCategoryObjects.map(c => c.name)
      : type === 'INCOME'
      ? DEFAULT_INCOME_CATEGORIES
      : DEFAULT_EXPENSE_CATEGORIES;

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setDescription(initialTransaction.description || initialTransaction.title || '');
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(initialTransaction.paymentMethod || 'Espèces');
      setNote(initialTransaction.note || '');
    } else {
      setType(defaultType);
      setAmount('');
      setDescription('');
      const defaultCat =
        activeCategoryNames.length > 0
          ? activeCategoryNames[0]
          : defaultType === 'INCOME'
          ? 'Salaire'
          : 'Alimentation';
      setCategory(defaultCat);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('MTN Mobile Money');
      setNote('');
    }
    setErrors({});
    setTouched({});
  }, [initialTransaction, defaultType, isOpen]);

  // When type changes, adapt category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCatList =
      categories.filter(c => c.type === newType).map(c => c.name).length > 0
        ? categories.filter(c => c.type === newType).map(c => c.name)
        : newType === 'INCOME'
        ? DEFAULT_INCOME_CATEGORIES
        : DEFAULT_EXPENSE_CATEGORIES;

    if (!newCatList.includes(category)) {
      setCategory(newCatList[0] || 'Autre');
    }
  };

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
    if (!isValid) {
      return;
    }

    onSave({
      amount: parseFloat(amount),
      type,
      category: category.trim(),
      description: description.trim(),
      date,
      paymentMethod,
      note: note.trim() ? note.trim() : undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  const currentCategoryObj = categories.find(c => c.name === category && c.type === type);

  return (
    <div
      id="transaction-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="transaction-modal-container"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Room Local Database
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialTransaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </h2>
          </div>
          <button
            id="close-transaction-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Type Segmented Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
              Type d'opération
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                id="select-type-expense"
                onClick={() => handleTypeChange('EXPENSE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Dépense (-)</span>
              </button>
              <button
                type="button"
                id="select-type-income"
                onClick={() => handleTypeChange('INCOME')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Revenu (+)</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tx-description"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1"
            >
              Description / Libellé <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="tx-description"
                type="text"
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (touched.description) {
                    validateTransactionForm({ amount, category, date, description: e.target.value });
                  }
                }}
                onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                placeholder={
                  type === 'INCOME'
                    ? 'Ex: Salaire mensuel, Vente boutique...'
                    : 'Ex: Courses supermarché, Carburant, Loyer...'
                }
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Montant */}
          <div>
            <label
              htmlFor="tx-amount"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1"
            >
              Montant (obligatoire et &gt; 0 FCFA) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="tx-amount"
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
                className={`w-full pl-3.5 pr-16 py-2.5 text-sm font-semibold rounded-xl border bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
              <span className="absolute right-3.5 text-xs font-bold text-slate-400 select-none">
                FCFA
              </span>
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Catégorie with Icon & Manage link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="tx-category"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Catégorie <span className="text-red-500">*</span>
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Settings className="w-3 h-3" />
                  <span>Gérer les catégories</span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {currentCategoryObj ? (
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: currentCategoryObj.color || '#10b981' }}
                  >
                    <CategoryIcon name={currentCategoryObj.icon} className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <Tag className="w-4 h-4 text-slate-400" />
                )}
              </div>

              <select
                id="tx-category"
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  if (touched.category) {
                    validateTransactionForm({ amount, category: e.target.value, date, description });
                  }
                }}
                onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  errors.category
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              >
                <option value="">Sélectionnez une catégorie...</option>
                {activeCategoryNames.map(catName => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Date & Méthode de paiement (Grid 2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                Date valide <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={e => {
                    setDate(e.target.value);
                    if (touched.date) {
                      validateTransactionForm({ amount, category, date: e.target.value, description });
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, date: true }))}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    errors.date
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.date}
                </p>
              )}
            </div>

            {/* Méthode de paiement */}
            <div>
              <label
                htmlFor="tx-paymentMethod"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                Méthode de paiement
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <select
                  id="tx-paymentMethod"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note facultative */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1"
            >
              Note facultative
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="tx-note"
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Détails supplémentaires, numéro de reçu, remarque..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="cancel-transaction-btn"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            id="save-transaction-btn"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/25 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{initialTransaction ? 'Enregistrer les modifications' : 'Ajouter la transaction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
