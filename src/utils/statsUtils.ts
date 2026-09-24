import { Transaction, Category } from '../types';

export type StatPeriod = 'THIS_MONTH' | 'PREV_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startMs: number;
  endMs: number;
  label: string;
  numDays: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  icon: string;
}

export interface TrendPoint {
  id: string;
  label: string;
  dateStr: string;
  income: number;
  expense: number;
  net: number;
  cumulativeBalance: number;
}

export interface MonthlyBreakdown {
  monthIndex: number; // 0-11
  year: number;
  monthName: string;
  shortMonthName: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  transactionCount: number;
}

export interface AnnualStats {
  year: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  monthlyAverageIncome: number;
  monthlyAverageExpense: number;
  highestExpenseMonth: { monthName: string; amount: number } | null;
  highestIncomeMonth: { monthName: string; amount: number } | null;
  mostProfitableMonth: { monthName: string; net: number } | null;
  monthlyBreakdowns: MonthlyBreakdown[];
}

export interface StatsCalculationResult {
  period: StatPeriod;
  dateRange: DateRange;
  filteredTransactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  expenseRatio: number;
  topExpenseCategory: CategoryStat | null;
  topIncomeCategory: CategoryStat | null;
  averageExpensePerDay: number;
  averageExpensePerTransaction: number;
  averageIncomePerDay: number;
  averageIncomePerTransaction: number;
  expensesByCategory: CategoryStat[];
  incomesByCategory: CategoryStat[];
  trendPoints: TrendPoint[];
  monthlyBreakdowns: MonthlyBreakdown[];
  annualStats: AnnualStats;
}

export const MONTH_NAMES_FR_FULL = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const MONTH_NAMES_FR_SHORT = [
  'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

/**
 * Format a Date to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD safely to noon timestamp
 */
export function parseDateSafe(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 12, 0, 0);
  }
  return new Date(dateStr);
}

/**
 * Calculate DateRange according to the selected period,
 * properly handling year transitions (e.g. crossing Jan/Dec).
 */
export function computeDateRange(
  period: StatPeriod,
  customStart?: string,
  customEnd?: string,
  refDate: Date = new Date()
): DateRange {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth();

  let startDate: Date;
  let endDate: Date;
  let label = '';

  switch (period) {
    case 'THIS_MONTH': {
      startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      label = `${MONTH_NAMES_FR_FULL[currentMonth]} ${currentYear}`;
      break;
    }
    case 'PREV_MONTH': {
      // Month - 1 naturally goes to Dec of previous year if currentMonth is 0
      startDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
      const prevMonthIdx = startDate.getMonth();
      const prevMonthYear = startDate.getFullYear();
      label = `${MONTH_NAMES_FR_FULL[prevMonthIdx]} ${prevMonthYear}`;
      break;
    }
    case 'LAST_3_MONTHS': {
      startDate = new Date(currentYear, currentMonth - 2, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      label = `3 derniers mois (${MONTH_NAMES_FR_SHORT[startDate.getMonth()]} - ${MONTH_NAMES_FR_SHORT[currentMonth]} ${currentYear})`;
      break;
    }
    case 'THIS_YEAR': {
      startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      label = `Année ${currentYear}`;
      break;
    }
    case 'CUSTOM': {
      if (customStart && customEnd) {
        const [sy, sm, sd] = customStart.split('-').map(Number);
        const [ey, em, ed] = customEnd.split('-').map(Number);
        startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      } else {
        startDate = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
        endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      }
      label = `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
      break;
    }
  }

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const diffTime = Math.abs(endMs - startMs);
  const numDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    startDate: formatDateISO(startDate),
    endDate: formatDateISO(endDate),
    startMs,
    endMs,
    label,
    numDays
  };
}

/**
 * Main statistics calculation function based entirely on recorded Room transactions.
 */
export function calculateFinancialStats(
  transactions: Transaction[],
  categories: Category[],
  period: StatPeriod,
  customStart?: string,
  customEnd?: string,
  refDate: Date = new Date()
): StatsCalculationResult {
  const dateRange = computeDateRange(period, customStart, customEnd, refDate);

  // Map categories for fast icon & color lookup
  const categoryMap = new Map<string, Category>();
  categories.forEach(c => categoryMap.set(c.name, c));

  // Filter transactions within the exact time window
  const filtered = transactions.filter(tx => {
    const parsed = parseDateSafe(tx.date);
    const t = parsed.getTime();
    return t >= dateRange.startMs && t <= dateRange.endMs;
  });

  // Sort chronologically for trends
  const chronological = [...filtered].sort((a, b) => {
    const timeA = parseDateSafe(a.date).getTime();
    const timeB = parseDateSafe(b.date).getTime();
    return timeA - timeB;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let expenseTxCount = 0;
  let incomeTxCount = 0;

  const expenseCategoryMap: Record<string, { amount: number; count: number }> = {};
  const incomeCategoryMap: Record<string, { amount: number; count: number }> = {};

  filtered.forEach(tx => {
    const cat = tx.category || 'Autre';
    if (tx.type === 'INCOME') {
      totalIncome += tx.amount;
      incomeTxCount++;
      if (!incomeCategoryMap[cat]) incomeCategoryMap[cat] = { amount: 0, count: 0 };
      incomeCategoryMap[cat].amount += tx.amount;
      incomeCategoryMap[cat].count++;
    } else {
      totalExpense += tx.amount;
      expenseTxCount++;
      if (!expenseCategoryMap[cat]) expenseCategoryMap[cat] = { amount: 0, count: 0 };
      expenseCategoryMap[cat].amount += tx.amount;
      expenseCategoryMap[cat].count++;
    }
  });

  const netBalance = totalIncome - totalExpense;

  // Exact savings rate: (totalIncome - totalExpense) / totalIncome * 100
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10)
      : 0;

  const expenseRatio =
    totalIncome > 0
      ? Math.round((totalExpense / totalIncome) * 1000) / 10
      : totalExpense > 0 ? 100 : 0;

  // Categories breakdown
  const defaultColors = [
    '#ef4444', '#f97316', '#8b5cf6', '#eab308', '#06b6d4',
    '#3b82f6', '#14b8a6', '#ec4899', '#6366f1', '#d946ef',
    '#10b981', '#f43f5e', '#64748b', '#a855f7', '#0284c7'
  ];

  const expensesByCategory: CategoryStat[] = Object.entries(expenseCategoryMap)
    .map(([catName, data], idx) => {
      const catObj = categoryMap.get(catName);
      return {
        category: catName,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 1000) / 10 : 0,
        color: catObj?.color || defaultColors[idx % defaultColors.length],
        icon: catObj?.icon || 'Tag'
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const incomesByCategory: CategoryStat[] = Object.entries(incomeCategoryMap)
    .map(([catName, data], idx) => {
      const catObj = categoryMap.get(catName);
      return {
        category: catName,
        amount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? Math.round((data.amount / totalIncome) * 1000) / 10 : 0,
        color: catObj?.color || '#10b981',
        icon: catObj?.icon || 'Briefcase'
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const topExpenseCategory = expensesByCategory.length > 0 ? expensesByCategory[0] : null;
  const topIncomeCategory = incomesByCategory.length > 0 ? incomesByCategory[0] : null;

  // Averages
  const averageExpensePerDay = Math.round(totalExpense / dateRange.numDays);
  const averageExpensePerTransaction = expenseTxCount > 0 ? Math.round(totalExpense / expenseTxCount) : 0;
  const averageIncomePerDay = Math.round(totalIncome / dateRange.numDays);
  const averageIncomePerTransaction = incomeTxCount > 0 ? Math.round(totalIncome / incomeTxCount) : 0;

  // --- Chronological Trend Points ---
  // If period spans <= 45 days: group daily. If > 45 days: group monthly.
  const isMultiMonth = dateRange.numDays > 45;
  const trendPoints: TrendPoint[] = [];

  if (!isMultiMonth) {
    // Generate every day in the date range
    const cur = new Date(dateRange.startMs);
    const end = new Date(dateRange.endMs);
    let runningBalance = 0;

    // Group transactions by YYYY-MM-DD
    const txByDay = new Map<string, { income: number; expense: number }>();
    chronological.forEach(tx => {
      const dayStr = tx.date;
      const curVal = txByDay.get(dayStr) || { income: 0, expense: 0 };
      if (tx.type === 'INCOME') curVal.income += tx.amount;
      else curVal.expense += tx.amount;
      txByDay.set(dayStr, curVal);
    });

    while (cur.getTime() <= end.getTime()) {
      const dayStr = formatDateISO(cur);
      const data = txByDay.get(dayStr) || { income: 0, expense: 0 };
      const net = data.income - data.expense;
      runningBalance += net;

      trendPoints.push({
        id: `day-${dayStr}`,
        label: `${cur.getDate()} ${MONTH_NAMES_FR_SHORT[cur.getMonth()]}`,
        dateStr: dayStr,
        income: data.income,
        expense: data.expense,
        net,
        cumulativeBalance: runningBalance
      });

      // Advance by 1 day
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    // Group by month
    const cur = new Date(dateRange.startMs);
    cur.setDate(1);
    const end = new Date(dateRange.endMs);
    let runningBalance = 0;

    // Group transactions by "YYYY-MM"
    const txByMonth = new Map<string, { income: number; expense: number }>();
    chronological.forEach(tx => {
      const [y, m] = tx.date.split('-');
      const monthKey = `${y}-${m}`;
      const curVal = txByMonth.get(monthKey) || { income: 0, expense: 0 };
      if (tx.type === 'INCOME') curVal.income += tx.amount;
      else curVal.expense += tx.amount;
      txByMonth.set(monthKey, curVal);
    });

    while (cur.getFullYear() < end.getFullYear() || (cur.getFullYear() === end.getFullYear() && cur.getMonth() <= end.getMonth())) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const data = txByMonth.get(monthKey) || { income: 0, expense: 0 };
      const net = data.income - data.expense;
      runningBalance += net;

      trendPoints.push({
        id: `month-${monthKey}`,
        label: `${MONTH_NAMES_FR_SHORT[m]} ${y !== refDate.getFullYear() ? `'${String(y).slice(2)}` : ''}`.trim(),
        dateStr: `${monthKey}-01`,
        income: data.income,
        expense: data.expense,
        net,
        cumulativeBalance: runningBalance
      });

      // Advance by 1 month
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  // --- Monthly breakdown & Annual stats for current target year ---
  const targetYear = period === 'PREV_MONTH' ? new Date(dateRange.startMs).getFullYear() : refDate.getFullYear();
  const yearTransactions = transactions.filter(tx => {
    const [y] = tx.date.split('-').map(Number);
    return y === targetYear;
  });

  const monthlyBreakdowns: MonthlyBreakdown[] = [];
  let annualIncome = 0;
  let annualExpense = 0;

  for (let m = 0; m < 12; m++) {
    const monthTxs = yearTransactions.filter(tx => {
      const parts = tx.date.split('-').map(Number);
      return parts[1] - 1 === m;
    });

    let mIncome = 0;
    let mExpense = 0;
    monthTxs.forEach(tx => {
      if (tx.type === 'INCOME') mIncome += tx.amount;
      else mExpense += tx.amount;
    });

    annualIncome += mIncome;
    annualExpense += mExpense;

    const mNet = mIncome - mExpense;
    const mSavingsRate = mIncome > 0 ? Math.max(0, Math.round((mNet / mIncome) * 1000) / 10) : 0;

    monthlyBreakdowns.push({
      monthIndex: m,
      year: targetYear,
      monthName: MONTH_NAMES_FR_FULL[m],
      shortMonthName: MONTH_NAMES_FR_SHORT[m],
      income: mIncome,
      expense: mExpense,
      net: mNet,
      savingsRate: mSavingsRate,
      transactionCount: monthTxs.length
    });
  }

  // Highest expense month
  let highestExpMonth: { monthName: string; amount: number } | null = null;
  let highestIncMonth: { monthName: string; amount: number } | null = null;
  let mostProfitableMonth: { monthName: string; net: number } | null = null;

  monthlyBreakdowns.forEach(mb => {
    if (mb.expense > 0 && (!highestExpMonth || mb.expense > highestExpMonth.amount)) {
      highestExpMonth = { monthName: mb.monthName, amount: mb.expense };
    }
    if (mb.income > 0 && (!highestIncMonth || mb.income > highestIncMonth.amount)) {
      highestIncMonth = { monthName: mb.monthName, amount: mb.income };
    }
    if (!mostProfitableMonth || mb.net > mostProfitableMonth.net) {
      mostProfitableMonth = { monthName: mb.monthName, net: mb.net };
    }
  });

  const annualNet = annualIncome - annualExpense;
  const annualSavingsRate = annualIncome > 0 ? Math.max(0, Math.round((annualNet / annualIncome) * 1000) / 10) : 0;
  // Calculate active months (up to current month if targetYear == currentYear)
  const monthsCount = targetYear === refDate.getFullYear() ? Math.max(1, refDate.getMonth() + 1) : 12;
  const monthlyAverageIncome = Math.round(annualIncome / monthsCount);
  const monthlyAverageExpense = Math.round(annualExpense / monthsCount);

  const annualStats: AnnualStats = {
    year: targetYear,
    totalIncome: annualIncome,
    totalExpense: annualExpense,
    netBalance: annualNet,
    savingsRate: annualSavingsRate,
    monthlyAverageIncome,
    monthlyAverageExpense,
    highestExpenseMonth: highestExpMonth,
    highestIncomeMonth: highestIncMonth,
    mostProfitableMonth,
    monthlyBreakdowns
  };

  return {
    period,
    dateRange,
    filteredTransactions: filtered,
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    expenseRatio,
    topExpenseCategory,
    topIncomeCategory,
    averageExpensePerDay,
    averageExpensePerTransaction,
    averageIncomePerDay,
    averageIncomePerTransaction,
    expensesByCategory,
    incomesByCategory,
    trendPoints,
    monthlyBreakdowns,
    annualStats
  };
}
