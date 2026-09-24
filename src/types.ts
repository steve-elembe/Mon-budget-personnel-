export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMethod =
  | 'Espèces'
  | 'MTN Mobile Money'
  | 'Orange Money'
  | 'Compte bancaire'
  | 'Carte bancaire'
  | 'Autre';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Lucide icon name identifier
  color?: string; // Optional accent color code or tailwind color
  isCustom?: boolean; // true if created by the user, false if default
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  title?: string; // Kept for backwards compatibility
  date: string; // ISO date string YYYY-MM-DD
  timestamp?: number;
  paymentMethod: PaymentMethod;
  note?: string;
}

export type BudgetAlertStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';

export interface Budget {
  id: string;
  category: string; // 'GLOBAL' or category name
  allocatedAmount: number; // montant prévu
  month: number; // 0-11
  year: number;
  isGlobal?: boolean; // true if global monthly budget
}

export interface BudgetCalculation {
  budget: Budget;
  allocatedAmount: number; // montant prévu
  spentAmount: number; // dépenses réalisées basées sur les transactions réelles
  remainingAmount: number; // budget restant = budget prévu - dépenses réalisées
  percentage: number; // pourcentage consommé
  alertStatus: BudgetAlertStatus;
  alertLabel: string;
  isExceeded: boolean;
  exceededAmount: number;
}

export type SavingsMovementType = 'DEPOSIT' | 'WITHDRAWAL';

export interface SavingsMovement {
  id: string;
  goalId: string;
  type: SavingsMovementType;
  amount: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD (facultative)
  description?: string; // description facultative
  iconName?: string;
  createdAt?: number;
}

export interface DashboardSummary {
  currentBalance: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
  remainingBudget: number;
  totalBudget: number;
  budgetSpent: number;
  budgetPercentage: number;
  budgetAlertStatus: BudgetAlertStatus;
  budgetAlertLabel: string;
  isBudgetExceeded: boolean;
  totalSavings: number;
  targetSavings: number;
}

export type ScreenName =
  | 'dashboard'
  | 'income'
  | 'expense'
  | 'transactions'
  | 'budgets'
  | 'savings'
  | 'stats'
  | 'assistant'
  | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isOfflineFallback?: boolean;
}

export interface FinancialCalculatedContext {
  currency: string;
  currentMonth: string;
  currentYear: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
  netSavingsMonth: number;
  savingsRatePercentage: number;
  topExpenseCategory: {
    name: string;
    amount: number;
    percentage: number;
    count: number;
  } | null;
  expenseCategoriesBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  budgetStatus: {
    totalAllocated: number;
    totalSpent: number;
    remainingBudget: number;
    percentageConsumed: number;
    isExceeded: boolean;
    exceededAmount: number;
    categoriesOverBudget: Array<{
      category: string;
      allocated: number;
      spent: number;
      exceededBy: number;
    }>;
    categoriesWarningBudget: Array<{
      category: string;
      allocated: number;
      spent: number;
      percentage: number;
    }>;
  };
  savingsStatus: {
    totalSaved: number;
    totalTarget: number;
    progressPercentage: number;
    goals: Array<{
      name: string;
      currentAmount: number;
      targetAmount: number;
      progressPercentage: number;
      targetDate?: string;
    }>;
    recentMovementsCount: number;
  };
  trends: {
    previousMonthExpenses: number;
    previousMonthIncome: number;
    expenseVariationPercentage: number;
    expenseByPaymentMethod: Record<string, number>;
    averageExpensePerTransaction: number;
    totalTransactionsMonthCount: number;
  };
}

export interface SecuritySettings {
  isLockEnabled: boolean;
  pinHash?: string; // SHA-256 (jamais stocké en clair)
  pinSalt?: string; // Sel cryptographique
  isBiometricsEnabled: boolean;
  lockTimeoutMinutes: number; // 0 = immédiat
  hasSetupPin: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  alert70Enabled: boolean; // Alerte budget à 70%
  alert90Enabled: boolean; // Alerte budget à 90%
  alertExceededEnabled: boolean; // Alerte dépassement de budget (>= 100%)
  savingsRemindersEnabled: boolean; // Rappels objectifs d'épargne
  systemNotificationsEnabled: boolean; // Demande permission push système
}

export type AppNotificationType =
  | 'BUDGET_70'
  | 'BUDGET_90'
  | 'BUDGET_EXCEEDED'
  | 'SAVINGS_REMINDER'
  | 'SECURITY_ALERT'
  | 'SYSTEM_INFO';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  linkScreen?: ScreenName;
  level?: 'info' | 'warning' | 'danger' | 'success';
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  position: 'after' | 'before';
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  createdAt: number;
  lastLoginAt: number;
}

export type SyncState = 'idle' | 'syncing' | 'success' | 'offline' | 'error';

export interface CloudSyncInfo {
  state: SyncState;
  lastSyncedAt: number | null;
  pendingChangesCount: number;
  errorMessage?: string;
}

export interface CloudBackupPayload {
  uid: string;
  updatedAt: number;
  currency: string;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  savingsMovements: SavingsMovement[];
  notificationSettings?: NotificationSettings;
}
