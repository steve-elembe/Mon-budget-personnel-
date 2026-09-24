import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Transaction,
  Budget,
  SavingsGoal,
  SavingsMovement,
  DashboardSummary,
  PaymentMethod,
  TransactionType,
  Category,
  BudgetAlertStatus,
  SecuritySettings,
  NotificationSettings,
  AppNotification,
  CurrencyOption,
  ScreenName,
  UserAccount,
  CloudSyncInfo
} from '../types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_SAVINGS_MOVEMENTS,
  INITIAL_CATEGORIES
} from '../data/initialData';
import { getBudgetAlertStatus } from '../utils/budgetUtils';
import {
  evaluateFinancialNotifications,
  DEFAULT_NOTIFICATION_SETTINGS
} from '../utils/notificationUtils';
import { CloudSyncService } from './cloudSyncService';

export const CURRENCIES: CurrencyOption[] = [
  { code: 'FCFA', name: 'Franc CFA (XAF / XOF)', symbol: 'FCFA', flag: '🇨🇲', position: 'after' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€', flag: '🇪🇺', position: 'after' },
  { code: 'USD', name: 'Dollar américain ($)', symbol: '$', flag: '🇺🇸', position: 'before' },
  { code: 'CAD', name: 'Dollar canadien ($)', symbol: '$ CA', flag: '🇨🇦', position: 'after' },
  { code: 'GBP', name: 'Livre sterling (£)', symbol: '£', flag: '🇬🇧', position: 'before' },
  { code: 'GNF', name: 'Franc guinéen (GNF)', symbol: 'GNF', flag: '🇬🇳', position: 'after' },
  { code: 'CDF', name: 'Franc congolais (CDF)', symbol: 'CDF', flag: '🇨🇩', position: 'after' }
];

const STORAGE_KEYS = {
  TRANSACTIONS: 'mon_budget_room_transactions',
  BUDGETS: 'mon_budget_room_budgets',
  SAVINGS: 'mon_budget_room_savings',
  SAVINGS_MOVEMENTS: 'mon_budget_room_savings_movements',
  CATEGORIES: 'mon_budget_room_categories',
  DARK_THEME: 'mon_budget_theme_dark',
  CURRENCY: 'mon_budget_currency',
  SECURITY: 'mon_budget_security_settings',
  NOTIFICATIONS_SETTINGS: 'mon_budget_notification_settings',
  NOTIFICATIONS_LIST: 'mon_budget_notifications_list'
};

export function formatFCFA(amount: number, currencyCode: string = 'FCFA'): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR').format(rounded);
  const curr = CURRENCIES.find(c => c.code === currencyCode);
  if (curr) {
    return curr.position === 'before' ? `${curr.symbol}${formatted}` : `${formatted} ${curr.symbol}`;
  }
  return `${formatted} ${currencyCode}`;
}

export function normalizeTransaction(tx: any): Transaction {
  let pm: PaymentMethod = 'Espèces';
  if (tx.paymentMethod === 'Mobile Money') pm = 'MTN Mobile Money';
  else if (tx.paymentMethod === 'Virement') pm = 'Compte bancaire';
  else if (
    ['Espèces', 'MTN Mobile Money', 'Orange Money', 'Compte bancaire', 'Carte bancaire', 'Autre'].includes(
      tx.paymentMethod
    )
  ) {
    pm = tx.paymentMethod as PaymentMethod;
  }

  const desc = tx.description || tx.title || 'Transaction sans libellé';
  const timestamp = tx.timestamp || (tx.date ? new Date(tx.date).getTime() : Date.now());

  return {
    id: tx.id || 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    description: desc,
    title: desc,
    amount: Math.abs(Number(tx.amount) || 0),
    type: tx.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
    category: tx.category || 'Autre',
    date: tx.date || new Date(timestamp).toISOString().split('T')[0],
    timestamp,
    paymentMethod: pm,
    note: tx.note ? String(tx.note).trim() : undefined
  };
}

export interface TransactionValidationErrors {
  amount?: string;
  category?: string;
  date?: string;
  description?: string;
}

export function validateTransactionForm(data: {
  amount: number | string;
  category: string;
  date: string;
  description: string;
}): { isValid: boolean; errors: TransactionValidationErrors } {
  const errors: TransactionValidationErrors = {};

  const numAmount = Number(data.amount);
  if (!data.amount || isNaN(numAmount) || numAmount <= 0) {
    errors.amount = 'Le montant est obligatoire et doit être supérieur à zéro (0 FCFA)';
  }

  if (!data.category || data.category.trim() === '') {
    errors.category = 'La catégorie est obligatoire';
  }

  if (!data.date || isNaN(new Date(data.date).getTime())) {
    errors.date = 'Veuillez saisir une date valide';
  }

  if (!data.description || data.description.trim() === '') {
    errors.description = 'La description est obligatoire';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function useBudgetStore() {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge to ensure all standard initial categories exist
          const existingIds = new Set(parsed.map(c => c.id));
          const missingInitials = INITIAL_CATEGORIES.filter(c => !existingIds.has(c.id));
          return [...parsed, ...missingInitials];
        }
      }
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map(normalizeTransaction);
          const existingIds = new Set(normalized.map(t => t.id));
          const missingSeed = INITIAL_TRANSACTIONS.filter(t => !existingIds.has(t.id));
          if (missingSeed.length > 0) {
            return [...normalized, ...missingSeed.map(normalizeTransaction)];
          }
          return normalized;
        }
      }
      return INITIAL_TRANSACTIONS.map(normalizeTransaction);
    } catch {
      return INITIAL_TRANSACTIONS.map(normalizeTransaction);
    }
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVINGS);
      return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOALS;
    } catch {
      return INITIAL_SAVINGS_GOALS;
    }
  });

  const [savingsMovements, setSavingsMovements] = useState<SavingsMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVINGS_MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_SAVINGS_MOVEMENTS;
    } catch {
      return INITIAL_SAVINGS_MOVEMENTS;
    }
  });

  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_THEME);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'FCFA';
    } catch {
      return 'FCFA';
    }
  });

  // Sécurité (Code PIN, biométrie, chiffrement SHA-256 sans stockage en clair)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECURITY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      isLockEnabled: false,
      pinHash: undefined,
      pinSalt: undefined,
      isBiometricsEnabled: false,
      lockTimeoutMinutes: 0,
      hasSetupPin: false
    };
  });

  // Verrouillage au démarrage si activé
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECURITY);
      if (saved) {
        const parsed: SecuritySettings = JSON.parse(saved);
        return Boolean(parsed.isLockEnabled && parsed.hasSetupPin && parsed.pinHash);
      }
    } catch {}
    return false;
  });

  // Notifications (Seuils 70%, 90%, 100% et rappels épargne)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_SETTINGS);
      if (saved) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_LIST);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  // Authentification utilisateur & synchronisation Cloud
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return CloudSyncService.getCurrentUser();
  });

  const [syncInfo, setSyncInfo] = useState<CloudSyncInfo>(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      state: isOnline ? 'idle' : 'offline',
      lastSyncedAt: CloudSyncService.getLastSyncTimestamp(),
      pendingChangesCount: 0
    };
  });

  // Persistence to local storage (Offline-first Room simulation)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    } catch (e) {
      console.error('Erreur sauvegarde devise', e);
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(securitySettings));
    } catch (e) {
      console.error('Erreur sauvegarde sécurité', e);
    }
  }, [securitySettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_SETTINGS, JSON.stringify(notificationSettings));
    } catch (e) {
      console.error('Erreur sauvegarde notifications settings', e);
    }
  }, [notificationSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_LIST, JSON.stringify(notifications));
    } catch (e) {
      console.error('Erreur sauvegarde liste notifications', e);
    }
  }, [notifications]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Erreur sauvegarde catégories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Erreur sauvegarde transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Erreur sauvegarde budgets', e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savingsGoals));
    } catch (e) {
      console.error('Erreur sauvegarde épargne', e);
    }
  }, [savingsGoals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_MOVEMENTS, JSON.stringify(savingsMovements));
    } catch (e) {
      console.error('Erreur sauvegarde mouvements épargne', e);
    }
  }, [savingsMovements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_THEME, JSON.stringify(darkTheme));
    } catch (e) {
      console.error('Erreur sauvegarde thème', e);
    }
    if (darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkTheme]);

  // Derived filtered categories
  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'EXPENSE'),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter(c => c.type === 'INCOME'),
    [categories]
  );

  // Check if a category is used in existing transactions or budgets
  const isCategoryUsed = (categoryName: string): boolean => {
    const norm = categoryName.trim().toLowerCase();
    const inTransactions = transactions.some(t => t.category.trim().toLowerCase() === norm);
    const inBudgets = budgets.some(b => b.category.trim().toLowerCase() === norm);
    return inTransactions || inBudgets;
  };

  // Category CRUD
  const addCategory = (data: {
    name: string;
    type: TransactionType;
    icon: string;
    color?: string;
  }): { success: boolean; message: string; category?: Category } => {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, message: 'Le nom de la catégorie est obligatoire.' };
    }

    // Check duplicate within same type
    const duplicate = categories.find(
      c => c.type === data.type && c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return {
        success: false,
        message: `Une catégorie "${trimmedName}" existe déjà pour ce type de flux.`
      };
    }

    const newCategory: Category = {
      id: `cat-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      type: data.type,
      icon: data.icon || 'Tag',
      color: data.color || (data.type === 'INCOME' ? '#10b981' : '#ef4444'),
      isCustom: true
    };

    setCategories(prev => [...prev, newCategory]);
    return {
      success: true,
      message: `Catégorie "${trimmedName}" créée avec succès !`,
      category: newCategory
    };
  };

  const updateCategory = (
    id: string,
    updates: { name?: string; icon?: string; color?: string }
  ): { success: boolean; message: string } => {
    const target = categories.find(c => c.id === id);
    if (!target) {
      return { success: false, message: 'Catégorie introuvable.' };
    }

    const oldName = target.name;
    const newName = updates.name ? updates.name.trim() : oldName;

    if (!newName) {
      return { success: false, message: 'Le nom de la catégorie ne peut pas être vide.' };
    }

    // If name changed, check uniqueness
    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const duplicate = categories.find(
        c => c.id !== id && c.type === target.type && c.name.toLowerCase() === newName.toLowerCase()
      );
      if (duplicate) {
        return {
          success: false,
          message: `Une autre catégorie nommée "${newName}" existe déjà.`
        };
      }
    }

    setCategories(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              name: newName,
              icon: updates.icon || c.icon,
              color: updates.color || c.color,
              isCustom: true
            }
          : c
      )
    );

    // If name changed, cascade update to existing transactions & budgets
    if (newName !== oldName) {
      setTransactions(prev =>
        prev.map(t => (t.category === oldName ? { ...t, category: newName } : t))
      );
      setBudgets(prev =>
        prev.map(b => (b.category === oldName ? { ...b, category: newName } : b))
      );
    }

    return {
      success: true,
      message: `Catégorie "${newName}" mise à jour avec succès.`
    };
  };

  const deleteCategory = (id: string): { success: boolean; message: string } => {
    const target = categories.find(c => c.id === id);
    if (!target) {
      return { success: false, message: 'Catégorie introuvable.' };
    }

    // Check if used in transactions or budgets
    if (isCategoryUsed(target.name)) {
      return {
        success: false,
        message: `Impossible de supprimer "${target.name}" car elle est utilisée dans vos transactions ou budgets existants.`
      };
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    return {
      success: true,
      message: `La catégorie "${target.name}" a été supprimée avec succès.`
    };
  };

  // Dashboard Summary calculation - Automatically updates when transactions, budgets, or savings change
  const summary = useMemo<DashboardSummary>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let balance = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(tx => {
      const txDate = new Date(tx.timestamp || tx.date);
      const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

      if (tx.type === 'INCOME') {
        balance += tx.amount;
        if (isCurrentMonth) monthIncome += tx.amount;
      } else {
        balance -= tx.amount;
        if (isCurrentMonth) monthExpense += tx.amount;
      }
    });

    // Month budgets
    const monthBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);
    const globalBudget = monthBudgets.find(b => b.isGlobal || b.category.toUpperCase() === 'GLOBAL');

    // If global budget defined, use it as total budget; otherwise, sum category budgets
    const totalBudget = globalBudget
      ? globalBudget.allocatedAmount
      : monthBudgets.reduce((acc, b) => acc + b.allocatedAmount, 0);

    // Formula requested: budget restant = budget prévu - dépenses réalisées
    const remainingBudget = totalBudget - monthExpense;
    const budgetSpent = monthExpense;
    const budgetPercentage = totalBudget > 0 ? (monthExpense / totalBudget) * 100 : 0;
    const alertInfo = getBudgetAlertStatus(budgetPercentage);
    const isBudgetExceeded = totalBudget > 0 && monthExpense > totalBudget;

    const totalSavings = savingsGoals.reduce((acc, s) => acc + s.currentAmount, 0);
    const targetSavings = savingsGoals.reduce((acc, s) => acc + s.targetAmount, 0);

    return {
      currentBalance: balance,
      totalIncomeMonth: monthIncome,
      totalExpenseMonth: monthExpense,
      remainingBudget,
      totalBudget,
      budgetSpent,
      budgetPercentage,
      budgetAlertStatus: alertInfo.status,
      budgetAlertLabel: alertInfo.label,
      isBudgetExceeded,
      totalSavings,
      targetSavings
    };
  }, [transactions, budgets, savingsGoals]);

  // Action methods
  const addTransaction = (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    note?: string;
  }): Transaction => {
    const txDate = data.date ? new Date(data.date) : new Date();
    const desc = data.description.trim();
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      description: desc,
      title: desc,
      amount: Math.abs(Number(data.amount)),
      type: data.type,
      category: data.category.trim(),
      date: data.date || txDate.toISOString().split('T')[0],
      timestamp: txDate.getTime(),
      paymentMethod: data.paymentMethod,
      note: data.note ? data.note.trim() : undefined
    };
    setTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = (
    id: string,
    updatedFields: Partial<{
      amount: number;
      type: TransactionType;
      category: string;
      description: string;
      date: string;
      paymentMethod: PaymentMethod;
      note?: string;
    }>
  ) => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === id) {
          const desc = updatedFields.description?.trim() || tx.description;
          const nextDate = updatedFields.date || tx.date;
          const timestamp = updatedFields.date ? new Date(updatedFields.date).getTime() : tx.timestamp;
          const nextAmount =
            updatedFields.amount !== undefined ? Math.abs(Number(updatedFields.amount)) : tx.amount;

          return {
            ...tx,
            description: desc,
            title: desc,
            amount: nextAmount,
            type: updatedFields.type ?? tx.type,
            category: updatedFields.category?.trim() || tx.category,
            date: nextDate,
            timestamp,
            paymentMethod: updatedFields.paymentMethod ?? tx.paymentMethod,
            note: updatedFields.note !== undefined ? updatedFields.note.trim() : tx.note
          };
        }
        return tx;
      })
    );
  };

  const addIncome = (
    descriptionOrTitle: string,
    amount: number,
    category: string,
    date?: string,
    note?: string,
    paymentMethod: PaymentMethod = 'MTN Mobile Money'
  ) => {
    const now = date ? new Date(date) : new Date();
    const desc = descriptionOrTitle.trim();
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      description: desc,
      title: desc,
      amount: Math.abs(amount),
      type: 'INCOME',
      category: category.trim(),
      date: date || now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      note: note?.trim(),
      paymentMethod
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const addExpense = (
    descriptionOrTitle: string,
    amount: number,
    category: string,
    date?: string,
    note?: string,
    paymentMethod: PaymentMethod = 'MTN Mobile Money'
  ) => {
    const now = date ? new Date(date) : new Date();
    const desc = descriptionOrTitle.trim();
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      description: desc,
      title: desc,
      amount: Math.abs(amount),
      type: 'EXPENSE',
      category: category.trim(),
      date: date || now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      note: note?.trim(),
      paymentMethod
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const saveBudget = (data: {
    id?: string;
    category: string;
    allocatedAmount: number;
    month: number;
    year: number;
    isGlobal?: boolean;
  }): { success: boolean; message: string; budget?: Budget } => {
    const isGlobal = Boolean(data.isGlobal || data.category.toUpperCase() === 'GLOBAL');
    const catName = isGlobal ? 'GLOBAL' : data.category.trim();
    const amount = Math.abs(Number(data.allocatedAmount));

    if (!amount || amount <= 0) {
      return { success: false, message: 'Le montant prévu doit être supérieur à zéro (0 FCFA).' };
    }

    if (!isGlobal && !catName) {
      return { success: false, message: 'Veuillez sélectionner une catégorie de dépense.' };
    }

    if (data.id) {
      setBudgets(prev =>
        prev.map(b =>
          b.id === data.id
            ? {
                ...b,
                category: catName,
                allocatedAmount: amount,
                month: data.month,
                year: data.year,
                isGlobal
              }
            : b
        )
      );
      return {
        success: true,
        message: isGlobal
          ? 'Budget global mensuel mis à jour.'
          : `Budget "${catName}" mis à jour avec succès.`
      };
    }

    // Check if duplicate for same category/global in the exact same month & year
    const existingIndex = budgets.findIndex(
      b =>
        b.month === data.month &&
        b.year === data.year &&
        (isGlobal ? (b.isGlobal || b.category === 'GLOBAL') : b.category.toLowerCase() === catName.toLowerCase())
    );

    if (existingIndex >= 0) {
      setBudgets(prev => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          allocatedAmount: amount,
          isGlobal
        };
        return next;
      });
      return {
        success: true,
        message: isGlobal
          ? 'Budget global mensuel mis à jour.'
          : `Budget "${catName}" mis à jour pour ce mois.`
      };
    }

    const newBudget: Budget = {
      id: 'b-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      category: catName,
      allocatedAmount: amount,
      month: data.month,
      year: data.year,
      isGlobal
    };

    setBudgets(prev => [newBudget, ...prev]);
    return {
      success: true,
      message: isGlobal
        ? 'Budget global mensuel défini avec succès !'
        : `Budget "${catName}" créé avec succès !`,
      budget: newBudget
    };
  };

  const addBudget = (
    categoryOrData:
      | string
      | {
          category: string;
          allocatedAmount: number;
          month?: number;
          year?: number;
          isGlobal?: boolean;
        },
    allocatedAmount?: number,
    month?: number,
    year?: number,
    isGlobal?: boolean
  ) => {
    const now = new Date();
    if (typeof categoryOrData === 'object') {
      return saveBudget({
        category: categoryOrData.category,
        allocatedAmount: categoryOrData.allocatedAmount,
        month: categoryOrData.month ?? now.getMonth(),
        year: categoryOrData.year ?? now.getFullYear(),
        isGlobal: categoryOrData.isGlobal
      });
    } else {
      return saveBudget({
        category: categoryOrData,
        allocatedAmount: allocatedAmount || 0,
        month: month ?? now.getMonth(),
        year: year ?? now.getFullYear(),
        isGlobal: isGlobal ?? categoryOrData.toUpperCase() === 'GLOBAL'
      });
    }
  };

  const updateBudget = (
    id: string,
    updates: Partial<Budget>
  ): { success: boolean; message: string } => {
    const target = budgets.find(b => b.id === id);
    if (!target) return { success: false, message: 'Budget introuvable.' };

    setBudgets(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
    return { success: true, message: 'Budget mis à jour avec succès.' };
  };

  const deleteBudget = (id: string): { success: boolean; message: string } => {
    const target = budgets.find(b => b.id === id);
    setBudgets(prev => prev.filter(b => b.id !== id));
    return {
      success: true,
      message: target?.isGlobal ? 'Budget global supprimé.' : 'Budget de catégorie supprimé.'
    };
  };

  const setGlobalBudget = (month: number, year: number, allocatedAmount: number) => {
    return saveBudget({
      category: 'GLOBAL',
      allocatedAmount,
      month,
      year,
      isGlobal: true
    });
  };

  const applyBudgetTestScenario = (scenario: 'normal' | 'warning' | 'critical' | 'exceeded') => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();

    // The recorded initial expenses in current month sum to 278,000 FCFA
    if (scenario === 'normal') {
      // 278,000 / 600,000 = ~46.3% -> Situation normale (< 70%)
      saveBudget({ category: 'GLOBAL', allocatedAmount: 600000, month: m, year: y, isGlobal: true });
    } else if (scenario === 'warning') {
      // 278,000 / 360,000 = ~77.2% -> Attention (70 à 89%)
      saveBudget({ category: 'GLOBAL', allocatedAmount: 360000, month: m, year: y, isGlobal: true });
    } else if (scenario === 'critical') {
      // 278,000 / 295,000 = ~94.2% -> Proche de la limite (90 à 99%)
      saveBudget({ category: 'GLOBAL', allocatedAmount: 295000, month: m, year: y, isGlobal: true });
    } else if (scenario === 'exceeded') {
      // 278,000 / 220,000 = ~126.3% -> Budget dépassé (>= 100%)
      saveBudget({ category: 'GLOBAL', allocatedAmount: 220000, month: m, year: y, isGlobal: true });
    }
  };

  const addSavingsGoal = (
    nameOrData:
      | string
      | {
          name: string;
          targetAmount: number;
          initialAmount?: number;
          targetDate?: string;
          description?: string;
          iconName?: string;
        },
    targetAmountParam?: number,
    initialAmountParam: number = 0,
    targetDateParam?: string,
    descriptionParam?: string,
    iconNameParam?: string
  ): { success: boolean; message: string; goal?: SavingsGoal } => {
    let name = '';
    let target = 0;
    let initial = 0;
    let targetDate: string | undefined = undefined;
    let description: string | undefined = undefined;
    let iconName = 'Target';

    if (typeof nameOrData === 'object') {
      name = nameOrData.name.trim();
      target = Math.abs(Number(nameOrData.targetAmount) || 0);
      initial = Math.abs(Number(nameOrData.initialAmount) || 0);
      targetDate = nameOrData.targetDate ? nameOrData.targetDate.trim() : undefined;
      description = nameOrData.description ? nameOrData.description.trim() : undefined;
      iconName = nameOrData.iconName || 'Target';
    } else {
      name = nameOrData.trim();
      target = Math.abs(Number(targetAmountParam) || 0);
      initial = Math.abs(Number(initialAmountParam) || 0);
      targetDate = targetDateParam ? targetDateParam.trim() : undefined;
      description = descriptionParam ? descriptionParam.trim() : undefined;
      iconName = iconNameParam || 'Target';
    }

    if (!name) {
      return { success: false, message: "Le nom de l'objectif est obligatoire." };
    }
    if (target <= 0) {
      return { success: false, message: 'Le montant cible doit être supérieur à 0 FCFA.' };
    }

    const goalId = 's-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const newGoal: SavingsGoal = {
      id: goalId,
      name,
      targetAmount: target,
      currentAmount: initial,
      targetDate,
      description,
      iconName,
      createdAt: Date.now()
    };

    setSavingsGoals(prev => [newGoal, ...prev]);

    // If there is an initial amount, record it as first deposit movement
    if (initial > 0) {
      const now = new Date();
      const firstMovement: SavingsMovement = {
        id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        goalId,
        type: 'DEPOSIT',
        amount: initial,
        date: now.toISOString().split('T')[0],
        timestamp: now.getTime(),
        note: 'Constitution initiale du fonds'
      };
      setSavingsMovements(prev => [firstMovement, ...prev]);
    }

    return {
      success: true,
      message: `Objectif « ${name} » créé avec succès !`,
      goal: newGoal
    };
  };

  const updateSavingsGoal = (
    id: string,
    updates: Partial<{
      name: string;
      targetAmount: number;
      targetDate?: string;
      description?: string;
      iconName?: string;
    }>
  ): { success: boolean; message: string } => {
    const target = savingsGoals.find(g => g.id === id);
    if (!target) return { success: false, message: 'Objectif introuvable.' };

    const nextName = updates.name !== undefined ? updates.name.trim() : target.name;
    if (!nextName) {
      return { success: false, message: "Le nom de l'objectif ne peut pas être vide." };
    }

    const nextTarget =
      updates.targetAmount !== undefined ? Math.abs(Number(updates.targetAmount)) : target.targetAmount;
    if (nextTarget <= 0) {
      return { success: false, message: 'Le montant cible doit être supérieur à 0 FCFA.' };
    }

    setSavingsGoals(prev =>
      prev.map(g =>
        g.id === id
          ? {
              ...g,
              name: nextName,
              targetAmount: nextTarget,
              targetDate: updates.targetDate !== undefined ? updates.targetDate : g.targetDate,
              description: updates.description !== undefined ? updates.description : g.description,
              iconName: updates.iconName || g.iconName
            }
          : g
      )
    );

    return { success: true, message: `Objectif « ${nextName} » mis à jour avec succès.` };
  };

  const deleteSavingsGoal = (id: string): { success: boolean; message: string } => {
    const target = savingsGoals.find(g => g.id === id);
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    // Clean up associated movements
    setSavingsMovements(prev => prev.filter(m => m.goalId !== id));
    return {
      success: true,
      message: target ? `Objectif « ${target.name} » supprimé.` : 'Objectif supprimé.'
    };
  };

  const addSavingsDeposit = (
    goalId: string,
    amount: number,
    date?: string,
    note?: string
  ): { success: boolean; message: string } => {
    const targetGoal = savingsGoals.find(g => g.id === goalId);
    if (!targetGoal) {
      return { success: false, message: "Objectif d'épargne introuvable." };
    }

    const depositAmount = Math.abs(Number(amount));
    if (depositAmount <= 0) {
      return { success: false, message: 'Le montant du versement doit être supérieur à 0.' };
    }

    const now = date ? new Date(date) : new Date();
    const movementDate = date || now.toISOString().split('T')[0];

    const newMovement: SavingsMovement = {
      id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      goalId,
      type: 'DEPOSIT',
      amount: depositAmount,
      date: movementDate,
      timestamp: now.getTime(),
      note: note ? note.trim() : undefined
    };

    // Update goal amount
    setSavingsGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, currentAmount: g.currentAmount + depositAmount } : g))
    );

    // Append to movements
    setSavingsMovements(prev => [newMovement, ...prev]);

    // Record corresponding cash outflow in transactions so budget & balance stay synchronized
    addExpense(
      `Épargne : ${targetGoal.name}`,
      depositAmount,
      'Épargne',
      movementDate,
      note ? `Versement épargne - ${note}` : `Dépôt sur l'objectif ${targetGoal.name}`,
      'Compte bancaire'
    );

    return {
      success: true,
      message: `Versement de ${formatFCFA(depositAmount)} sur « ${targetGoal.name} » effectué !`
    };
  };

  const withdrawSavings = (
    goalId: string,
    amount: number,
    date?: string,
    note?: string
  ): { success: boolean; message: string } => {
    const targetGoal = savingsGoals.find(g => g.id === goalId);
    if (!targetGoal) {
      return { success: false, message: "Objectif d'épargne introuvable." };
    }

    const withdrawAmount = Math.abs(Number(amount));
    if (withdrawAmount <= 0) {
      return { success: false, message: 'Le montant du retrait doit être supérieur à 0.' };
    }

    if (withdrawAmount > targetGoal.currentAmount) {
      return {
        success: false,
        message: `Solde insuffisant : vous disposez actuellement de ${formatFCFA(targetGoal.currentAmount)} sur cet objectif.`
      };
    }

    const now = date ? new Date(date) : new Date();
    const movementDate = date || now.toISOString().split('T')[0];

    const newMovement: SavingsMovement = {
      id: 'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      goalId,
      type: 'WITHDRAWAL',
      amount: withdrawAmount,
      date: movementDate,
      timestamp: now.getTime(),
      note: note ? note.trim() : undefined
    };

    // Update goal amount (decrease)
    setSavingsGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - withdrawAmount) } : g))
    );

    // Append to movements
    setSavingsMovements(prev => [newMovement, ...prev]);

    // Record corresponding income cash inflow back to liquid balance
    addIncome(
      `Retrait épargne : ${targetGoal.name}`,
      withdrawAmount,
      'Transfert reçu',
      movementDate,
      note ? `Retrait épargne - ${note}` : `Retrait depuis l'objectif ${targetGoal.name}`,
      'Compte bancaire'
    );

    return {
      success: true,
      message: `Retrait de ${formatFCFA(withdrawAmount)} depuis « ${targetGoal.name} » enregistré !`
    };
  };

  const getSavingsMovements = (goalId?: string): SavingsMovement[] => {
    if (goalId) {
      return savingsMovements
        .filter(m => m.goalId === goalId)
        .sort((a, b) => b.timestamp - a.timestamp);
    }
    return [...savingsMovements].sort((a, b) => b.timestamp - a.timestamp);
  };

  const deleteSavingsMovement = (movementId: string): { success: boolean; message: string } => {
    const movement = savingsMovements.find(m => m.id === movementId);
    if (!movement) return { success: false, message: 'Mouvement introuvable.' };

    setSavingsMovements(prev => prev.filter(m => m.id !== movementId));

    // Revert amount on goal
    if (movement.type === 'DEPOSIT') {
      setSavingsGoals(prev =>
        prev.map(g =>
          g.id === movement.goalId
            ? { ...g, currentAmount: Math.max(0, g.currentAmount - movement.amount) }
            : g
        )
      );
    } else {
      setSavingsGoals(prev =>
        prev.map(g =>
          g.id === movement.goalId
            ? { ...g, currentAmount: g.currentAmount + movement.amount }
            : g
        )
      );
    }

    return { success: true, message: 'Mouvement supprimé et solde ajusté.' };
  };

  const contributeToSavings = (goalId: string, amount: number) => {
    addSavingsDeposit(goalId, amount);
  };

  // Evaluate financial notifications on budget, transaction or savings updates
  useEffect(() => {
    if (!notificationSettings.enabled) return;
    try {
      const { newNotifications } = evaluateFinancialNotifications({
        budgets,
        transactions,
        savingsGoals,
        settings: notificationSettings,
        existingNotifications: notifications,
        currency
      });
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    } catch (e) {
      console.error('Erreur évaluation notifications budgétaires', e);
    }
  }, [budgets, transactions, savingsGoals, notificationSettings, currency]);

  // Security handlers
  const setPinCredentials = (hash: string, salt: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      pinHash: hash,
      pinSalt: salt,
      hasSetupPin: true,
      isLockEnabled: true
    }));
  };

  const disablePin = () => {
    setSecuritySettings(prev => ({
      ...prev,
      pinHash: undefined,
      pinSalt: undefined,
      hasSetupPin: false,
      isLockEnabled: false,
      isBiometricsEnabled: false
    }));
    setIsAppLocked(false);
  };

  const toggleLock = (enabled: boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      isLockEnabled: enabled
    }));
  };

  const toggleBiometrics = (enabled: boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      isBiometricsEnabled: enabled
    }));
  };

  const lockApp = () => {
    if (securitySettings.isLockEnabled && securitySettings.hasSetupPin) {
      setIsAppLocked(true);
    }
  };

  const unlockApp = () => {
    setIsAppLocked(false);
  };

  // Notification handlers
  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const triggerTestNotification = (
    type: 'BUDGET_70' | 'BUDGET_90' | 'BUDGET_EXCEEDED' | 'SAVINGS_REMINDER' = 'BUDGET_90'
  ) => {
    const id = `test_notif_${Date.now()}`;
    let title = 'Alerte budgétaire 90%';
    let message = `Attention, 90 % de votre budget alimentation a été consommé.`;
    let level: 'info' | 'warning' | 'danger' = 'warning';
    let linkScreen: ScreenName = 'budgets';

    if (type === 'BUDGET_70') {
      title = 'Avertissement 70% : Budget Loisirs';
      message = 'Votre budget a atteint 70% de consommation (solde disponible : 45 000 FCFA).';
      level = 'info';
    } else if (type === 'BUDGET_EXCEEDED') {
      title = 'Dépassement de budget !';
      message = 'Alerte critique : Le budget Transport a été dépassé de 15 000 FCFA.';
      level = 'danger';
    } else if (type === 'SAVINGS_REMINDER') {
      title = 'Rappel Objectif d’Épargne';
      message = 'Votre objectif « Fonds d’urgence » est à 65% de son but. Prochaine échéance dans 7 jours.';
      level = 'info';
      linkScreen = 'savings';
    }

    const newNotif: AppNotification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      level,
      linkScreen
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Send native system notification if enabled
    if (notificationSettings.systemNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: message });
      } catch {}
    }

    return newNotif;
  };

  const resetToDefaultData = () => {
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS.map(normalizeTransaction));
    setBudgets(INITIAL_BUDGETS);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setSavingsMovements(INITIAL_SAVINGS_MOVEMENTS);
    setNotifications([]);
  };

  const exportDataJson = () => {
    const data = {
      app: 'Mon Budget Android',
      currency,
      exportDate: new Date().toISOString(),
      categories,
      transactions,
      budgets,
      savingsGoals,
      savingsMovements,
      securitySettings: {
        isLockEnabled: securitySettings.isLockEnabled,
        isBiometricsEnabled: securitySettings.isBiometricsEnabled,
        hasSetupPin: securitySettings.hasSetupPin
        // Note: PIN hash and cleartext are NEVER exported in backups for security
      },
      notificationSettings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mon_budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonContent: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Fichier JSON non valide.' };
      }

      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions.map(normalizeTransaction));
      }
      if (Array.isArray(data.budgets)) {
        setBudgets(data.budgets);
      }
      if (Array.isArray(data.savingsGoals)) {
        setSavingsGoals(data.savingsGoals);
      }
      if (Array.isArray(data.savingsMovements)) {
        setSavingsMovements(data.savingsMovements);
      }
      if (typeof data.currency === 'string') {
        setCurrency(data.currency);
      }
      if (data.notificationSettings && typeof data.notificationSettings === 'object') {
        setNotificationSettings(prev => ({ ...prev, ...data.notificationSettings }));
      }

      return { success: true, message: 'Données restaurées avec succès !' };
    } catch (e: any) {
      return { success: false, message: `Erreur lors de l’importation : ${e.message || 'Format invalide'}` };
    }
  };

  // Écoute des changements de connectivité réseau et session Firebase
  useEffect(() => {
    const handleOnline = () => {
      setSyncInfo(prev => ({ ...prev, state: 'idle' }));
    };
    const handleOffline = () => {
      setSyncInfo(prev => ({ ...prev, state: 'offline' }));
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeAuth = CloudSyncService.initAuthListener((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeAuth();
    };
  }, []);

  // Synchronisation Cloud bi-directionnelle avec dédoublonnage & résolution de conflits
  const performCloudSync = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Veuillez vous connecter pour sauvegarder et synchroniser vos données dans le Cloud.'
      };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncInfo(prev => ({ ...prev, state: 'offline' }));
      return {
        success: false,
        message: 'Appareil hors ligne. Vos données restent conservées localement dans la base Room.'
      };
    }

    setSyncInfo(prev => ({ ...prev, state: 'syncing', errorMessage: undefined }));

    try {
      // Simuler latence réseau réaliste pour feedback UI
      await new Promise(res => setTimeout(res, 500));

      const remoteBackup = await CloudSyncService.getCloudBackup(currentUser.uid);

      if (remoteBackup) {
        // Fusion des données locales avec les données distantes
        const merged = CloudSyncService.mergeData(
          {
            categories,
            transactions,
            budgets,
            savingsGoals,
            savingsMovements,
            currency
          },
          remoteBackup
        );

        setCategories(merged.categories);
        setTransactions(merged.transactions);
        setBudgets(merged.budgets);
        setSavingsGoals(merged.savingsGoals);
        setSavingsMovements(merged.savingsMovements);
        if (merged.currency) {
          setCurrency(merged.currency);
        }

        // Sauvegarder l'état réconcilié vers le Cloud Firestore
        await CloudSyncService.saveToCloud({
          uid: currentUser.uid,
          updatedAt: Date.now(),
          currency: merged.currency,
          categories: merged.categories,
          transactions: merged.transactions,
          budgets: merged.budgets,
          savingsGoals: merged.savingsGoals,
          savingsMovements: merged.savingsMovements,
          notificationSettings
        });

        const syncTimestamp = Date.now();
        setSyncInfo({
          state: 'success',
          lastSyncedAt: syncTimestamp,
          pendingChangesCount: 0
        });

        return {
          success: true,
          message: `Synchronisation réussie ! (${merged.addedCount} élément(s) fusionné(s))`
        };
      } else {
        // Première sauvegarde pour ce compte
        await CloudSyncService.saveToCloud({
          uid: currentUser.uid,
          updatedAt: Date.now(),
          currency,
          categories,
          transactions,
          budgets,
          savingsGoals,
          savingsMovements,
          notificationSettings
        });

        const syncTimestamp = Date.now();
        setSyncInfo({
          state: 'success',
          lastSyncedAt: syncTimestamp,
          pendingChangesCount: 0
        });

        return {
          success: true,
          message: 'Sauvegarde Cloud initiale créée avec succès !'
        };
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Erreur inattendue';
      setSyncInfo(prev => ({
        ...prev,
        state: 'error',
        errorMessage: errMsg
      }));
      return {
        success: false,
        message: `Échec de synchronisation : ${errMsg}`
      };
    }
  };

  const loginUser = (user: UserAccount) => {
    setCurrentUser(user);
    // Déclenche une récupération / fusion automatique dès la connexion
    setTimeout(async () => {
      try {
        const remote = await CloudSyncService.getCloudBackup(user.uid);
        if (remote) {
          const merged = CloudSyncService.mergeData(
            {
              categories,
              transactions,
              budgets,
              savingsGoals,
              savingsMovements,
              currency
            },
            remote
          );
          setCategories(merged.categories);
          setTransactions(merged.transactions);
          setBudgets(merged.budgets);
          setSavingsGoals(merged.savingsGoals);
          setSavingsMovements(merged.savingsMovements);
          if (merged.currency) {
            setCurrency(merged.currency);
          }
          setSyncInfo({
            state: 'success',
            lastSyncedAt: Date.now(),
            pendingChangesCount: 0
          });
        }
      } catch (e) {
        console.warn('Erreur récupération cloud après connexion:', e);
      }
    }, 150);
  };

  const logoutUser = async () => {
    await CloudSyncService.signOut();
    setCurrentUser(null);
    setSyncInfo(prev => ({ ...prev, state: 'idle' }));
  };

  return {
    categories,
    expenseCategories,
    incomeCategories,
    transactions,
    budgets,
    savingsGoals,
    savingsMovements,
    summary,
    darkTheme,
    currency,
    setCurrency,
    setDarkTheme,
    // Security
    securitySettings,
    isAppLocked,
    setPinCredentials,
    disablePin,
    toggleLock,
    toggleBiometrics,
    lockApp,
    unlockApp,
    // Notifications
    notificationSettings,
    notifications,
    updateNotificationSettings,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    triggerTestNotification,
    // Cloud & Authentication
    currentUser,
    syncInfo,
    performCloudSync,
    loginUser,
    logoutUser,
    // CRUD & Operations
    addCategory,
    updateCategory,
    deleteCategory,
    isCategoryUsed,
    addTransaction,
    updateTransaction,
    addIncome,
    addExpense,
    deleteTransaction,
    addBudget,
    saveBudget,
    updateBudget,
    deleteBudget,
    setGlobalBudget,
    applyBudgetTestScenario,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsDeposit,
    withdrawSavings,
    getSavingsMovements,
    deleteSavingsMovement,
    contributeToSavings,
    resetToDefaultData,
    exportDataJson,
    importDataJson
  };
}
