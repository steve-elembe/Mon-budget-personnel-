import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpDown,
  X,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wallet,
  FolderKanban
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, Category } from '../types';
import { formatFCFA } from '../services/storage';
import { TransactionModal } from '../components/TransactionModal';
import { CategoryIcon } from '../components/CategoryIcon';

interface TransactionsScreenProps {
  transactions: Transaction[];
  categories?: Category[];
  onAddTransaction: (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    note?: string;
  }) => void;
  onUpdateTransaction: (
    id: string,
    data: Partial<{
      amount: number;
      type: TransactionType;
      category: string;
      description: string;
      date: string;
      paymentMethod: PaymentMethod;
      note?: string;
    }>
  ) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenCategoryManager?: () => void;
}

type PeriodFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';

const PAYMENT_METHODS_FILTER: (PaymentMethod | 'ALL')[] = [
  'ALL',
  'Espèces',
  'MTN Mobile Money',
  'Orange Money',
  'Compte bancaire',
  'Carte bancaire',
  'Autre'
];

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  categories = [],
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onOpenCategoryManager
}) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'ALL'>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');

  // Delete confirmation modal / toast state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Extract all categories for filtering (both registered categories and transaction categories)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    categories.forEach(c => {
      if (selectedType === 'ALL' || c.type === selectedType) {
        cats.add(c.name);
      }
    });
    transactions.forEach(t => {
      if (t.category && (selectedType === 'ALL' || t.type === selectedType)) {
        cats.add(t.category);
      }
    });
    return Array.from(cats).sort();
  }, [categories, transactions, selectedType]);

  // Filter and Sort logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(tx => {
        // 1. Filter by Type
        if (selectedType === 'INCOME' && tx.type !== 'INCOME') return false;
        if (selectedType === 'EXPENSE' && tx.type !== 'EXPENSE') return false;

        // 2. Filter by Category
        if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;

        // 3. Filter by Payment Method
        if (selectedPaymentMethod !== 'ALL' && tx.paymentMethod !== selectedPaymentMethod) return false;

        // 4. Filter by Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const desc = (tx.description || tx.title || '').toLowerCase();
          const cat = (tx.category || '').toLowerCase();
          const note = (tx.note || '').toLowerCase();
          const pm = (tx.paymentMethod || '').toLowerCase();
          const amt = tx.amount.toString();
          if (
            !desc.includes(q) &&
            !cat.includes(q) &&
            !note.includes(q) &&
            !pm.includes(q) &&
            !amt.includes(q)
          ) {
            return false;
          }
        }

        // 5. Filter by Period
        const txTimestamp = tx.timestamp || (tx.date ? new Date(tx.date).getTime() : 0);
        const txDateObj = new Date(txTimestamp);

        if (selectedPeriod === 'TODAY') {
          if (txTimestamp < startOfToday || txTimestamp >= startOfToday + 24 * 60 * 60 * 1000) {
            return false;
          }
        } else if (selectedPeriod === 'WEEK') {
          if (txTimestamp < sevenDaysAgo) return false;
        } else if (selectedPeriod === 'MONTH') {
          if (txDateObj.getMonth() !== currentMonth || txDateObj.getFullYear() !== currentYear) {
            return false;
          }
        } else if (selectedPeriod === 'QUARTER') {
          const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
          if (
            txDateObj.getFullYear() !== currentYear ||
            txDateObj.getMonth() < quarterStartMonth ||
            txDateObj.getMonth() > quarterStartMonth + 2
          ) {
            return false;
          }
        } else if (selectedPeriod === 'YEAR') {
          if (txDateObj.getFullYear() !== currentYear) return false;
        } else if (selectedPeriod === 'CUSTOM') {
          if (customStartDate && tx.date < customStartDate) return false;
          if (customEndDate && tx.date > customEndDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.timestamp || (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.timestamp || (b.date ? new Date(b.date).getTime() : 0);

        if (sortOption === 'DATE_DESC') {
          return timeB - timeA;
        } else if (sortOption === 'DATE_ASC') {
          return timeA - timeB;
        } else if (sortOption === 'AMOUNT_DESC') {
          return b.amount - a.amount;
        } else if (sortOption === 'AMOUNT_ASC') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [
    transactions,
    selectedType,
    selectedCategory,
    selectedPaymentMethod,
    searchQuery,
    selectedPeriod,
    customStartDate,
    customEndDate,
    sortOption
  ]);

  // Aggregate stats for filtered result
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(tx => {
      if (tx.type === 'INCOME') income += tx.amount;
      else expense += tx.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const handleOpenAddModal = (type: TransactionType = 'EXPENSE') => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    note?: string;
  }) => {
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, data);
      setFeedbackMessage('Transaction modifiée avec succès dans Room');
    } else {
      onAddTransaction(data);
      setFeedbackMessage('Nouvelle transaction enregistrée dans Room');
    }
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleConfirmDelete = (id: string) => {
    onDeleteTransaction(id);
    setDeleteConfirmId(null);
    setFeedbackMessage('Transaction supprimée définitivement');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedCategory('ALL');
    setSelectedPaymentMethod('ALL');
    setSelectedPeriod('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortOption('DATE_DESC');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedPaymentMethod !== 'ALL' ||
    selectedPeriod !== 'ALL' ||
    sortOption !== 'DATE_DESC';

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-linear-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Room Database • DAO SQLite</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Gestion des Transactions</h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
            Recherche plein texte, filtres avancés par catégorie et période
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenCategoryManager && (
            <button
              onClick={onOpenCategoryManager}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-all"
              title="Gérer les catégories"
            >
              <FolderKanban className="w-4 h-4" />
              <span className="hidden md:inline">Catégories</span>
            </button>
          )}

          <button
            id="btn-add-expense-modal"
            onClick={() => handleOpenAddModal('EXPENSE')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Dépense</span>
          </button>

          <button
            id="btn-add-income-modal"
            onClick={() => handleOpenAddModal('INCOME')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Revenu</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search Input and Type Filter */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-transactions-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par libellé, note, montant, catégorie..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start md:self-auto text-xs font-semibold">
            <button
              id="filter-type-all"
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedType === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              id="filter-type-income"
              onClick={() => setSelectedType('INCOME')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                selectedType === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Revenus</span>
            </button>
            <button
              id="filter-type-expense"
              onClick={() => setSelectedType('EXPENSE')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                selectedType === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:text-rose-800'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Dépenses</span>
            </button>
          </div>

          {/* Reset Filters button if any active */}
          {hasActiveFilters && (
            <button
              id="btn-reset-filters"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Row: Period, Category, Payment Method, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Période */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Période
            </label>
            <select
              id="filter-period-select"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as PeriodFilter)}
              className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Toutes les dates</option>
              <option value="TODAY">Aujourd'hui</option>
              <option value="WEEK">7 derniers jours</option>
              <option value="MONTH">Ce mois-ci</option>
              <option value="QUARTER">Ce trimestre</option>
              <option value="YEAR">Cette année</option>
              <option value="CUSTOM">Période personnalisée...</option>
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Catégorie
              </label>
              {onOpenCategoryManager && (
                <button
                  onClick={onOpenCategoryManager}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  Gérer
                </button>
              )}
            </div>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Toutes les catégories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Méthode de paiement */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-slate-400" />
              Paiement
            </label>
            <select
              id="filter-payment-select"
              value={selectedPaymentMethod}
              onChange={e => setSelectedPaymentMethod(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Toutes les méthodes</option>
              {PAYMENT_METHODS_FILTER.filter(m => m !== 'ALL').map(method => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Trier par */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              Trier par
            </label>
            <select
              id="sort-order-select"
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="DATE_DESC">Date (plus récente d'abord)</option>
              <option value="DATE_ASC">Date (plus ancienne d'abord)</option>
              <option value="AMOUNT_DESC">Montant décroissant</option>
              <option value="AMOUNT_ASC">Montant croissant</option>
            </select>
          </div>
        </div>

        {/* Custom date range picker when 'CUSTOM' selected */}
        {selectedPeriod === 'CUSTOM' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-1/2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Du (Date début)
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Au (Date fin)
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Aggregate Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Revenus */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Revenus filtrés
            </span>
            <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              +{formatFCFA(stats.income)}
            </p>
          </div>
          <span className="w-8 h-8 rounded-xl bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs">
            <ArrowDownLeft className="w-4 h-4" />
          </span>
        </div>

        {/* Dépenses */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Dépenses filtrées
            </span>
            <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300 mt-1">
              -{formatFCFA(stats.expense)}
            </p>
          </div>
          <span className="w-8 h-8 rounded-xl bg-rose-200/70 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center justify-center font-bold text-xs">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        {/* Solde net */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Solde net ({stats.count} opérations)
            </span>
            <p
              className={`text-lg sm:text-xl font-black mt-1 ${
                stats.balance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats.balance >= 0 ? '+' : ''}
              {formatFCFA(stats.balance)}
            </p>
          </div>
          <span className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
            =
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Liste des transactions ({filteredTransactions.length})
          </h3>
          <span className="text-xs text-slate-400">Synchronisé en temps réel avec Room</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Aucune transaction trouvée
            </p>
            <p className="text-xs max-w-sm mx-auto">
              Aucune opération ne correspond à vos critères de recherche ou de filtre.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredTransactions.map(tx => {
              const isIncome = tx.type === 'INCOME';
              const catObj = categories.find(c => c.name === tx.category && c.type === tx.type);

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Icon + Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Category Icon Badge */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{
                        backgroundColor:
                          catObj?.color || (isIncome ? '#10b981' : '#ef4444')
                      }}
                    >
                      <CategoryIcon
                        name={catObj?.icon || (isIncome ? 'ArrowDownLeft' : 'ArrowUpRight')}
                        className="w-5 h-5"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.description || tx.title}
                        </h4>
                        {/* Type badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isIncome ? 'Revenu' : 'Dépense'}
                        </span>
                        {catObj?.isCustom && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            Perso
                          </span>
                        )}
                      </div>

                      {/* Metadata Chips: Category, Payment, Date */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          {tx.paymentMethod}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">{tx.date}</span>
                      </div>

                      {/* Note if present */}
                      {tx.note && (
                        <p className="mt-1 text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-lg inline-block">
                          Note : "{tx.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-12 sm:pl-0">
                    <span
                      className={`text-base font-black tracking-tight ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatFCFA(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Modifier button */}
                      <button
                        id={`btn-edit-tx-${tx.id}`}
                        onClick={() => handleOpenEditModal(tx)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
                        title="Modifier cette transaction"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Supprimer button */}
                      <button
                        id={`btn-delete-tx-${tx.id}`}
                        onClick={() => setDeleteConfirmId(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Supprimer cette transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Supprimer la transaction ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cette action supprimera définitivement cette transaction de la base de données Room locale.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                id="confirm-delete-tx-btn"
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/25"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CRUD Transaction */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        categories={categories}
        onOpenCategoryManager={onOpenCategoryManager}
      />
    </div>
  );
};
